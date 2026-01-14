"use client";

import { useState, useEffect } from "react";
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
import { Media } from '@/types/media'; // NOVO IMPORT
import { format } from "date-fns";
import { Printer, X, Paperclip, Pencil, Check, Loader2 } from "lucide-react";
import { updateAnaliseQuimica } from "@/services/analisesApi";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Image from "next/image";
import api from "@/lib/api";
import { toast } from "sonner";
import { ImageUpload } from "@/components/shared/ImageUpload"; // NOVO IMPORT
import { ImageGallery } from "@/components/shared/ImageGallery"; // NOVO IMPORT
import { getMediaForAnaliseQuimica } from "@/services/mediaApi"; // NOVO IMPORT
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface VisualizarAnaliseModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  analise: AnaliseQuimica | null;
  onUpdate?: () => void;
}

// Sub-componente para padronizar a exibição de detalhes
const DetailItem = ({ label, value, unit = '', className = '' }: { label: string; value: React.ReactNode; unit?: string, className?: string }) => (
  <div className={cn("flex flex-col", className)}>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <div className="text-base font-medium">{value} {unit}</div>
  </div>
);

// Componente de Legenda (mantido para compatibilidade, embora não usado diretamente aqui)
const StatusBadge = ({ status }: { status: string }) => {
  const statusVariant: Record<string, "default" | "secondary" | "success" | "destructive"> = {
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
  onUpdate,
}: VisualizarAnaliseModalProps) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<string | null>(null);
  const [media, setMedia] = useState<Media[]>([]); // NOVO ESTADO
  const [isLoadingMedia, setIsLoadingMedia] = useState(false); // NOVO ESTADO
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [isSavingDescription, setIsSavingDescription] = useState(false);

  // Efeito para carregar as mídias quando o modal é aberto ou a análise muda
  useEffect(() => {
    if (isOpen && analise?.id) {
      setEditedDescription(analise.descricaoMaterial);
      const fetchMedia = async () => {
        setIsLoadingMedia(true);
        try {
          const fetchedMedia = await getMediaForAnaliseQuimica(analise.id);
          setMedia(fetchedMedia);
        } catch (error) {
          toast.error("Erro ao carregar mídias da análise.");
          console.error("Erro ao carregar mídias:", error);
        } finally {
          setIsLoadingMedia(false);
        }
      };
      fetchMedia();
    }
  }, [isOpen, analise?.id, analise?.descricaoMaterial]);

  const handleMediaUpdate = () => {
    if (analise?.id) {
      const fetchMedia = async () => {
        setIsLoadingMedia(true);
        try {
          const fetchedMedia = await getMediaForAnaliseQuimica(analise.id);
          setMedia(fetchedMedia);
        } catch (error) {
          toast.error("Erro ao recarregar mídias da análise.");
          console.error("Erro ao recarregar mídias:", error);
        } finally {
          setIsLoadingMedia(false);
        }
      };
      fetchMedia();
    }
  };

  const handleSaveDescription = async () => {
    if (!analise) return;
    setIsSavingDescription(true);
    try {
      await updateAnaliseQuimica(analise.id, { descricaoMaterial: editedDescription });
      toast.success("Descrição atualizada com sucesso!");
      setIsEditingDescription(false);
      onUpdate?.();
    } catch (error) {
      toast.error("Erro ao atualizar descrição.");
      console.error(error);
    } finally {
      setIsSavingDescription(false);
    }
  };

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
      <DialogContent className="sm:max-w-4xl p-0 gap-0 overflow-hidden print:m-0 print:border-none print:shadow-none bg-muted/10">
        <div className="absolute left-6 top-6 print:hidden z-10">
          <Image src="/images/logoAtual.png" alt="Logo" width={120} height={32} />
        </div>

        <DialogHeader className="p-6 pb-2 bg-background border-b print:hidden text-center relative">
          <DialogTitle className="flex justify-center items-center gap-2 pt-8 text-2xl">
            Análise #{analise.numeroAnalise}
            <StatusBadge status={analise.status} />
          </DialogTitle>
          <DialogDescription className="text-center">
            Detalhes completos da análise, resultados e valores.
          </DialogDescription>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </DialogClose>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto bg-muted/10">
          
          {/* Seção de Informações Gerais */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-primary">Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DetailItem label="Nº Análise" value={analise.numeroAnalise} />
                <DetailItem label="Data de Entrada" value={format(new Date(analise.dataEntrada), "dd/MM/yyyy HH:mm")} />
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-muted-foreground">Material</p>
                  {isEditingDescription ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSaveDescription} disabled={isSavingDescription}>
                        {isSavingDescription ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => { setIsEditingDescription(false); setEditedDescription(analise.descricaoMaterial); }} disabled={isSavingDescription}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <p className="text-base font-medium">{analise.descricaoMaterial}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setIsEditingDescription(true)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <DetailItem label="Metal" value={analise.metalType || 'AU'} />
                <DetailItem label="Cliente" value={analise.cliente?.name || "N/A"} className="lg:col-span-2" />
                {analise.volumeOuPesoEntrada && (
                  <DetailItem label="Peso/Volume de Entrada" value={analise.volumeOuPesoEntrada} unit={analise.unidadeEntrada} />
                )}
              </div>
              {analise.observacoes && (
                <div className="mt-4 pt-4 border-t">
                   <p className="text-sm font-medium text-muted-foreground mb-1">Observações</p>
                   <p className="text-sm p-3 bg-muted/50 rounded-md border">{analise.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seção de Resultados */}
          {hasResultados && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-primary">Resultados da Análise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {analise.resultadoAnaliseValor != null && (
                    <DetailItem label="Resultado Análise" value={analise.resultadoAnaliseValor} unit="%" />
                  )}
                  {Object.entries(analise.resultado).map(([key, value]) => 
                    (value != null && typeof value !== 'object') && <DetailItem key={key} label={key.toUpperCase()} value={value as React.ReactNode} unit="%" />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seção de Resultados Reais */}
            {analise.auEstimadoBrutoGramas != null && (
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-primary">Resultado Real</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                      <DetailItem label="Au Estimado Bruto" value={analise.auEstimadoBrutoGramas} unit="g" className="text-lg" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Seção de Valores Finais */}
            {hasValoresFinais && (
               <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-primary">Valores Finais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {analise.taxaServicoPercentual != null && (
                      <DetailItem label="% Serviço" value={analise.taxaServicoPercentual} unit="%" />
                    )}
                    {analise.auEstimadoRecuperavelGramas != null && (
                      <DetailItem label="Au Estimado Líquido" value={analise.auEstimadoRecuperavelGramas} unit="g" />
                    )}
                    {analise.auLiquidoParaClienteGramas != null && (
                      <DetailItem label="Au Líquido para Cliente" value={analise.auLiquidoParaClienteGramas} unit="g" className="text-lg font-bold text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Seção de Imagens */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-primary">Imagens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analise.id ? ( 
                  <ImageUpload entity={{ type: 'analiseQuimica', id: analise.id }} onUploadSuccess={handleMediaUpdate} />
                ) : (
                  <p className="text-sm text-muted-foreground">ID da análise não disponível para upload de imagens.</p>
                )}
                {isLoadingMedia ? (
                  <p className="text-sm text-muted-foreground">Carregando imagens...</p>
                ) : media.length > 0 ? (
                  <ImageGallery media={media} onDeleteSuccess={handleMediaUpdate} />
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma imagem associada a esta análise.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 p-4 bg-background border-t print:hidden">
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
      </DialogContent>
    </Dialog>
  );
}
