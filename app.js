const form = document.querySelector("#generator-form");
const narration = document.querySelector("#narration");
const characterCount = document.querySelector("#character-count");
const tempo = document.querySelector("#tempo");
const tempoValue = document.querySelector("#tempo-value");
const generateButton = document.querySelector("#generate-button");
const buttonLabel = document.querySelector("#button-label");
const statusMessage = document.querySelector("#status-message");
const resultPanel = document.querySelector("#result-panel");
const audioPlayer = document.querySelector("#audio-player");
const downloadLink = document.querySelector("#download-link");

let audioUrl = "";

narration.addEventListener("input", function () {
  characterCount.textContent = narration.value.length.toLocaleString("id-ID") + " karakter";
});

tempo.addEventListener("input", function () {
  tempoValue.value = Number(tempo.value).toFixed(2) + "×";
});

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  clearStatus();

  const data = new FormData(form);
  const request = {
    text: String(data.get("text") || ""),
    language: String(data.get("language") || ""),
    vibe: String(data.get("vibe") || ""),
    voice: String(data.get("voice") || ""),
    tempo: Number(data.get("tempo"))
  };

  if (!request.text.trim()) {
    showStatus("Tulis narasi yang ingin dibuat.", true);
    return;
  }

  setBusy(true);
  try {
    const response = await fetch("/api/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json().catch(function () { return {}; });
      throw new Error(error.error || "Audio belum berhasil dibuat. Coba lagi.");
    }

    const blob = await response.blob();
    if (!blob.size || !blob.type.includes("audio")) {
      throw new Error("Gemini tidak mengirim file audio. Coba lagi dengan narasi yang lebih singkat.");
    }

    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = URL.createObjectURL(blob);
    audioPlayer.src = audioUrl;
    downloadLink.href = audioUrl;
    resultPanel.hidden = false;
    showStatus("Selesai. Putar dulu atau unduh MP3-mu.");
    resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    showStatus(error.message || "Koneksi ke Gemini gagal. Periksa internet dan API key kamu.", true);
  } finally {
    setBusy(false);
  }
});

function setBusy(busy) {
  generateButton.disabled = busy;
  buttonLabel.textContent = busy ? "SEDANG MEMBUAT AUDIO…" : "BUAT AUDIO MP3";
}

function showStatus(message, isError) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", Boolean(isError));
}

function clearStatus() {
  statusMessage.textContent = "";
  statusMessage.classList.remove("error");
}

window.addEventListener("beforeunload", function () {
  if (audioUrl) URL.revokeObjectURL(audioUrl);
});
