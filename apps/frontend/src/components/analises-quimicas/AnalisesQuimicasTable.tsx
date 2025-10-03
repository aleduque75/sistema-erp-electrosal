"use client";

import { useState, useEffect } from "react";
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
import {
  MoreHorizontal,
  Paperclip,
  FlaskConical,
  CheckCircle,
  XCircle,
  ThumbsDown,
  RotateCw,
} from "lucide-react";
import { LancarResultadoModal } from "./LancarResultadoModal";
import { VisualizarAnaliseModal } from "./VisualizarAnaliseModal";
import { AnaliseQuimica } from "../../types/analise-quimica";
import { StatusAnaliseQuimica } from "@sistema-erp-electrosal/core";
// Importação como valor
import { format } from "date-fns";
import { ChemicalAnalysisStatusBadge } from "@/components/ui/chemical-analysis-status-badge";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  aprovarAnaliseQuimica,
  reprovarAnaliseQuimica,
  refazerAnaliseQuimica,
} from "@/services/analisesApi";

interface AnalisesQuimicasTableProps {
  analises: AnaliseQuimica[];
  isLoading: boolean;
  onAnaliseUpdated: () => void;
}

export function AnalisesQuimicasTable({
  analises,
  isLoading,
  onAnaliseUpdated,
}: AnalisesQuimicasTableProps) {
  const [analiseParaLancar, setAnaliseParaLancar] =
    useState<AnaliseQuimica | null>(null);
  const [analiseParaVisualizar, setAnaliseParaVisualizar] =
    useState<AnaliseQuimica | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<string | null>(null); // Armazena o ID da análise sendo baixada

  const handleLancarResultadoSuccess = () => {
    setAnaliseParaLancar(null);
    onAnaliseUpdated();
  };

  const handleDownloadPdf = async (analiseId: string) => {
    const token = localStorage.getItem("accessToken");
    console.log(
      "Tentando baixar PDF. Token de acesso encontrado:",
      token ? "Sim" : "Não"
    );

    setIsDownloadingPdf(analiseId);
    try {
      const response = await api.get(`/analises-quimicas/${analiseId}/pdf`, {
        responseType: "blob", // Importante para obter a resposta como um blob binário
      });

      // Cria uma URL para o blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `analise_${analiseId}.pdf`);

      // Adiciona ao html, clica e remove
      document.body.appendChild(link);
      link.click();

      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }

      // Limpa a URL do blob
      window.URL.revokeObjectURL(url);
      toast.success("Download do PDF iniciado.");
    } catch (error) {
      console.error("Falha ao baixar o PDF:", error);
      toast.error("Falha ao baixar o PDF. Tente novamente.");
    } finally {
      setIsDownloadingPdf(null);
    }
  };

  const handleAprovarAnalise = async (analiseId: string) => {
    try {
      await aprovarAnaliseQuimica(analiseId);
      toast.success("Análise aprovada com sucesso!");
      onAnaliseUpdated();
    } catch (error: any) {
      toast.error("Erro ao aprovar análise", { description: error.message });
    }
  };

  const handleReprovarAnalise = async (analiseId: string) => {
    try {
      await reprovarAnaliseQuimica(analiseId);
      toast.success("Análise reprovada com sucesso!");
      onAnaliseUpdated();
    } catch (error: any) {
      toast.error("Erro ao reprovar análise", { description: error.message });
    }
  };

  const handleRefazerAnalise = async (analiseId: string) => {
    try {
      await refazerAnaliseQuimica(analiseId);
      toast.success("Análise refeita com sucesso!");
      onAnaliseUpdated();
    } catch (error: any) {
      toast.error("Erro ao refazer análise", { description: error.message });
    }
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
        <h2 className="mt-6 text-xl font-semibold">
          Nenhuma análise encontrada
        </h2>
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
                <TableCell className="font-medium">
                  {analise.numeroAnalise}
                </TableCell>
                <TableCell>{analise.cliente?.name || "N/A"}</TableCell>
                <TableCell>
                  {format(new Date(analise.dataEntrada), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>{analise.descricaoMaterial}</TableCell>
                <TableCell>
                  {/* Removemos 'as any' e confiamos no tipo corrigido do Badge */}
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
                      {analise.status === "EM_ANALISE" && (
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
                      {analise.status === "ANALISADO_AGUARDANDO_APROVACAO" && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleAprovarAnalise(analise.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Aprovar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleReprovarAnalise(analise.id)}
                          >
                            <ThumbsDown className="mr-2 h-4 w-4" />
                            Reprovar
                          </DropdownMenuItem>
                          {/* ... restante do bloco ... */}
                        </>
                      )}
                      {analise.status === "APROVADO_PARA_RECUPERACAO" && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleDownloadPdf(analise.id)}
                            disabled={isDownloadingPdf === analise.id}
                          >
                            <Paperclip className="mr-2 h-4 w-4" />
                            {isDownloadingPdf === analise.id
                              ? "Baixando..."
                              : "Imprimir PDF"}
                          </DropdownMenuItem>
                          {/* ... restante do bloco ... */}
                        </>
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

      <VisualizarAnaliseModal
        isOpen={!!analiseParaVisualizar}
        onOpenChange={(open) => !open && setAnaliseParaVisualizar(null)}
        analise={analiseParaVisualizar}
      />
    </>
  );
}
