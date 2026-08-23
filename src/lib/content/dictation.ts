import type { DictationItem, TranscriptionItem } from "../types";

export const DICTATION_EN: DictationItem[] = [
  {
    id: "dict-en-001",
    language: "en",
    transcript: "The quick brown fox jumps over the lazy dog.",
    normalizedTranscript: "the quick brown fox jumps over the lazy dog",
    audioUrl: "tts:en:slow:The quick brown fox jumps over the lazy dog.",
    durationSec: 4,
    speed: "slow",
    difficulty: "easy",
    topic: "pangram",
    useTTS: true,
  },
  {
    id: "dict-en-002",
    language: "en",
    transcript: "Please confirm your order number is A-4829 and the total is one thousand two hundred forty-nine dollars.",
    normalizedTranscript: "please confirm your order number is a-4829 and the total is one thousand two hundred forty-nine dollars",
    audioUrl: "tts:en:medium:Please confirm your order number is A-4829 and the total is one thousand two hundred forty-nine dollars.",
    durationSec: 7,
    speed: "medium",
    difficulty: "medium",
    topic: "business",
    useTTS: true,
  },
  {
    id: "dict-en-003",
    language: "en",
    transcript: "Remember, accuracy before speed — punctuation matters more than you think.",
    normalizedTranscript: "remember accuracy before speed punctuation matters more than you think",
    audioUrl: "tts:en:medium:Remember, accuracy before speed — punctuation matters more than you think.",
    durationSec: 5,
    speed: "medium",
    difficulty: "medium",
    topic: "instruction",
    useTTS: true,
  },
  {
    id: "dict-en-004",
    language: "en",
    transcript: "The meeting is scheduled for December thirty-first at nine AM in conference room B.",
    normalizedTranscript: "the meeting is scheduled for december thirty-first at nine am in conference room b",
    audioUrl: "tts:en:fast:The meeting is scheduled for December thirty-first at nine AM in conference room B.",
    durationSec: 6,
    speed: "fast",
    difficulty: "hard",
    topic: "scheduling",
    useTTS: true,
  },
];

export const DICTATION_ID: DictationItem[] = [
  {
    id: "dict-id-001",
    language: "id",
    transcript: "Latihan dikte ini membantu meningkatkan kemampuan mendengar dan menulis.",
    normalizedTranscript: "latihan dikte ini membantu meningkatkan kemampuan mendengar dan menulis",
    audioUrl: "tts:id:slow:Latihan dikte ini membantu meningkatkan kemampuan mendengar dan menulis.",
    durationSec: 5,
    speed: "slow",
    difficulty: "easy",
    topic: "instruksi",
    useTTS: true,
  },
  {
    id: "dict-id-002",
    language: "id",
    transcript: "Pesanan Anda nomor tujuh tujuh tiga nol empat akan dikirim tanggal tiga puluh satu Desember.",
    normalizedTranscript: "pesanan anda nomor tujuh tujuh tiga nol empat akan dikirim tanggal tiga puluh satu desember",
    audioUrl: "tts:id:medium:Pesanan Anda nomor tujuh tujuh tiga nol empat akan dikirim tanggal tiga puluh satu Desember.",
    durationSec: 6,
    speed: "medium",
    difficulty: "medium",
    topic: "bisnis",
    useTTS: true,
  },
  {
    id: "dict-id-003",
    language: "id",
    transcript: "Fokus pada tanda baca, huruf kapital, dan angka agar hasil transkripsi akurat.",
    normalizedTranscript: "fokus pada tanda baca huruf kapital dan angka agar hasil transkripsi akurat",
    audioUrl: "tts:id:medium:Fokus pada tanda baca, huruf kapital, dan angka agar hasil transkripsi akurat.",
    durationSec: 5,
    speed: "medium",
    difficulty: "medium",
    topic: "instruksi",
    useTTS: true,
  },
];

export const TRANSCRIPTION_EN: TranscriptionItem[] = [
  {
    id: "trans-en-001",
    language: "en",
    transcript: "Welcome to the transcription sprint. You will hear a longer passage and need to type it accurately. Pay attention to punctuation, capitalization, and numbers. You can pause and replay, but your replay ratio will be measured. Good luck and focus on steady accuracy.",
    audioUrl: "tts:en:medium:Welcome to the transcription sprint. You will hear a longer passage and need to type it accurately. Pay attention to punctuation, capitalization, and numbers. You can pause and replay, but your replay ratio will be measured. Good luck and focus on steady accuracy.",
    durationSec: 28,
    difficulty: "medium",
    useTTS: true,
  },
  {
    id: "trans-id-001",
    language: "id",
    transcript: "Selamat datang di latihan transkripsi. Anda akan mendengar rekaman lebih panjang dan harus mengetiknya dengan akurat. Perhatikan tanda baca dan angka. Anda dapat menjeda dan memutar ulang, tetapi rasio pemutaran akan diukur.",
    audioUrl: "tts:id:medium:Selamat datang di latihan transkripsi. Anda akan mendengar rekaman lebih panjang dan harus mengetiknya dengan akurat. Perhatikan tanda baca dan angka. Anda dapat menjeda dan memutar ulang, tetapi rasio pemutaran akan diukur.",
    durationSec: 30,
    difficulty: "medium",
    useTTS: true,
  },
];

// Unified helpers
export function getDictationByLang(lang: "en" | "id") {
  return lang === "en" ? DICTATION_EN : DICTATION_ID;
}

export function getTranscriptionByLang(lang: "en" | "id") {
  return TRANSCRIPTION_EN.filter(t => t.language === lang);
}
