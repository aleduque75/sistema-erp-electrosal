'use client';
import { MainMenu } from '@/components/layout/main-menu';

export default function TesteMenuPage() {
  return (
    <div className="bg-gray-200 dark:bg-gray-800 p-10 h-screen">
      <h1 className="text-xl font-bold mb-4">Página de Teste do Menu</h1>
      <p className="mb-4">Abaixo está apenas o componente do menu. Ele deve funcionar perfeitamente aqui.</p>
      
      {/* Renderiza o menu diretamente, sem o Header */}
      <div className="bg-white dark:bg-black p-4 rounded-md">
        <MainMenu />
      </div>

    </div>
  );
}