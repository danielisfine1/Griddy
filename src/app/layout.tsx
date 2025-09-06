import type { Metadata } from "next";
import { Xanh_Mono } from "next/font/google";

import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "@/theme";

import "./globals.css";

const xanhMono = Xanh_Mono({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-xanh",
});

export const metadata: Metadata = {
  title: "Griddy",
  description: "A simple website to preview your Instagram grid.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ThemeProvider theme={theme}>
        <body
          className={`${xanhMono.variable} antialiased`}
        >
          {children}
        </body>
      </ThemeProvider>
    </html>
  );
}
