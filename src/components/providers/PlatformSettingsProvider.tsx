"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

interface PlatformSettings {
  logoUrl: string;
  fontFamily: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  siteName: string;
  siteNameAr: string;
}

const defaultSettings: PlatformSettings = {
  logoUrl: "/logo.png",
  fontFamily: "Cairo",
  primaryColor: "#0A5C4A",
  secondaryColor: "#F9A826",
  tertiaryColor: "#2FAB99",
  siteName: "Moeen Platform",
  siteNameAr: "منصة معين",
};

const PlatformSettingsContext = createContext<PlatformSettings>(defaultSettings);

export function usePlatformSettings() {
  return useContext(PlatformSettingsContext);
}

export default function PlatformSettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    applied.current = true;

    fetch("/api/settings/system")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
          const root = document.documentElement;
          root.style.setProperty("--color-primary", data.settings.primaryColor || defaultSettings.primaryColor);
          root.style.setProperty("--color-secondary", data.settings.secondaryColor || defaultSettings.secondaryColor);
          root.style.setProperty("--color-tertiary", data.settings.tertiaryColor || defaultSettings.tertiaryColor);
          
          const font = data.settings.fontFamily || defaultSettings.fontFamily;
          const cleanFont = font.replace(/['"]/g, "").trim();
          root.style.setProperty("--font-family", cleanFont);
          document.body.style.fontFamily = `"${cleanFont}", system-ui, -apple-system, sans-serif`;

          // Inject selected Google Font dynamically if not local (e.g. Thmanyah)
          if (!cleanFont.toLowerCase().includes("thmanyah")) {
            const fontId = "dynamic-google-font";
            let link = document.getElementById(fontId) as HTMLLinkElement | null;
            if (!link) {
              link = document.createElement("link");
              link.id = fontId;
              link.rel = "stylesheet";
              document.head.appendChild(link);
            }
            link.href = `https://fonts.googleapis.com/css2?family=${cleanFont.replace(/\s+/g, "+")}:wght@300;400;500;600;700;800&display=swap`;
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const titleParts: string[] = [];
    if (settings.siteNameAr) titleParts.push(settings.siteNameAr);
    if (settings.siteName) titleParts.push(settings.siteName);
    if (titleParts.length > 0) {
      document.title = titleParts.join(" | ");
    }
  }, [settings.siteName, settings.siteNameAr]);

  return (
    <PlatformSettingsContext.Provider value={settings}>
      {children}
    </PlatformSettingsContext.Provider>
  );
}
