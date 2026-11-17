import { synthesize, validateInput } from "../../tts.mjs";

const maxBodyBytes = 5 * 1024 * 1024;
const jsonHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" };

export default async function handler(request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > maxBodyBytes) {
      return Response.json({ error: "Naskah terlalu besar untuk satu permintaan. Coba ringkas narasinya." }, { status: 413, headers: jsonHeaders });
    }
    let input;
    try {
      const body = await request.text();
      if (new TextEncoder().encode(body).byteLength > maxBodyBytes) throw new Error("large");
      input = JSON.parse(body);
    } catch (error) {
      if (error.message === "large") {
        return Response.json({ error: "Naskah terlalu besar untuk satu permintaan. Coba ringkas narasinya." }, { status: 413, headers: jsonHeaders });
      }
      return Response.json({ error: "Data permintaan tidak terbaca." }, { status: 400, headers: jsonHeaders });
    }
    const apiKey = Netlify.env.get("GEMINI_API_KEY");
    if (!apiKey?.trim()) {
      return Response.json({ error: "GEMINI_API_KEY belum diatur sebagai secret pada hosting." }, { status: 503, headers: jsonHeaders });
    }
    const audio = await synthesize(validateInput(input), apiKey);
    if (audio.length > 4.5 * 1024 * 1024) {
      return Response.json({ error: "Audio terlalu besar untuk dikirim. Coba buat narasi yang lebih pendek." }, { status: 413, headers: jsonHeaders });
    }
    return new Response(audio, {
      headers: {
        "content-type": "audio/mpeg",
        "content-disposition": 'attachment; filename="suarasa-narasi.mp3"',
        "cache-control": "no-store",
        "x-content-type-options": "nosniff"
      }
    });
  } catch (error) {
    return Response.json({ error: error.message || "Terjadi kesalahan saat membuat audio." }, { status: error.status || 500, headers: jsonHeaders });
  }
}

export const config = {
  path: "/api/synthesize",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 5 }
};
