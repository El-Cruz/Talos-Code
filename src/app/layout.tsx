import type { Metadata } from "next";
import { Big_Shoulders, Geist_Mono } from "next/font/google";
import "./globals.css";

const displayFace = Big_Shoulders({
  variable: "--font-display-face",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Talos Code — Technology Consulting & Software Development",
  description:
    "Talos Code is a technology consulting and software development agency specialized in web architecture, mobile applications, business systems integration, and custom technology environments for businesses.",
  openGraph: {
    title: "Talos Code — Technology Consulting & Software Development",
    description:
      "Web architecture, mobile applications, business systems integration, and custom technology environments for businesses.",
    type: "website",
    siteName: "Talos Code",
    locale: "en_US",
    alternateLocale: ["es_EC"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${displayFace.variable} ${geistMono.variable} antialiased`}
    >
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-gold focus:bg-basalt focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:text-gold"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}