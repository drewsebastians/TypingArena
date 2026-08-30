"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getLocale, setLocale as persistLocale, type Locale } from "@/lib/i18n";

const LocaleContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void }>({
  locale: "en",
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(getLocale());
    const onStorage = (e: StorageEvent) => {
      if (e.key === "ta:locale" && (e.newValue === "en" || e.newValue === "id")) setLocaleState(e.newValue);
    };
    const onCustom = () => setLocaleState(getLocale());
    window.addEventListener("storage", onStorage);
    window.addEventListener("locale-change", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("locale-change", onCustom);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (next: Locale) => {
    persistLocale(next);
    setLocaleState(next);
    window.dispatchEvent(new Event("locale-change"));
  };

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
