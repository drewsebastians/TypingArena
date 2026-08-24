import type { CorpusItem } from "../types";
import { item } from "./corpusUtil";

// Korpus Bahasa Indonesia — teks asli yang ditulis khusus untuk TypingArena
// (bukan hasil terjemahan mesin). Pola ejaan, tanda baca, angka, dan format
// administrasi Indonesia (tanggal dd/mm/yyyy, mata uang Rp) dipertahankan.

const SRC = "original-id-v2";

export const INDONESIAN_CORPUS: CorpusItem[] = [
  // --- Sprint -----------------------------------------------------------------
  item("id-sprint-001", "id", "sprint", "easy", ["common-words"], SRC,
    "latihan mengetik cepat membutuhkan konsistensi dan fokus setiap hari agar kecepatan dan akurasi meningkat secara bertahap"),
  item("id-sprint-002", "id", "sprint", "easy", ["transcription"], SRC,
    "kemampuan mendengar dan menulis dengan tepat sangat penting untuk pekerjaan transkripsi dan entri data profesional"),
  item("id-sprint-003", "id", "sprint", "easy", ["daily-life"], SRC,
    "setiap pagi ibu sari membeli roti segar di pasar dekat rumah sebelum berangkat bekerja dengan sepeda motor"),
  item("id-sprint-004", "id", "sprint", "medium", ["work"], SRC,
    "rapat mingguan dibuka tepat waktu dan setiap tim melaporkan kemajuan singkat beserta hambatan yang perlu dibantu"),
  item("id-sprint-005", "id", "sprint", "medium", ["nature"], SRC,
    "hujan turun sepanjang siang membuat udara terasa sejuk dan pepohonan di halaman sekolah tampak hijau kembali"),
  item("id-sprint-006", "id", "sprint", "medium", ["travel"], SRC,
    "kereta kami berangkat pukul tujuh kurang lima belas jadi kita sebaiknya tiba di stasiun lebih awal agar tidak tergesa"),
  item("id-sprint-007", "id", "sprint", "medium", ["education"], SRC,
    "siswa yang berlatih mengetik sepuluh menit setiap hari biasanya meningkatkan kecepatannya dua kali lipat dalam satu semester"),
  item("id-sprint-008", "id", "sprint", "hard", ["abstract"], SRC,
    "disiplin adalah kemampuan memilih tujuan jangka panjang daripada kenyamanan sesaat dan pilihan kecil itulah yang membentuk masa depan"),
  item("id-sprint-009", "id", "sprint", "easy", ["food"], SRC,
    "resep ini membutuhkan tiga telur secangkir tepung dan sejumput garam yang diaduk perlahan sampai adonannya halus"),
  item("id-sprint-010", "id", "sprint", "medium", ["business"], SRC,
    "penulisan yang jelas menghemat waktu karena pembaca memahami pesan pada bacaan pertama tanpa perlu bertanya ulang"),

  // --- Copy Pro ------------------------------------------------------------------
  item("id-copypro-001", "id", "copy-pro", "medium", ["punctuation"], SRC,
    "Halo, Dunia! Latihan ini menguji tanda baca: angka (42, 3,14), simbol @#$, dan Huruf Kapital. Mampukah kamu 100% akurat?"),
  item("id-copypro-002", "id", "copy-pro", "hard", ["data-entry", "address"], SRC,
    "Surat dari PT Maju Bersama, Jalan Merdeka No. 74, Bandung 40115, tertanggal 31/12/2025, perihal: perpanjangan kontrak."),
  item("id-copypro-003", "id", "copy-pro", "medium", ["email"], SRC,
    "Kepada Yth. Bapak Andi, Terima kasih atas balasan cepatnya. Berikut kami lampirkan faktur No. 2026-114 senilai Rp3.480.000."),
  item("id-copypro-004", "id", "copy-pro", "medium", ["proper-nouns"], SRC,
    "Konferensi di Jakarta berlangsung 3-7 Maret; pembandingnya antara Dr. Sari, Prof. Wibowo, dan Ibu Ratna dari Surabaya."),
  item("id-copypro-005", "id", "copy-pro", "hard", ["quotes"], SRC,
    "\"Rilis hari Jumat,\" kata ketua tim, \"tetapi HANYA setelah QA menyetujui build 2.4.1 — tanpa pengecualian musim ini.\""),

  // --- Numbers & Data --------------------------------------------------------------
  item("id-numbers-001", "id", "numbers", "hard", ["numbers", "currency"], SRC,
    "Pesanan: 77304 | Telepon: +62-812-3456-7890 | Jumlah: Rp1.250.000,00 dan Rp42.500,50 pada tanggal 31/12/2025"),
  item("id-numbers-002", "id", "numbers", "medium", ["dates"], SRC,
    "Jatuh tempo: 15 Januari, 28 Februari, 31 Maret | Rapat: 10.30, 13.00, 16.45 | Kuartal: K1-K4"),
  item("id-numbers-003", "id", "numbers", "hard", ["codes"], SRC,
    "Kode BRG-X770 sebanyak 12 unit @ Rp19.500 = Rp234.000; ongkos kirim Rp68.000; TOTAL Rp302.000 — gudang C, rak 3."),
  item("id-numbers-004", "id", "numbers", "medium", ["inventory"], SRC,
    "Gudang B menyimpan 1.204 karton di lorong 7 rak C3; 96 unit disiapkan untuk dikirim dan 38 unit dikembalikan Selasa lalu."),

  // --- Punctuation ---------------------------------------------------------------
  item("id-punct-001", "id", "punctuation", "medium", ["dialogue"], SRC,
    "\"Jangan khawatir,\" katanya, \"ini tidak rumit — fokus pada akurasi dulu, kecepatan akan mengikuti dengan sendirinya.\""),
  item("id-punct-002", "id", "punctuation", "medium", ["dialogue"], SRC,
    "\"Tunggu,\" serunya, \"apa ada yang ingat tiket, paspor, atau — lebih penting lagi — alamat penginapan kita?\""),
  item("id-punct-003", "id", "punctuation", "hard", ["lists"], SRC,
    "Bawa perlengkapan penting: senter; baterai cadangan; peta kertas (ya, sungguhan); tali; dan — yang utama — air minum."),
];
