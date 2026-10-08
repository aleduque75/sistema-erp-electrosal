"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FlaskConical,
  Calendar,
  User,
  Scale,
  FileText,
  Clock,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Percent,
} from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import api from "@/lib/api";
import Link from "next/link";

interface ChemicalAnalysisDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId?: string | null;
  initialAnalysis?: any;
  clientName?: string;
}

const formatNumber = (value?: number | null, decimals = 4) => {
  if (value === null || value === undefined || isNaN(Number(value))) return "-";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value));
};

export function ChemicalAnalysisDetailsModal({
  isOpen,
  onClose,
  analysisId,
  initialAnalysis,
  clientName: initialClientName,
}: ChemicalAnalysisDetailsModalProps) {
  const [analysis, setAnalysis] = useState<any>(initialAnalysis || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const targetId = analysisId || initialAnalysis?.id;

    if (initialAnalysis) {
      setAnalysis(initialAnalysis);
    }

    if (targetId) {
      setIsLoading(true);
      api
        .get(`/analises-quimicas/${targetId}`)
        .then((res) => {
          if (res.data) {
            setAnalysis(res.data);
          }
        })
        .catch((err) => {
          console.warn("Não foi possível carregar detalhes completos da análise via API:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, analysisId, initialAnalysis]);

  if (!isOpen) return null;

  const rawNumero = analysis?.numeroAnalise || initialAnalysis?.numeroAnalise || "";
  const cleanNumero = String(rawNumero).replace(/^[#\s]*crr-?/i, "").trim();
  const displayNumero = `#CRR-${cleanNumero || rawNumero || "---"}`;

  const clientName =
    analysis?.cliente?.name ||
    analysis?.clientName ||
    initialClientName ||
    "Cliente não informado";

  const metalType = analysis?.metalType || initialAnalysis?.metalType || "AU";
  const dataEntrada = analysis?.dataEntrada || initialAnalysis?.dataEntrada;
  const material = analysis?.descricaoMaterial || initialAnalysis?.descricaoMaterial || "-";
  const pesoEntrada = analysis?.volumeOuPesoEntrada ?? initialAnalysis?.volumeOuPesoEntrada;
  const unidadeEntrada = analysis?.unidadeEntrada || initialAnalysis?.unidadeEntrada || "g";

  const teor = analysis?.resultadoAnaliseValor ?? initialAnalysis?.resultadoAnaliseValor;
  const unidadeTeor = analysis?.unidadeResultado || initialAnalysis?.unidadeResultado || "g/kg";

  const metalLiquido =
    analysis?.auLiquidoParaClienteGramas ??
    initialAnalysis?.auLiquidoParaClienteGramas ??
    analysis?.auEstimadoRecuperavelGramas ??
    null;

  const status = analysis?.status || initialAnalysis?.status || "RECEBIDO";

  const statusMap: Record<string, { label: string; color: string }> = {
    RECEBIDO: { label: "Recebido", color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200" },
    EM_ANALISE: { label: "Em Análise", color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200" },
    AGUARDANDO_APROVACAO: { label: "Aguardando Aprovação", color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200" },
    APROVADO: { label: "Aprovado", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200" },
    CONCLUIDO: { label: "Concluído", color: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300 border-slate-200" },
    FINALIZADO: { label: "Finalizado", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200" },
    REPROVADO: { label: "Reprovado", color: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200" },
  };

  const currentStatus = statusMap[status] || {
    label: status,
    color: "bg-muted text-muted-foreground",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-primary" />
                  Análise Química
                  <span className="font-mono text-primary font-black ml-1">{displayNumero}</span>
                </DialogTitle>
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              </div>
              <DialogDescription>
                Informações cadastrais e resultados técnicos do lote de origem.
              </DialogDescription>
            </div>
            <Badge variant="outline" className={`text-xs px-2.5 py-1 ${currentStatus.color}`}>
              {currentStatus.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-4">
          {/* Top Quick Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="bg-muted/40 border-muted">
              <CardContent className="p-3.5 space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-primary" /> Cliente
                </p>
                <p className="text-sm font-semibold text-foreground truncate" title={clientName}>
                  {clientName}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-muted/40 border-muted">
              <CardContent className="p-3.5 space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-primary" /> Data de Entrada
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {dataEntrada ? formatDate(dataEntrada.toString()) : "Não informada"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3.5 space-y-1">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                  <Scale className="w-3 h-3" /> Metal Avaliado
                </p>
                <p className="text-sm font-black text-primary">
                  {metalType === "AU" ? "Ouro (AU)" : metalType === "AG" ? "Prata (AG)" : metalType}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Section: Material e Peso de Entrada */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" /> Material Recebido
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="p-3 rounded-md bg-muted/30 border border-muted-foreground/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                  Descrição do Material
                </span>
                <p className="text-sm font-medium text-foreground leading-snug">
                  {material}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="flex flex-col">
                  <span className="text-muted-foreground font-semibold">Peso / Volume de Entrada:</span>
                  <span className="text-base font-bold text-foreground">
                    {pesoEntrada !== null && pesoEntrada !== undefined
                      ? `${formatNumber(pesoEntrada, 2)} ${unidadeEntrada}`
                      : "-"}
                  </span>
                </div>
                {analysis?.dataAnaliseConcluida && (
                  <div className="flex flex-col text-right">
                    <span className="text-muted-foreground font-semibold">Data Conclusão:</span>
                    <span className="text-sm font-medium text-foreground">
                      {formatDate(analysis.dataAnaliseConcluida.toString())}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section: Resultados Técnicos e Metal Líquido */}
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5" /> Resultados & Rendimento
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-md bg-background border space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Teor / Concentração
                  </span>
                  <p className="text-lg font-black text-foreground">
                    {teor !== null && teor !== undefined
                      ? `${formatNumber(teor, 2)} ${unidadeTeor}`
                      : "Em processamento"}
                  </p>
                </div>

                <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Metal Líquido ({metalType})
                  </span>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {metalLiquido !== null && metalLiquido !== undefined
                      ? `${formatNumber(metalLiquido, 4)} g`
                      : "Sob análise"}
                  </p>
                </div>
              </div>

              {(analysis?.taxaServicoPercentual || analysis?.percentualQuebra || analysis?.teorRecuperavel) && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t text-[11px]">
                  {analysis?.teorRecuperavel !== undefined && (
                    <div>
                      <span className="text-muted-foreground block">Teor Recuperável:</span>
                      <span className="font-semibold">{formatNumber(analysis.teorRecuperavel, 2)}%</span>
                    </div>
                  )}
                  {analysis?.taxaServicoPercentual !== undefined && (
                    <div>
                      <span className="text-muted-foreground block">Taxa de Serviço:</span>
                      <span className="font-semibold">{formatNumber(analysis.taxaServicoPercentual, 2)}%</span>
                    </div>
                  )}
                  {analysis?.percentualQuebra !== undefined && (
                    <div>
                      <span className="text-muted-foreground block">Quebra:</span>
                      <span className="font-semibold">{formatNumber(analysis.percentualQuebra, 2)}%</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observações */}
          {analysis?.observacoes && (
            <Card>
              <CardContent className="p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3 text-muted-foreground" /> Observações
                </span>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                  {analysis.observacoes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="p-4 bg-muted/30 border-t flex flex-row items-center justify-between gap-2">
          <Link
            href="/analises-quimicas"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
          >
            <span>Ver no Módulo de Análises</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <Button size="sm" variant="default" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
