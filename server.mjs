import http from "node:http";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { synthesize, validateInput } from "./tts.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const maxBodyBytes = 5 * 1024 * 1024;
const assets = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]]
]);

function sendJson(response, status, value) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });
  response.end(JSON.stringify(value));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  let tooLarge = false;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) tooLarge = true;
    else if (!tooLarge) chunks.push(chunk);
  }
  if (tooLarge) {
    const error = new Error("Naskah terlalu besar untuk satu permintaan. Coba ringkas narasinya.");
    error.status = 413;
    throw error;
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Data permintaan tidak terbaca.");
    error.status = 400;
    throw error;
  }
}

const server = http.createServer(async function (request, response) {
  const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
  if (request.method === "POST" && requestUrl.pathname === "/api/synthesize") {
    try {
      const input = await readJson(request);
      if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_API_KEY.trim()) {
        return sendJson(response, 503, { error: "Isi GEMINI_API_KEY di file .env, lalu restart server." });
      }
      const audio = await synthesize(validateInput(input), process.env.GEMINI_API_KEY);
      response.writeHead(200, {
        "content-type": "audio/mpeg",
        "content-disposition": 'attachment; filename="suarasa-narasi.mp3"',
        "cache-control": "no-store",
        "x-content-type-options": "nosniff"
      });
      return response.end(audio);
    } catch (error) {
      return sendJson(response, error.status || 500, {
        error: error.message || "Terjadi kesalahan saat membuat audio."
      });
    }
  }

  if (request.method === "GET") {
    const asset = assets.get(requestUrl.pathname);
    if (asset) {
      try {
        const content = await readFile(path.join(root, asset[0]));
        response.writeHead(200, {
          "content-type": asset[1],
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
          "referrer-policy": "no-referrer"
        });
        return response.end(content);
      } catch {
        return sendJson(response, 500, { error: "File aplikasi tidak bisa dibaca." });
      }
    }
  }

  return sendJson(response, 404, { error: "Halaman tidak ditemukan." });
});

server.listen(port, "127.0.0.1", function () {
  console.log("Suarasa berjalan di http://127.0.0.1:" + port);
});
