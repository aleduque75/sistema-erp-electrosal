'use client';

import { StatusAnaliseQuimica } from "@sistema-erp-electrosal/core";

const statusMap: Record<
  (typeof StatusAnaliseQuimica)[keyof typeof StatusAnaliseQuimica],
  { label: string; className: string }
> = {
  EM_ANALISE: { label: "Em Análise", className: "bg-blue-500" },
  ANALISADO_AGUARDANDO_APROVACAO: { label: "Aguardando Aprovação", className: "bg-orange-500" },
  APROVADO_PARA_RECUPERACAO: { label: "Aprovado p/ Recuperação", className: "bg-green-500" },
  RECUSADO_PELO_CLIENTE: { label: "Recusado", className: "bg-red-500" },
  EM_RECUPERACAO: { label: "Em Recuperação", className: "bg-purple-500" },
  FINALIZADO_RECUPERADO: { label: "Finalizado", className: "bg-slate-500" },
  CANCELADO: { label: "Cancelado", className: "bg-gray-400" },
  RESIDUO: { label: "Resíduo", className: "bg-pink-500" },
};

export function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border p-2">
      <span className="text-sm font-semibold">Legenda:</span>
      {Object.values(statusMap).map((statusInfo) => (
        <div key={statusInfo.label} className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${statusInfo.className}`} />
          <span className="text-xs text-muted-foreground">{statusInfo.label}</span>
        </div>
      ))}
    </div>
  );
}
