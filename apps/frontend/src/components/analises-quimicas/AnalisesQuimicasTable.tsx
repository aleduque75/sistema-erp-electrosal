"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Paperclip, FlaskConical, CheckCircle, XCircle, ThumbsDown, RotateCw } from "lucide-react";
import { LancarResultadoModal } from "./LancarResultadoModal";
import { AnaliseQuimica } from "@/types/analise-quimica";
import { format } from 'date-fns';

interface AnalisesQuimicasTableProps {
  analises: AnaliseQuimica[];
  isLoading: boolean;
  onAnaliseUpdated: () => void;
}

import { StatusAnaliseQuimica } from '@sistema-erp-electrosal/core';
import { ChemicalAnalysisStatusBadge } from "@/components/ui/chemical-analysis-status-badge";

// Componente de Legenda
const StatusLegend = () => (
  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 bg-gray-50 rounded-md border mb-4">
    <p className="font-semibold text-sm">Legenda:</p>
    <div className="flex items-center gap-2">
      <ChemicalAnalysisStatusBadge status={StatusAnaliseQuimica.EM_ANALISE} />
      <span className="text-xs text-muted-foreground">Em Análise</span>
    </div>
    <div className="flex items-center gap-2">
      <ChemicalAnalysisStatusBadge status={StatusAnaliseQuimica.ANALISADO_AGUARDANDO_APROVACAO} />
      <span className="text-xs text-muted-foreground">Aguard. Aprovação</span>
    </div>
    <div className="flex items-center gap-2">
      <ChemicalAnalysisStatusBadge status={StatusAnaliseQuimica.APROVADO_PARA_RECUPERACAO} />
      <span className="text-xs text-muted-foreground">Aprovado</span>
    </div>
    <div className="flex items-center gap-2">
      <ChemicalAnalysisStatusBadge status={StatusAnaliseQuimica.RECUSADO_PELO_CLIENTE} />
      <span className="text-xs text-muted-foreground">Recusado</span>
    </div>
    <div className="flex items-center gap-2">
      <ChemicalAnalysisStatusBadge status={StatusAnaliseQuimica.FINALIZADO_RECUPERADO} />
      <span className="text-xs text-muted-foreground">Finalizado</span>
    </div>
  </div>
);

export function AnalisesQuimicasTable({
  analises,
  isLoading,
  onAnaliseUpdated,
}: AnalisesQuimicasTableProps) {
  const [analiseParaLancar, setAnaliseParaLancar] = useState<AnaliseQuimica | null>(null);

  const handleLancarResultadoSuccess = () => {
    setAnaliseParaLancar(null);
    onAnaliseUpdated();
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Nº Análise</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="w-[150px]">Data Entrada</TableHead>
              <TableHead>Material</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[50px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>...</TableCell>
                <TableCell>...</TableCell>
                <TableCell>...</TableCell>
                <TableCell>...</TableCell>
                <TableCell>...</TableCell>
                <TableCell>...</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (analises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <FlaskConical className="h-10 w-10 text-primary" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">Nenhuma análise encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Quando novas análises forem criadas, elas aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <>
      <StatusLegend />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Nº Análise</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="w-[150px]">Data Entrada</TableHead>
              <TableHead>Material</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[50px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analises.map((analise) => (
              <TableRow key={analise.id}>
                <TableCell className="font-medium">{analise.numeroAnalise}</TableCell>
                <TableCell>{analise.cliente?.name || 'N/A'}</TableCell>
                <TableCell>{format(new Date(analise.dataEntrada), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{analise.descricaoMaterial}</TableCell>
                <TableCell>
                  <ChemicalAnalysisStatusBadge status={analise.status} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      {analise.status === StatusAnaliseQuimica.EM_ANALISE && (
                        <>
                          <DropdownMenuItem
                            onClick={() => setAnaliseParaLancar(analise)}
                          >
                            <FlaskConical className="mr-2 h-4 w-4" />
                            Lançar Resultado
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancelar
                          </DropdownMenuItem>
                        </>
                      )}
                      {analise.status ===
                        StatusAnaliseQuimica.ANALISADO_AGUARDANDO_APROVACAO && (
                        <>
                          <DropdownMenuItem>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Aprovar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ThumbsDown className="mr-2 h-4 w-4" />
                            Reprovar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <RotateCw className="mr-2 h-4 w-4" />
                            Refazer
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Paperclip className="mr-2 h-4 w-4" />
                            Ver PDF
                          </DropdownMenuItem>
                        </>
                      )}
                      {analise.status ===
                        StatusAnaliseQuimica.APROVADO_PARA_RECUPERACAO && (
                        <DropdownMenuItem>
                          <Paperclip className="mr-2 h-4 w-4" />
                          Ver PDF
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <LancarResultadoModal
        isOpen={!!analiseParaLancar}
        onOpenChange={(open) => !open && setAnaliseParaLancar(null)}
        analise={analiseParaLancar}
        onSuccess={handleLancarResultadoSuccess}
      />
    </>
  );
}
