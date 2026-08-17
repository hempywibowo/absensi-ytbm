import { google } from "googleapis";

const SHEET_NAME = "Absensi";

function getSheetsClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

// Append satu baris absensi ke Google Sheets. Dipanggil setelah clock-in/out
// berhasil ditulis ke Firestore — kalau ini gagal, absensi TETAP tercatat
// (Firestore adalah source of truth), Sheets cuma salinan buat laporan.
export async function appendAttendanceRow(row) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) return;

  try {
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_NAME}!A:H`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          [
            row.tanggal,
            row.namaGuru,
            row.namaSekolah,
            row.tipe, // "Clock In" | "Clock Out"
            row.jam,
            row.jarakMeter,
            row.status,
            row.fotoUrl,
          ],
        ],
      },
    });
  } catch (err) {
    console.error("Gagal sync ke Google Sheets:", err.message);
  }
}
