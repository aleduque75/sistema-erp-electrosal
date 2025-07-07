// Substitua o conteúdo deste arquivo por este código:

import { Header } from '@/components/Header'; // Importa o novo Header

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // A estrutura agora é vertical: Header em cima, conteúdo embaixo
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}