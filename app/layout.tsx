import { Toaster } from "sonner";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rumah Qurban Admin",
  description: "Admin Panel Rumah Qurban",
  icons: "/favicon-rq.png",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
