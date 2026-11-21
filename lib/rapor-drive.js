import "server-only";
import { google } from "googleapis";

// Penyimpanan foto/video kegiatan di Google Drive yayasan.
//
// Dua cara login (pilih salah satu lewat env):
// 1. Akun Google yayasan (Gmail biasa, kuota 15 GB): GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET,
//    GOOGLE_DRIVE_REFRESH_TOKEN. File dimiliki akun yayasan.
// 2. Google Workspace: service account yang sama dengan Sheets (GOOGLE_SHEETS_CLIENT_EMAIL &
//    GOOGLE_SHEETS_PRIVATE_KEY) dijadikan anggota sebuah Shared Drive. (Service account biasa tidak
//    punya kuota sendiri, jadi wajib Shared Drive.)
// Folder induk: GOOGLE_DRIVE_FOLDER_ID (folder "Rapor YTBM" di Drive yayasan / Shared Drive).

export function driveSiap() {
  return Boolean(
    process.env.GOOGLE_DRIVE_FOLDER_ID &&
      ((process.env.GOOGLE_DRIVE_REFRESH_TOKEN && process.env.GOOGLE_DRIVE_CLIENT_ID) ||
        (process.env.GOOGLE_SHEETS_CLIENT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY)),
  );
}

function auth() {
  if (process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
    const o = new google.auth.OAuth2(process.env.GOOGLE_DRIVE_CLIENT_ID, process.env.GOOGLE_DRIVE_CLIENT_SECRET);
    o.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });
    return o;
  }
  return new google.auth.JWT({
    email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
}

const cacheFolder = new Map();

// Cari / buat subfolder (mis. per sekolah, lalu per kelas) di bawah folder induk.
async function folder(drive, namaList) {
  let parent = process.env.GOOGLE_DRIVE_FOLDER_ID;
  for (const nama of namaList) {
    const kunci = `${parent}/${nama}`;
    if (cacheFolder.has(kunci)) {
      parent = cacheFolder.get(kunci);
      continue;
    }
    const q = `'${parent}' in parents and name = '${nama.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const { data } = await drive.files.list({ q, fields: "files(id)", supportsAllDrives: true, includeItemsFromAllDrives: true });
    let id = data.files?.[0]?.id;
    if (!id) {
      const res = await drive.files.create({
        requestBody: { name: nama, mimeType: "application/vnd.google-apps.folder", parents: [parent] },
        fields: "id",
        supportsAllDrives: true,
      });
      id = res.data.id;
    }
    cacheFolder.set(kunci, id);
    parent = id;
  }
  return parent;
}

// Buat sesi unggah "resumable": browser guru mengunggah file langsung ke Google Drive (tidak lewat
// server aplikasi, karena video bisa jauh lebih besar dari batas request Vercel).
export async function buatSesiUnggah({ folderNama, namaFile, mime, ukuran, keterangan, origin }) {
  const a = auth();
  const drive = google.drive({ version: "v3", auth: a });
  const parent = await folder(drive, folderNama);
  const { token } = await a.getAccessToken();
  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": mime,
      "X-Upload-Content-Length": String(ukuran),
      ...(origin ? { Origin: origin } : {}),
    },
    body: JSON.stringify({ name: namaFile, parents: [parent], description: keterangan }),
  });
  if (!res.ok) throw new Error(`Drive menolak sesi unggah (${res.status}): ${await res.text()}`);
  return res.headers.get("location");
}

// Ambil isi file (untuk pratinjau foto di dashboard kepala sekolah).
export async function ambilFile(fileId) {
  const drive = google.drive({ version: "v3", auth: auth() });
  const res = await drive.files.get({ fileId, alt: "media", supportsAllDrives: true }, { responseType: "arraybuffer" });
  return { data: Buffer.from(res.data), mime: res.headers["content-type"] || "application/octet-stream" };
}
