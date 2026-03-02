import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/query-provider";
import { NotionStoreProvider } from "@/providers/notion-store-provider";
import { NutritionGoalsProvider } from "@/providers/nutrition-goals-provider";
import { RecentFoodsProvider } from "@/providers/recent-foods-provider";
import { BottomNav } from "@/components/bottom-nav";
import { SwipeNavigator } from "@/components/swipe-navigator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "運動紀錄",
  description: "個人運動與營養追蹤應用",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "運動紀錄",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1c1917",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-stone-900 text-stone-100`}
      >
        <NotionStoreProvider>
          <NutritionGoalsProvider>
            <RecentFoodsProvider>
            <QueryProvider>
              <SwipeNavigator>
                <main className="max-w-md mx-auto min-h-screen pb-16">
                  {children}
                </main>
                <BottomNav />
              </SwipeNavigator>
            </QueryProvider>
            </RecentFoodsProvider>
          </NutritionGoalsProvider>
        </NotionStoreProvider>
      </body>
    </html>
  );
}
