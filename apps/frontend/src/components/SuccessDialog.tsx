// apps/frontend/src/app/components/SuccessDialog.tsx
import React from 'react';
import Image from 'next/image';

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string; // Para personalizar a mensagem
}

const SuccessDialog: React.FC<SuccessDialogProps> = ({ isOpen, onClose, clientName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-lg shadow-xl p-6 md:p-8 max-w-sm w-full text-center border border-gray-700 relative">
        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl"
          aria-label="Fechar"
        >
          &times;
        </button>

        {/* Logo da Electrosal */}
        <div className="mb-6">
          <Image
            src="/images/logoAtual.jpg" // Certifique-se de ter seu logo nesta pasta
            alt="Logo Electrosal"
            width={120}
            height={120}
            className="mx-auto"
          />
        </div>

        {/* Título e Mensagem */}
        <h2 className="text-3xl font-bold text-electrosal-amber mb-3">Sucesso!</h2>
        <p className="text-gray-200 text-lg mb-6">
          Olá, <span className="font-semibold text-white">{clientName}</span>!
          <br />
          Recebemos sua mensagem com sucesso.
          <br />
          A Electrosal entrará em contato em breve!
        </p>

        {/* Ícone de Sucesso */}
        <div className="text-green-500 text-6xl mb-4">
          &#10004; {/* Checkmark unicode */}
        </div>

        <button
          onClick={onClose}
          className="bg-electrosal-zinc hover:bg-electrosal-zinc-dark text-white font-bold py-2 px-6 rounded-full transition-colors duration-200"
        >
          Ok
        </button>
      </div>
    </div>
  );
};

export default SuccessDialog;