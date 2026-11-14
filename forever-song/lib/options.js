// Pilihan-pilihan di form pemesanan lagu.
// `hint` dipakai sebagai arahan gaya musik untuk penulis lirik (AI) & produser.

export const GENRES = [
  { id: "pop-indonesia", label: "Pop Indonesia", emoji: "🎤", popular: true, hint: "Pop Indonesia modern, melodi catchy, chorus mudah dinyanyikan" },
  { id: "pop-akustik", label: "Pop Akustik", emoji: "🎸", popular: true, hint: "Pop akustik gitar, hangat, intim, seperti dinyanyikan langsung" },
  { id: "ballad", label: "Ballad Mellow", emoji: "🌙", popular: true, hint: "Ballad piano yang menyentuh, emosional, tempo lambat" },
  { id: "koplo", label: "Dangdut Koplo", emoji: "🥁", popular: true, hint: "Dangdut koplo energik dengan kendang koplo, suling, cengkok khas, bisa bikin joget" },
  { id: "dangdut", label: "Dangdut Klasik", emoji: "🎶", hint: "Dangdut klasik ala Rhoma/Elvy, suling & mandolin, cengkok dangdut" },
  { id: "jazz", label: "Jazz", emoji: "🎷", popular: true, hint: "Jazz/swing santai, harmoni kaya (maj7, 9th), nuansa romantis dan elegan" },
  { id: "rohani-kristen", label: "Rohani Kristen", emoji: "✝️", popular: true, hint: "Lagu rohani Kristen / worship kontemporer, penuh syukur dan pujian kepada Tuhan Yesus" },
  { id: "rohani-islam", label: "Religi Islami", emoji: "☪️", popular: true, hint: "Lagu religi Islami yang lembut, penuh doa dan syukur kepada Allah SWT" },
  { id: "sholawat", label: "Sholawat / Nasyid", emoji: "🕌", hint: "Nuansa sholawat/nasyid dengan rebana dan harmoni vokal" },
  { id: "keroncong", label: "Keroncong", emoji: "🪕", hint: "Keroncong klasik dengan cak-cuk, cello petik, biola, syahdu" },
  { id: "pop-melayu", label: "Pop Melayu", emoji: "🌴", hint: "Pop Melayu mendayu, cengkok Melayu, sentimental" },
  { id: "campursari", label: "Campursari / Pop Jawa", emoji: "🎋", hint: "Campursari / pop Jawa ala Didi Kempot, gamelan dipadu musik modern" },
  { id: "pop-sunda", label: "Pop Sunda", emoji: "🎍", hint: "Pop Sunda dengan nuansa kecapi suling" },
  { id: "rnb", label: "R&B / Soul", emoji: "💜", hint: "R&B soul yang smooth, groove santai, vokal penuh rasa" },
  { id: "reggae", label: "Reggae", emoji: "🌞", hint: "Reggae santai dan ceria, offbeat gitar" },
  { id: "rock", label: "Pop Rock", emoji: "🔥", hint: "Pop rock bersemangat dengan gitar distorsi dan drum penuh tenaga" },
  { id: "indie-folk", label: "Indie Folk", emoji: "🍂", hint: "Indie folk puitis, sederhana, hangat ala senja dan kopi" },
  { id: "anak", label: "Lagu Anak", emoji: "🧸", hint: "Lagu anak ceria, kata-kata sederhana, mudah dihafal" },
  { id: "edm", label: "EDM / Dance", emoji: "⚡", hint: "Dance pop/EDM dengan drop yang meriah" },
  { id: "rap", label: "Hip-hop / Rap", emoji: "🎧", hint: "Hip-hop dengan verse rap dan hook yang dinyanyikan" },
];

export const RECIPIENTS = [
  { id: "pasangan", label: "Pacar / Kekasih", emoji: "💕" },
  { id: "istri", label: "Istri", emoji: "👰" },
  { id: "suami", label: "Suami", emoji: "🤵" },
  { id: "ibu", label: "Ibu", emoji: "🌷" },
  { id: "ayah", label: "Ayah", emoji: "👨" },
  { id: "anak", label: "Anak", emoji: "👶" },
  { id: "kakek-nenek", label: "Kakek / Nenek", emoji: "👵" },
  { id: "saudara", label: "Kakak / Adik", emoji: "👫" },
  { id: "sahabat", label: "Sahabat", emoji: "🤝" },
  { id: "guru", label: "Guru", emoji: "📚" },
  { id: "rekan", label: "Rekan Kerja / Atasan", emoji: "💼" },
  { id: "almarhum", label: "Mengenang yang Telah Pergi", emoji: "🕊️" },
  { id: "diri-sendiri", label: "Diri Sendiri", emoji: "🌱" },
  { id: "lainnya", label: "Lainnya", emoji: "✨" },
];

export const OCCASIONS = [
  { id: "ulang-tahun", label: "Ulang Tahun", emoji: "🎂" },
  { id: "anniversary", label: "Anniversary", emoji: "💍" },
  { id: "pernikahan", label: "Pernikahan", emoji: "💒" },
  { id: "lamaran", label: "Lamaran / Nembak", emoji: "💌" },
  { id: "hari-ibu", label: "Hari Ibu / Hari Ayah", emoji: "🌺" },
  { id: "wisuda", label: "Wisuda", emoji: "🎓" },
  { id: "kelahiran", label: "Kelahiran Bayi", emoji: "🍼" },
  { id: "lebaran", label: "Ramadhan / Lebaran", emoji: "🌙" },
  { id: "natal", label: "Natal", emoji: "🎄" },
  { id: "terima-kasih", label: "Ucapan Terima Kasih", emoji: "🙏" },
  { id: "minta-maaf", label: "Permintaan Maaf", emoji: "🥺" },
  { id: "perpisahan", label: "Perpisahan / Pensiun", emoji: "👋" },
  { id: "mengenang", label: "Mengenang / In Memoriam", emoji: "🕯️" },
  { id: "semangat", label: "Penyemangat", emoji: "💪" },
  { id: "tanpa-alasan", label: "Tanpa Alasan, Cuma Sayang", emoji: "💛" },
];

export const MOODS = [
  { id: "romantis", label: "Romantis" },
  { id: "haru", label: "Haru / Bikin Nangis" },
  { id: "ceria", label: "Ceria & Bahagia" },
  { id: "lucu", label: "Lucu / Jenaka" },
  { id: "syukur", label: "Penuh Syukur" },
  { id: "semangat", label: "Membakar Semangat" },
  { id: "nostalgia", label: "Nostalgia" },
];

export const VOCALS = [
  { id: "pria", label: "Vokal Pria" },
  { id: "wanita", label: "Vokal Wanita" },
  { id: "duet", label: "Duet" },
];

export const LANGUAGES = [
  { id: "indonesia", label: "Bahasa Indonesia" },
  { id: "jawa", label: "Bahasa Jawa" },
  { id: "sunda", label: "Bahasa Sunda" },
  { id: "campur-inggris", label: "Indonesia + sedikit Inggris" },
  { id: "inggris", label: "English" },
];

export function findLabel(list, id) {
  return list.find((x) => x.id === id)?.label ?? id;
}

export function findOption(list, id) {
  return list.find((x) => x.id === id);
}
