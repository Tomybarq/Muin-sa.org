import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { Metadata } from "next";
import Script from "next/script";
import "../globals.css";
import "../fonts.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import PlatformSettingsProvider from "@/components/providers/PlatformSettingsProvider";
import { ToastProvider } from "@/lib/ToastContext";

export const metadata: Metadata = {
  title: "منصة معين | Moeen Platform",
  description: "منصة معين لإدارة الجمعيات والمسوقين والمستفيدين",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Primary font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&family=Tajawal:wght@300;400;500;700&family=Almarai:wght@300;400;700;800&family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Noto+Sans+Arabic:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Prevent flash of wrong theme */}
        <Script id="theme-script" strategy="beforeInteractive">
          {`
            try {
              const theme = localStorage.getItem('moeen-theme');
              if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              }
            } catch (_) {}
          `}
        </Script>
      </head>
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <PlatformSettingsProvider>
              <ToastProvider>{children}</ToastProvider>
            </PlatformSettingsProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
