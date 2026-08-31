"use client";
import { AudioRoutePage } from "@/components/PracticeRoutePage";

export default function IndonesianDictationPage() {
  return <AudioRoutePage kind="dictation" routePath="/dictation/indonesian" slot="dictation-id" initialLanguage="id" lockLanguage />;
}
