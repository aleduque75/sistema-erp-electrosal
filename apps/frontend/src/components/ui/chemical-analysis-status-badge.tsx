import { Badge } from "@/components/ui/badge";
import { StatusAnaliseQuimica } from "@sistema-erp-electrosal/core"; // Importa o valor do Enum

// CORREÇÃO DE TIPAGEM: Usa a sintaxe typeof para garantir que a prop aceita o valor string literal do Enum
interface Props {
  status: (typeof StatusAnaliseQuimica)[keyof typeof StatusAnaliseQuimica];
}

// CORREÇÃO: O Record map usa a sintaxe typeof para garantir que o tipo da chave seja o valor string literal do Enum
const statusMap: Record<
  (typeof StatusAnaliseQuimica)[keyof typeof StatusAnaliseQuimica],
  { label: string; className: string }
> = {
  RECEBIDO: {
    label: "Recebido",
    className: "bg-yellow-400",
  },
  EM_ANALISE: {
    label: "Em Análise",
    className: "bg-blue-500",
  },
  ANALISADO_AGUARDANDO_APROVACAO: {
    label: "Aguardando Aprovação",
    className: "bg-orange-500",
  },
  APROVADO_PARA_RECUPERACAO: {
    label: "Aprovado p/ Recuperação",
    className: "bg-green-500",
  },
  RECUSADO_PELO_CLIENTE: {
    label: "Recusado",
    className: "bg-red-500",
  },
  EM_RECUPERACAO: {
    label: "Em Recuperação",
    className: "bg-purple-500",
  },
  FINALIZADO_RECUPERADO: {
    label: "Finalizado",
    className: "bg-slate-500",
  },
  CANCELADO: {
    label: "Cancelado",
    className: "bg-gray-400",
  },
  RESIDUO: {
    label: "Resíduo",
    className: "bg-pink-500",
  },
};

export function ChemicalAnalysisStatusBadge({ status }: Props) {
  // O acesso é seguro porque a chave 'status' é uma string do Enum
  const statusInfo = statusMap[status] as { label: string; className: string } | undefined;

  if (!statusInfo) {
    // Isso deve ser impossível se o status for tipado corretamente
    return <Badge className="bg-gray-200 text-gray-700">?</Badge>;
  }

  // Renderiza apenas um círculo colorido sem texto
  return (
    <div
      title={statusInfo.label}
      className={`h-4 w-4 rounded-full ${statusInfo.className}`}
    />
  );
}
