import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton
} from "@clerk/nextjs";
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
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
          <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 h-20 glass border-none border-b border-white/5 mx-4 mt-4 rounded-3xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <span className="font-black">C</span>
              </div>
              <span className="text-xl font-bold tracking-tight">Codxplica</span>
            </div>

            <div className="flex items-center gap-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-sm font-bold opacity-70 hover:opacity-100 transition-opacity">Sign In</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest h-10 px-6 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                    Sign Up
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <a href="/dashboard" className="text-sm font-bold opacity-70 hover:opacity-100 transition-opacity">My Projects</a>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </header>

          <div className="pt-28">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
