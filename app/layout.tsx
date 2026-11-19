import { missingSettings } from "@/lib/config";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "react-datepicker/dist/react-datepicker.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LetsMeet",
  description: "Video Calling Web Application powered by Next.JS",
  icons: { icon: "/icons/logo.svg" },
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (missingSettings().length)
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  return (
    <html lang="en">
      <ClerkProvider
        appearance={{
          variables: {
            colorPrimary: "#0e78f9",
            colorForeground: "#fff",
            colorBackground: "#1c1f2e",
            colorInput: "#252a41",
            colorInputForeground: "#fff",
          },
        }}
      >
        <body className={`${inter.className} bg-dark-2`}>
          {children}
          <SpeedInsights />
          <Toaster />
        </body>
      </ClerkProvider>
    </html>
  );
}
