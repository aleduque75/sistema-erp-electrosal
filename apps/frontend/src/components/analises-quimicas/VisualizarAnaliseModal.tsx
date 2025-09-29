"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AnaliseQuimica } from '@/types/analise-quimica';
import { format } from "date-fns";
import { Printer, X, Paperclip } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Image from "next/image";
import api from "@/lib/api";
import { toast } from "sonner";

interface VisualizarAnaliseModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  analise: AnaliseQuimica | null;
}

// Sub-componente para padronizar a exibição de detalhes
const DetailItem = ({ label, value, unit = '', className = '' }: { label: string; value: React.ReactNode; unit?: string, className?: string }) => (
  <div className={cn("flex flex-col", className)}>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className="text-base">{value} {unit}</p>
  </div>
);

// Componente de Legenda (mantido para compatibilidade, embora não usado diretamente aqui)
const StatusBadge = ({ status }: { status: AnaliseQuimica['status'] }) => {
  const statusVariant: Record<AnaliseQuimica['status'], "default" | "secondary" | "success" | "destructive"> = {
    PENDENTE: "default",
    EM_ANALISE: "secondary",
    CONCLUIDA: "success",
    APROVADA: "destructive",
  };
  return <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", statusVariant[status])}>{status.replace('_', ' ')}</span>;
};

export function VisualizarAnaliseModal({
  isOpen,
  onOpenChange,
  analise,
}: VisualizarAnaliseModalProps) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<string | null>(null); // Armazena o ID da análise sendo baixada

  if (!analise) {
    return null;
  }

  const handleDownloadPdf = async (analiseId: string, printMode: boolean = false) => {
    setIsDownloadingPdf(analiseId);
    try {
      const response = await api.get(`/analises-quimicas/${analiseId}/pdf`, {
        responseType: 'blob', // Importante para obter a resposta como um blob binário
      });

      // Cria uma URL para o blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analise_${analiseId}.pdf`);
      
      // Se for modo de impressão, abre em nova aba sem download forçado
      if (printMode) {
        window.open(url, '_blank');
      } else {
        // Adiciona ao html, clica e remove para forçar download
        document.body.appendChild(link);
        link.click();
        if(link.parentNode) {
          link.parentNode.removeChild(link);
        }
      }

      // Limpa a URL do blob
      window.URL.revokeObjectURL(url);
      toast.success("Download do PDF iniciado.");

    } catch (error) {
      console.error("Falha ao baixar o PDF:", error);
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as any).response === "object" &&
        (error as any).response !== null &&
        "status" in (error as any).response &&
        (error as any).response.status === 401
      ) {
        toast.error("Sua sessão expirou ou você não está autorizado. Por favor, faça login novamente.");
      } else {
        toast.error("Falha ao baixar o PDF. Tente novamente.");
      }
    } finally {
      setIsDownloadingPdf(null);
    }
  };

  const hasResultados = analise.resultado && Object.values(analise.resultado).some(v => v != null);
  const hasValoresFinais = analise.auEstimadoBrutoGramas || analise.auLiquidoParaClienteGramas;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-12 print:m-0 print:border-none print:shadow-none">
        <div className="absolute left-6 top-6 print:hidden">
          <Image src="/images/logoAtual.png" alt="Logo" width={150} height={40} />
        </div>

        <DialogHeader className="p-6 pb-4 print:hidden text-center">
          <DialogTitle className="flex justify-center items-center pt-8">
            Análise #{analise.numeroAnalise}
            <StatusBadge status={analise.status} />
          </DialogTitle>
          <DialogDescription className="text-center">
            Detalhes completos da análise, resultados e valores.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Seção de Informações Gerais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Informações Gerais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DetailItem label="Nº Análise" value={analise.numeroAnalise} />
              <DetailItem label="Data de Entrada" value={format(new Date(analise.dataEntrada), "dd/MM/yyyy HH:mm")} />
              <DetailItem label="Material" value={analise.descricaoMaterial} />
            </div>
            <div className="grid grid-cols-1">
                <DetailItem label="Cliente" value={analise.cliente?.name || "N/A"} />
            </div>
            <div className="grid grid-cols-1">
              {analise.volumeOuPesoEntrada && (
                <DetailItem label="Peso/Volume de Entrada" value={analise.volumeOuPesoEntrada} unit={analise.unidadeEntrada} />
              )}
            </div>
             {analise.observacoes && (
                <div className="col-span-full pt-2">
                   <p className="text-sm font-medium text-muted-foreground">Observações</p>
                   <p className="text-sm p-3 bg-muted/50 rounded-md border">{analise.observacoes}</p>
                </div>
              )}
          </div>

          {/* Seção de Resultados */}
          {hasResultados && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Resultados da Análise</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {analise.resultadoAnaliseValor != null && (
                    <DetailItem label="Resultado Análise" value={analise.resultadoAnaliseValor} unit="%" />
                  )}
                  {Object.entries(analise.resultado).map(([key, value]) => 
                    (value != null && typeof value !== 'object') && <DetailItem key={key} label={key.toUpperCase()} value={value as React.ReactNode} unit="%" />
                  )}
                </div>
              </div>
            </>
          )}

          {/* Seção de Resultados Reais */}
          {analise.auEstimadoBrutoGramas != null && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Resultado Real</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Au Estimado Bruto" value={analise.auEstimadoBrutoGramas} unit="g" />
                </div>
              </div>
            </>
          )}

          {/* Seção de Valores Finais */}
          {hasValoresFinais && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Valores Finais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analise.taxaServicoPercentual != null && (
                    <DetailItem label="% Serviço" value={analise.taxaServicoPercentual} unit="%" />
                  )}
                  {analise.auEstimadoRecuperavelGramas != null && (
                    <DetailItem label="Au Estimado Líquido" value={analise.auEstimadoRecuperavelGramas} unit="g" />
                  )}
                  {analise.auLiquidoParaClienteGramas != null && (
                    <DetailItem label="Au Líquido para Cliente" value={analise.auLiquidoParaClienteGramas} unit="g" />
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 bg-muted/50 border-t print:hidden">
          <Button 
            variant="outline" 
            onClick={() => handleDownloadPdf(analise.id, true)} 
            disabled={isDownloadingPdf === analise.id}
          >
            <Printer className="mr-2 h-4 w-4" /> 
            {isDownloadingPdf === analise.id ? 'Gerando...' : 'Imprimir PDF'}
          </Button>
          <DialogClose asChild>
            <Button variant="ghost">Fechar</Button>
          </DialogClose>
        </div>
        
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground print:hidden">
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
