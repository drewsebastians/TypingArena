"use client";
import { AudioRoutePage } from "@/components/PracticeRoutePage";

export default function EnglishDictationPage() {
  return <AudioRoutePage kind="dictation" routePath="/dictation/english" slot="dictation-en" initialLanguage="en" lockLanguage />;
}
