import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomTabBar from "@/components/BottomTabBar";

export const metadata: Metadata = {
  title: "TrainLog",
  description: "Yates-style training log",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f1115",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink">
        <div className="mx-auto flex min-h-screen max-w-md flex-col pb-20">
          <main className="flex-1">{children}</main>
        </div>
        <BottomTabBar />
      </body>
    </html>
  );
}
