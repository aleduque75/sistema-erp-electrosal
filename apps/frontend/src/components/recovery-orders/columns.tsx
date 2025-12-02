"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Paperclip, Play, FlaskConical, Microscope } from "lucide-react";
import { RecoveryOrderDto } from "@/types/recovery-order";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

type ActionsProps = {
  recoveryOrder: RecoveryOrderDto;
  onViewDetails: (id: string) => void;
  onEdit: (id: string) => void;
  onCancel: (id: string) => void;
  onDownloadPdf: (id: string) => void;
  isDownloadingPdf: boolean;
  onStart: (id: string) => void;
  onProcessFinalization: (id: string) => void;
  onUpdatePurity: (id: string) => void;
};

const ActionsCell = ({ recoveryOrder, onViewDetails, onEdit, onCancel, onDownloadPdf, isDownloadingPdf, onStart, onProcessFinalization, onUpdatePurity }: ActionsProps) => {
  const isFinalizado = recoveryOrder.status === "FINALIZADA";
  const isPendente = recoveryOrder.status === "PENDENTE";
  const isEmAndamento = recoveryOrder.status === "EM_ANDAMENTO";
  const isAguardandoResultado = recoveryOrder.status === "AGUARDANDO_RESULTADO";
  const isAguardandoTeor = recoveryOrder.status === "AGUARDANDO_TEOR";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Ações</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onViewDetails(recoveryOrder.id)}>
          Detalhes
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(recoveryOrder.id)}>
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDownloadPdf(recoveryOrder.id)} disabled={isDownloadingPdf}>
          <Paperclip className="mr-2 h-4 w-4" />
          {isDownloadingPdf ? "Baixando..." : "Imprimir PDF"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isPendente && (
          <DropdownMenuItem onClick={() => onStart(recoveryOrder.id)}>
            <Play className="mr-2 h-4 w-4" />
            Iniciar
          </DropdownMenuItem>
        )}
        {(isEmAndamento || isAguardandoResultado) && (
          <DropdownMenuItem onClick={() => onProcessFinalization(recoveryOrder.id)}>
            <FlaskConical className="mr-2 h-4 w-4" />
            Lançar Resultado
          </DropdownMenuItem>
        )}
        {isAguardandoTeor && (
          <DropdownMenuItem onClick={() => onUpdatePurity(recoveryOrder.id)}>
            <Microscope className="mr-2 h-4 w-4" />
            Lançar Teor
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onCancel(recoveryOrder.id)}
          disabled={isFinalizado}
          className="text-red-600"
        >
          Cancelar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const getColumns = (
    onViewDetails: (id: string) => void,
    onEdit: (id: string) => void,
    onCancel: (id: string) => void,
    onDownloadPdf: (id: string) => void,
    isDownloadingPdfFor: (id: string) => boolean,
    onStart: (id: string) => void,
    onProcessFinalization: (id: string) => void,
    onUpdatePurity: (id: string) => void,
): ColumnDef<RecoveryOrderDto>[] => [
  {
    accessorKey: "orderNumber",
    header: "Número da Ordem",
  },
  {
    accessorKey: "metalType",
    header: "Metal",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        const status = row.original.status;
        let variant: "default" | "secondary" | "destructive" | "outline" = "default";
        if (status === 'FINALIZADA') variant = 'secondary';
        if (status === 'CANCELADA') variant = 'destructive';
        return <Badge variant={variant}>{status}</Badge>;
    }
  },
  {
    accessorKey: "dataInicio",
    header: "Data Início",
    cell: ({ row }) => format(new Date(row.original.dataInicio), "dd/MM/yyyy"),
  },
  {
    accessorKey: "auPuroRecuperadoGramas",
    header: "Recuperado (g)",
    cell: ({ row }) => row.original.auPuroRecuperadoGramas?.toFixed(4) ?? "-",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const recoveryOrder = row.original;
      return (
        <ActionsCell
          recoveryOrder={recoveryOrder}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onCancel={onCancel}
          onDownloadPdf={onDownloadPdf}
          isDownloadingPdf={isDownloadingPdfFor(recoveryOrder.id)}
          onStart={onStart}
          onProcessFinalization={onProcessFinalization}
          onUpdatePurity={onUpdatePurity}
        />
      );
    },
  },
];
