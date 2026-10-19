import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { AppProvider } from "@/state/AppState";
import { PRODUCT_NAME } from "@/i18n/en";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${PRODUCT_NAME} · prototype`, template: `%s · ${PRODUCT_NAME}` },
  description: "Stakeholder prototype of a mastery-based learning platform for UX and product design.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#101014", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen">
        <AppProvider>
          <Suspense>{children}</Suspense>
        </AppProvider>
      </body>
    </html>
  );
}
