import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider"; // ✅ 1. Importar o QueryProvider
import { Header } from "@/components/layout/header"; // ✅ 2. Importar o Header

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
          {/* Header component */}
          <AuthProvider>
            {/* Navbar component */}
           
            <main className="container mx-auto p-4">{children}</main>
          </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        <Toaster richColors position="top-right" />{" "}
      </body>
    </html>
  );
}
