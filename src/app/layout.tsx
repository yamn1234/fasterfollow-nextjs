import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const cairo = Cairo({ subsets: ["latin", "arabic"], display: "swap" });

export const metadata: Metadata = {
  title: "FasterFollow",
  description: "FasterFollow Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" suppressHydrationWarning dir="rtl">
      <body className={cairo.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}