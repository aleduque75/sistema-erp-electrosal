import "@/lib/reflect-metadata";
import "./globals.css";
import "@fontsource/outfit"; // Import Outfit font
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext"; // Corrigido para usar o nosso ThemeProvider
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";

export const metadata = {
  title: 'Sistema Electrosal',
  description: 'Sistema de gestão para Galvanicas',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <main className="flex-1 p-4">{children}</main>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
