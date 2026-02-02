import "@/lib/reflect-metadata";
import "./globals.css";
import "@fontsource/outfit";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "@/components/providers/custom-theme-provider";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-outfit antialiased bg-background text-foreground">
        <AuthProvider>
          <QueryProvider>
            <ThemeProvider>
              <main className="min-h-screen flex flex-col">{children}</main>
            </ThemeProvider>
          </QueryProvider>
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
