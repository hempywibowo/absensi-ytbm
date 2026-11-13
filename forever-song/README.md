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
4. **/admin**: daftar pesanan, salin lirik & prompt musik, pasang link MP3, ubah status

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
3. Isi env: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_KEY`.

## Struktur

- `lib/options.js`: daftar genre, penerima, momen, suasana, vokal, bahasa (tinggal edit untuk menambah pilihan)
- `lib/lyrics.js`: prompt & pemanggilan Claude (structured output)
- `lib/store.js`: penyimpanan (Supabase / file lokal)
- `app/api/songs`: buat lagu (dibatasi 5 permintaan/jam per IP)
