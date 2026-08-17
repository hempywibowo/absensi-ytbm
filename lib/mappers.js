// Konversi row Postgres (snake_case) ke bentuk yang dipakai frontend (camelCase),
// biar komponen React gak perlu berubah pas backend pindah dari Firestore ke Supabase.

export function mapAttendance(row) {
  return {
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    schoolId: row.school_id,
    schoolName: row.school_name,
    date: row.date,
    status: row.status,
    clockIn: row.clock_in,
    clockOut: row.clock_out,
  };
}

export function mapLeaveRequest(row) {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    schoolId: row.school_id,
    schoolName: row.school_name,
    date: row.date,
    reason: row.reason,
    status: row.status,
    requestedAt: row.requested_at,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
  };
}

export function mapSchool(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    mapsLink: row.maps_link,
  };
}
