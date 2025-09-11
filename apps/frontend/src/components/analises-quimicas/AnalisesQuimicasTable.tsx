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
import { MoreHorizontal, Paperclip, FlaskConical, CheckCircle } from "lucide-react";
import { LancarResultadoModal } from "./LancarResultadoModal";
import { AnaliseQuimica } from "@/types/analise-quimica";
import { format } from 'date-fns';

interface AnalisesQuimicasTableProps {
  analises: AnaliseQuimica[];
  isLoading: boolean;
  onAnaliseUpdated: () => void;
}

type Status = AnaliseQuimica['status'];

const statusText: Record<Status, string> = {
  PENDENTE: 'Pendente',
  EM_ANALISE: 'Em Análise',
  CONCLUIDA: 'Concluída',
  APROVADA: 'Aprovada',
};

const StatusBadge = ({ status }: { status: Status }) => {
  const statusVariant: Record<Status, "default" | "secondary" | "success" | "destructive"> = {
    PENDENTE: "default",
    EM_ANALISE: "secondary",
    CONCLUIDA: "success",
    APROVADA: "destructive", // Mantendo 'destructive' para Aprovada como exemplo
  };

  return (
    <Badge variant={statusVariant[status] || "default"}>{statusText[status]}</Badge>
  );
};


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
                <TableCell>{analise.cliente?.nome || 'N/A'}</TableCell>
                <TableCell>{format(new Date(analise.dataEntrada), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{analise.descricaoMaterial}</TableCell>
                <TableCell>
                  <StatusBadge status={analise.status} />
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
                      <DropdownMenuItem onClick={() => {
                        console.log("Analise original (Lançar Resultado):", analise);
                        console.log("Analise ID (Lançar Resultado):", analise.id);
                        const analiseWithId = { ...analise, id: analise.id || 'missing-id' }; // Ensure id is present
                        console.log("Analise com ID garantido (Lançar Resultado):", analiseWithId);
                        setAnaliseParaLancar(analiseWithId);
                      }}>
                        <FlaskConical className="mr-2 h-4 w-4" />
                        Lançar Resultado
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Paperclip className="mr-2 h-4 w-4" />
                        Ver PDF
                      </DropdownMenuItem>
                       <DropdownMenuItem>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Aprovar
                      </DropdownMenuItem>
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
