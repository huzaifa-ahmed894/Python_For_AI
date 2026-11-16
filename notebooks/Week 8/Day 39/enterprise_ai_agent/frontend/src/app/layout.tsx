import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xander — Your personal assistant",
  description: "A little help goes a long way.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
