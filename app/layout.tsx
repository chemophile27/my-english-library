import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My English Library",
  description: "Your personal English vocabulary library.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}