# Suarasa - Generator Narasi

Web app untuk mengubah naskah menjadi audio MP3 berbahasa Indonesia atau Jawa dengan Gemini TTS.

## Fitur

- Pilih bahasa, gaya suara, karakter suara, dan tempo.
- Putar hasil audio atau unduh sebagai MP3.
- Narasi dikirim ke Gemini hanya saat tombol **Buat Audio MP3** ditekan.
- API key disimpan di server, tidak di kode halaman atau browser.

## Menjalankan secara lokal

Butuh Node.js 20.6 atau lebih baru dan koneksi internet.

1. Isi `.env` dengan API key baru:

   ```env
   GEMINI_API_KEY=isi_api_key_di_sini
   ```

2. Buka terminal di folder project dan jalankan:

   ```sh
   node --env-file=.env server.mjs
   ```

3. Buka <http://127.0.0.1:4173>.

Buat API key di [Google AI Studio](https://aistudio.google.com/apikey). Jangan bagikan atau commit `.env`. Kalau key pernah ditempel ke chat, cabut key itu dan buat yang baru.

## Deploy publik ke Netlify

1. Login dari terminal dengan `npx netlify-cli login`.
2. Dari folder project, build halaman dan deploy:

   ```sh
   node build.mjs
   npx netlify-cli deploy --prod --dir=dist --functions=netlify/functions
   ```

   Saat pertama kali deploy, pilih atau buat project Netlify untuk Suarasa.

3. Di pengaturan project Netlify, tambahkan environment variable `GEMINI_API_KEY` sebagai secret dengan scope **Functions** dan context **Production**. Deploy ulang setelah menyimpan key.

`netlify.toml` mengatur folder function dan build. `.env`, file konfigurasi CLI, dan folder hasil build tidak masuk ke folder yang dipublikasikan.

## Catatan keamanan dan penggunaan

Link publik bisa dipakai siapa saja. Setiap pembuatan audio memakai kuota API key pemilik project. Endpoint dibatasi 5 permintaan per menit per alamat IP untuk membantu mengurangi spam; batas ini bukan batas total pemakaian atau biaya. Pantau kuota Gemini dan cabut key jika ada penggunaan yang tidak dikenal.
