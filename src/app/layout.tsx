import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Codxplica | AI Code Architect",
  description: "Turn any codebase into a beautiful tutorial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`} suppressHydrationWarning>
        <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 h-20 glass border-none border-b border-white/5 mx-4 mt-4 rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="font-black">C</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Codxplica</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm font-bold opacity-70 hover:opacity-100 transition-opacity flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white text-xs font-black shadow-lg">AD</span>
              <span>Admin Workspace</span>
            </a>
          </div>
        </header>

        <div className="pt-28">
          {children}
        </div>
      </body>
    </html>
  );
}
