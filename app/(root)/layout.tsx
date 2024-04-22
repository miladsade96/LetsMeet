import { ReactNode } from "react";
import StreamClientProvider from "@/providers/StreamClientProvider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <main>
      <StreamClientProvider> {children}</StreamClientProvider>
    </main>
  );
}
