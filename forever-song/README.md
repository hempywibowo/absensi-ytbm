# Lagu Abadi 🎵

Aplikasi pemesanan **lagu personal** (mirip ForeverSongs): pemesan memilih genre, untuk siapa, momen,
lalu menceritakan kenangan. Claude menulis lirik + chord, hasilnya tampil di halaman lagu yang bisa dibagikan.
Musik/audio lalu dipasang admin.

## Alur

1. **/buat**: form 5 langkah
   - Genre: 20 pilihan (Pop Indonesia, Pop Akustik, Ballad, Dangdut Koplo, Dangdut Klasik, Jazz, Rohani Kristen,
     Religi Islami, Sholawat, Keroncong, Pop Melayu, Campursari, Pop Sunda, R&B, Reggae, Pop Rock, Indie Folk,
     Lagu Anak, EDM, Hip-hop). 8 genre ditandai "Rekomendasi".
   - Untuk siapa (pasangan, istri, suami, ibu, ayah, anak, sahabat, guru, almarhum, dll) + nama penerima & pengirim + momen
   - Cerita & momen penting (wajib), ciri-ciri khas
   - Kenangan indah, kata-kata yang ingin disampaikan, suasana, vokal, bahasa lirik
   - Cek pesanan
2. Server memanggil Claude untuk menulis judul, dedikasi, lirik per bagian, chord, nada dasar, tempo,
   dan *prompt gaya musik* (bahasa Inggris) untuk produksi musik.
3. **/lagu/[id]**: halaman lagu (lirik, tombol chord, player audio, bagikan ke WhatsApp)
4. **/admin**: daftar pesanan, salin lirik & prompt musik, **upload file MP3** (disimpan di Supabase Storage,
   bucket `song-audio` dibuat otomatis) atau tempel link audio, ubah status

> Catatan: Claude hanya menulis lirik. Audionya dibuat terpisah, misalnya oleh produser
> atau AI music generator memakai lirik + prompt musik dari halaman admin. Setelah itu link MP3-nya
> ditempel di admin.

## Menjalankan

```bash
cd forever-song
cp .env.example .env.local   # isi ANTHROPIC_API_KEY dan ADMIN_KEY
npm install
npm run dev
```

Tanpa Supabase, lagu disimpan di `.data/songs.json` (khusus development).

## Deploy (Vercel)

1. Buat project Supabase, jalankan `supabase/schema.sql` di SQL Editor.
2. Import repo di Vercel, set **Root Directory = `forever-song`**.
3. Isi env: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_KEY`,
   `ADMIN_WHATSAPP` (nomor WA usaha untuk konfirmasi bayar, mis. 6281234567890) dan opsional
   `QRIS_IMAGE_URL` (link gambar QRIS atas nama usaha).
4. Jalankan **bagian 2** di `supabase/schema.sql` (kolom paket & pembayaran).

## Alur jualan

1. Calon pembeli isi form → **pratinjau gratis**: bait pertama + reff terlihat, sisanya diburamkan
   (lirik yang terkunci tidak dikirim ke browser sama sekali).
2. Opsional: minta **cuplikan audio** dengan nomor WA → admin upload cuplikan ±30 detik.
3. Pilih paket (`lib/packages.js`) + nomor WA → nominal dengan **kode unik 3 digit** → bayar QRIS →
   kirim bukti via WhatsApp.
4. Admin cek mutasi → **Tandai Lunas** → lirik lengkap terbuka → upload lagu lengkap → kirim kabar ke pembeli.
5. Halaman lagu berisi tombol bagikan + ajakan "Buat lagumu" untuk siapa pun yang membuka link.

## Struktur

- `lib/options.js`: daftar genre, penerima, momen, suasana, vokal, bahasa (tinggal edit untuk menambah pilihan)
- `lib/lyrics.js`: prompt & pemanggilan Claude (structured output)
- `lib/store.js`: penyimpanan (Supabase / file lokal)
- `app/api/songs`: buat lagu (dibatasi 5 permintaan/jam per IP)
