import type { Metadata, Viewport } from "next";
import { Geist, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";

const sans = Geist({ variable: "--font-sans-latin", subsets: ["latin"] });
const urdu = Noto_Nastaliq_Urdu({ variable: "--font-urdu", subsets: ["arabic"], weight: ["400", "600"] });

export const metadata: Metadata = {
  title: "Alpha Kids Parent Coach",
  description: "Short, practical, safe parenting plans in English or Urdu.",
};

export const viewport: Viewport = { themeColor: "#fbf8f3" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${urdu.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
