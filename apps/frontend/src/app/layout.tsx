import "./globals.css";
import Navbar from "../components/Navbar";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {/* Navbar component */}
            <Navbar />
            <main className="container mx-auto p-4">{children}</main>
          </AuthProvider>
        </ThemeProvider>
        <Toaster richColors position="top-right" />{" "}
      </body>
    </html>
  );
}
