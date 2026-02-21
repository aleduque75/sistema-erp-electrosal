"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer";

import { Button } from "@/components/ui/button";
import { AnaliseQuimica } from '@/types/analise-quimica';
import { Media } from '@/types/media';
import { format } from "date-fns";
import { Printer, X, Paperclip, Pencil, Check, Loader2, ClipboardList, FlaskConical, DollarSign, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";
import api from "@/lib/api";
import { toast } from "sonner";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { ImageGallery } from "@/components/shared/ImageGallery";
import { getMediaForAnaliseQuimica } from "@/services/mediaApi";
import { ChemicalAnalysisStatusBadge } from "@/components/ui/chemical-analysis-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-media-query";
import { getAnaliseQuimicaById, updateAnaliseQuimica } from "@/services/analisesApi";

// Props interface remains the same
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

const formatDecimal = (value: number | null | undefined, fractionDigits: number = 2) => {
  if (value === null || value === undefined) return "N/A";
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(value);
};

// ... (EditableDateDetailItem component can remain the same)
interface EditableDateDetailItemProps {
  label: string;
  value: Date | undefined;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  editedValue: Date | undefined;
  setEditedValue: (value: Date | undefined) => void;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
  className?: string;
}

const EditableDateDetailItem = ({
  label,
  value,
  isEditing,
  setIsEditing,
  editedValue,
  setEditedValue,
  isSaving,
  onSave,
  onCancel,
  className = '',
}: EditableDateDetailItemProps) => {
  return (
    <div className={cn("flex flex-col", className)}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {isEditing ? (
        <div className="flex items-center gap-2 mt-1">
          <DatePicker
            date={editedValue}
            onDateChange={setEditedValue}
            placeholder={label}
            className="w-auto"
          />
          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={onSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={onCancel} disabled={isSaving}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <p className="text-base font-medium">{value ? format(value, "dd/MM/yyyy HH:mm") : "N/A"}</p>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setIsEditing(true)}>
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};


// Shared content component
const ModalContent = ({
  currentAnalise,
  media,
  isLoadingMedia,
  isDownloadingPdf,
  isWritingOff,
  isEditingDescription, setIsEditingDescription, editedDescription, setEditedDescription, handleSaveDescription, isSavingDescription,
  isEditingDataEntrada, setIsEditingDataEntrada, editedDataEntrada, setEditedDataEntrada, isSavingDataEntrada, setIsSavingDataEntrada, handleSaveDate,
  isEditingDataAnaliseConcluida, setIsEditingDataAnaliseConcluida, editedDataAnaliseConcluida, setEditedDataAnaliseConcluida, isSavingDataAnaliseConcluida, setIsSavingDataAnaliseConcluida,
  isEditingDataAprovacaoCliente, setIsEditingDataAprovacaoCliente, editedDataAprovacaoCliente, setEditedDataAprovacaoCliente, isSavingDataAprovacaoCliente, setIsSavingDataAprovacaoCliente,
  isEditingDataFinalizacaoRecuperacao, setIsEditingDataFinalizacaoRecuperacao, editedDataFinalizacaoRecuperacao, setEditedDataFinalizacaoRecuperacao, isSavingDataFinalizacaoRecuperacao, setIsSavingDataFinalizacaoRecuperacao,
  handleWriteOff, handleDownloadPdf, handleMediaUpdate
}: any) => {

  const hasResultados = currentAnalise.resultado && Object.values(currentAnalise.resultado).some((v: any) => v != null);
  const hasValoresFinais = currentAnalise.auEstimadoBrutoGramas || currentAnalise.auLiquidoParaClienteGramas;

  return (
    <>
      <Tabs defaultValue="geral" className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-background p-0 px-2 print:hidden">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="resultados">Resultados</TabsTrigger>
          <TabsTrigger value="midias">Mídias</TabsTrigger>
        </TabsList>

        <div className="p-4 sm:p-6 space-y-6 bg-muted/10">
          <TabsContent value="geral">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2"><ClipboardList className="h-5 w-5" />Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <DetailItem label="Nº Análise" value={currentAnalise.numeroAnalise} />
                  <DetailItem label="Metal" value={currentAnalise.metalType || 'AU'} />
                  <DetailItem label="Cliente" value={currentAnalise.cliente?.name || "N/A"} className="md:col-span-2" />
                  <div className="flex flex-col md:col-span-2">
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
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => { setIsEditingDescription(false); setEditedDescription(currentAnalise.descricaoMaterial); }} disabled={isSavingDescription}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <p className="text-base font-medium break-words">{currentAnalise.descricaoMaterial}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setIsEditingDescription(true)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {currentAnalise.volumeOuPesoEntrada != null && (
                    <DetailItem label="Peso/Volume de Entrada" value={formatDecimal(currentAnalise.volumeOuPesoEntrada, 2)} unit={currentAnalise.unidadeEntrada} />
                  )}
                  <EditableDateDetailItem
                    label="Data de Entrada"
                    value={currentAnalise.dataEntrada ? new Date(currentAnalise.dataEntrada) : undefined}
                    isEditing={isEditingDataEntrada}
                    setIsEditing={setIsEditingDataEntrada}
                    editedValue={editedDataEntrada}
                    setEditedValue={setEditedDataEntrada as (date: Date | undefined) => void}
                    isSaving={isSavingDataEntrada}
                    onSave={() => handleSaveDate('dataEntrada', editedDataEntrada, setIsEditingDataEntrada, setIsSavingDataEntrada)}
                    onCancel={() => { setIsEditingDataEntrada(false); setEditedDataEntrada(currentAnalise.dataEntrada ? new Date(currentAnalise.dataEntrada) : undefined); }}
                  />
                  {currentAnalise.ordemDeRecuperacaoId && (
                    <DetailItem
                      label="Ordem de Recuperação"
                      value={
                        <Link href={`/recovery-orders/${currentAnalise.ordemDeRecuperacaoId}`} className="text-primary hover:underline">
                          {currentAnalise.ordemDeRecuperacaoId}
                        </Link>
                      }
                      className="md:col-span-2"
                    />
                  )}
                  <EditableDateDetailItem
                    label="Análise Concluída em"
                    value={currentAnalise.dataAnaliseConcluida ? new Date(currentAnalise.dataAnaliseConcluida) : undefined}
                    isEditing={isEditingDataAnaliseConcluida}
                    setIsEditing={setIsEditingDataAnaliseConcluida}
                    editedValue={editedDataAnaliseConcluida}
                    setEditedValue={setEditedDataAnaliseConcluida as (date: Date | undefined) => void}
                    isSaving={isSavingDataAnaliseConcluida}
                    onSave={() => handleSaveDate('dataAnaliseConcluida', editedDataAnaliseConcluida, setIsEditingDataAnaliseConcluida, setIsSavingDataAnaliseConcluida)}
                    onCancel={() => { setIsEditingDataAnaliseConcluida(false); setEditedDataAnaliseConcluida(currentAnalise.dataAnaliseConcluida ? new Date(currentAnalise.dataAnaliseConcluida) : undefined); }}
                  />
                  <EditableDateDetailItem
                    label="Aprovado Cliente em"
                    value={currentAnalise.dataAprovacaoCliente ? new Date(currentAnalise.dataAprovacaoCliente) : undefined}
                    isEditing={isEditingDataAprovacaoCliente}
                    setIsEditing={setIsEditingDataAprovacaoCliente}
                    editedValue={editedDataAprovacaoCliente}
                    setEditedValue={setEditedDataAprovacaoCliente as (date: Date | undefined) => void}
                    isSaving={isSavingDataAprovacaoCliente}
                    onSave={() => handleSaveDate('dataAprovacaoCliente', editedDataAprovacaoCliente, setIsEditingDataAprovacaoCliente, setIsSavingDataAprovacaoCliente)}
                    onCancel={() => { setIsEditingDataAprovacaoCliente(false); setEditedDataAprovacaoCliente(currentAnalise.dataAprovacaoCliente ? new Date(currentAnalise.dataAprovacaoCliente) : undefined); }}
                  />
                  <EditableDateDetailItem
                    label="Recuperação Finalizada em"
                    value={currentAnalise.dataFinalizacaoRecuperacao ? new Date(currentAnalise.dataFinalizacaoRecuperacao) : undefined}
                    isEditing={isEditingDataFinalizacaoRecuperacao}
                    setIsEditing={setIsEditingDataFinalizacaoRecuperacao}
                    editedValue={editedDataFinalizacaoRecuperacao}
                    setEditedValue={setEditedDataFinalizacaoRecuperacao as (date: Date | undefined) => void}
                    isSaving={isSavingDataFinalizacaoRecuperacao}
                    onSave={() => handleSaveDate('dataFinalizacaoRecuperacao', editedDataFinalizacaoRecuperacao, setIsEditingDataFinalizacaoRecuperacao, setIsSavingDataFinalizacaoRecuperacao)}
                    onCancel={() => { setIsEditingDataFinalizacaoRecuperacao(false); setEditedDataFinalizacaoRecuperacao(currentAnalise.dataFinalizacaoRecuperacao ? new Date(currentAnalise.dataFinalizacaoRecuperacao) : undefined); }}
                  />
                </div>
                {currentAnalise.observacoes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Observações</p>
                    <p className="text-sm p-3 bg-muted/50 rounded-md border">{currentAnalise.observacoes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resultados" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2"><FlaskConical className="h-5 w-5" />Resultados da Análise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {currentAnalise.resultadoAnaliseValor != null && (
                    <DetailItem label="Resultado Análise" value={formatDecimal(currentAnalise.resultadoAnaliseValor, 2)} unit="%" />
                  )}
                  {currentAnalise.resultado && Object.entries(currentAnalise.resultado).map(([key, value]: [string, any]) =>
                    (value != null && typeof value !== 'object') && <DetailItem key={key} label={key.toUpperCase()} value={formatDecimal(value as number, 2)} unit="%" />
                  )}
                </div>
              </CardContent>
            </Card>
            {(currentAnalise.auEstimadoBrutoGramas != null || hasValoresFinais) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2"><DollarSign className="h-5 w-5" />Detalhamento Financeiro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentAnalise.auEstimadoBrutoGramas != null && (
                      <DetailItem label="Au Estimado Bruto" value={formatDecimal(currentAnalise.auEstimadoBrutoGramas, 4)} unit="g" className="text-lg" />
                    )}
                    {currentAnalise.taxaServicoPercentual != null && (
                      <DetailItem label="% Serviço" value={formatDecimal(currentAnalise.taxaServicoPercentual, 2)} unit="%" />
                    )}
                    {currentAnalise.auEstimadoRecuperavelGramas != null && (
                      <DetailItem label="Au Estimado Líquido" value={formatDecimal(currentAnalise.auEstimadoRecuperavelGramas, 4)} unit="g" />
                    )}
                    {currentAnalise.auLiquidoParaClienteGramas != null && (
                      <DetailItem label="Au Líquido para Cliente" value={formatDecimal(currentAnalise.auLiquidoParaClienteGramas, 4)} unit="g" className="text-lg font-bold text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="midias">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2"><ImageIcon className="h-5 w-5" />Imagens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentAnalise.id ? (
                    <ImageUpload entity={{ type: 'analiseQuimica', id: currentAnalise.id }} onMediaUploadSuccess={() => handleMediaUpdate(currentAnalise.id)} />
                  ) : (
                    <p className="text-sm text-muted-foreground">ID da análise não disponível para upload de imagens.</p>
                  )}
                  {isLoadingMedia ? (
                    <p className="text-sm text-muted-foreground">Carregando imagens...</p>
                  ) : media.length > 0 ? (
                    <ImageGallery media={media} onDeleteSuccess={() => handleMediaUpdate(currentAnalise.id)} />
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma imagem associada a esta análise.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </>
  )
}


export function VisualizarAnaliseModal({
  isOpen,
  onOpenChange,
  analise: initialAnalise,
  onUpdate,
}: VisualizarAnaliseModalProps) {
  const [currentAnalise, setCurrentAnalise] = useState<AnaliseQuimica | null>(initialAnalise);
  const [isFetchingAnalise, setIsFetchingAnalise] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<string | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [isEditingDataEntrada, setIsEditingDataEntrada] = useState(false);
  const [editedDataEntrada, setEditedDataEntrada] = useState<Date | undefined>(undefined);
  const [isSavingDataEntrada, setIsSavingDataEntrada] = useState(false);
  const [isEditingDataAnaliseConcluida, setIsEditingDataAnaliseConcluida] = useState(false);
  const [editedDataAnaliseConcluida, setEditedDataAnaliseConcluida] = useState<Date | undefined>(undefined);
  const [isSavingDataAnaliseConcluida, setIsSavingDataAnaliseConcluida] = useState(false);
  const [isEditingDataAprovacaoCliente, setIsEditingDataAprovacaoCliente] = useState(false);
  const [editedDataAprovacaoCliente, setEditedDataAprovacaoCliente] = useState<Date | undefined>(undefined);
  const [isSavingDataAprovacaoCliente, setIsSavingDataAprovacaoCliente] = useState(false);
  const [isEditingDataFinalizacaoRecuperacao, setIsEditingDataFinalizacaoRecuperacao] = useState(false);
  const [editedDataFinalizacaoRecuperacao, setEditedDataFinalizacaoRecuperacao] = useState<Date | undefined>(undefined);
  const [isSavingDataFinalizacaoRecuperacao, setIsSavingDataFinalizacaoRecuperacao] = useState(false);
  const [isWritingOff, setIsWritingOff] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleWriteOff = async () => {
    if (!currentAnalise) return;
    setIsWritingOff(true);
    try {
      await api.post(`/analises-quimicas/${currentAnalise.id}/write-off`);
      toast.success("Análise de resíduo baixada como perda com sucesso!");
      fetchAnaliseData(currentAnalise.id);
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao dar baixa no resíduo.");
    } finally {
      setIsWritingOff(false);
    }
  };

  const fetchAnaliseData = useCallback(async (analiseId: string) => {
    setIsFetchingAnalise(true);
    try {
      const fetchedAnalise = await getAnaliseQuimicaById(analiseId);
      setCurrentAnalise(fetchedAnalise);
      setEditedDescription(fetchedAnalise.descricaoMaterial);
      // Set all editable date states
    } catch (error) {
      toast.error("Erro ao carregar dados da análise.");
    } finally {
      setIsFetchingAnalise(false);
    }
  }, []);

  const fetchMedia = useCallback(async (analiseId: string) => {
    setIsLoadingMedia(true);
    try {
      const fetchedMedia = await getMediaForAnaliseQuimica(analiseId);
      setMedia(fetchedMedia);
    } catch (error) {
      toast.error("Erro ao carregar mídias da análise.");
    } finally {
      setIsLoadingMedia(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && initialAnalise?.id) {
      fetchAnaliseData(initialAnalise.id);
      fetchMedia(initialAnalise.id);
    } else {
      setCurrentAnalise(null);
    }
  }, [isOpen, initialAnalise?.id, fetchAnaliseData, fetchMedia]);

  const handleSaveDescription = async () => {
    if (!currentAnalise) return;
    setIsSavingDescription(true);
    try {
      await updateAnaliseQuimica(currentAnalise.id, {
        clienteId: currentAnalise.cliente?.id || '',
        metalType: currentAnalise.metalType as any || 'AU',
        dataEntrada: currentAnalise.dataEntrada,
        volumeOuPesoEntrada: currentAnalise.volumeOuPesoEntrada,
        unidadeEntrada: currentAnalise.unidadeEntrada,
        descricaoMaterial: editedDescription
      });
      toast.success("Descrição atualizada!");
      setIsEditingDescription(false);
      fetchAnaliseData(currentAnalise.id);
    } catch (error) {
      toast.error("Erro ao atualizar descrição.");
    } finally {
      setIsSavingDescription(false);
    }
  };

  const handleSaveDate = async (field: string, dateValue: Date | undefined, setIsEditing: any, setIsSaving: any) => {
    if (!currentAnalise || !dateValue) return;
    setIsSaving(true);
    try {
      await updateAnaliseQuimica(currentAnalise.id, {
        clienteId: currentAnalise.cliente?.id || '',
        metalType: currentAnalise.metalType as any || 'AU',
        dataEntrada: currentAnalise.dataEntrada,
        volumeOuPesoEntrada: currentAnalise.volumeOuPesoEntrada,
        unidadeEntrada: currentAnalise.unidadeEntrada,
        descricaoMaterial: currentAnalise.descricaoMaterial,
        [field]: dateValue.toISOString()
      });
      toast.success("Data atualizada!");
      setIsEditing(false);
      fetchAnaliseData(currentAnalise.id);
    } catch (error) {
      toast.error("Erro ao atualizar data.");
    } finally {
      setIsSaving(false);
    }
  };
  const handleDownloadPdf = async (analiseId: string) => {
    setIsDownloadingPdf(analiseId);
    try {
      const response = await api.get(`/analises-quimicas/${analiseId}/pdf`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `analise_${analiseId}.pdf`);

      document.body.appendChild(link);
      link.click();

      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }

      window.URL.revokeObjectURL(url);
      toast.success("Download do PDF iniciado.");
    } catch (error) {
      console.error("Falha ao baixar o PDF:", error);
      toast.error("Falha ao baixar o PDF. Tente novamente.");
    } finally {
      setIsDownloadingPdf(null);
    }
  };

  if (!currentAnalise) {
    // ... loading state
    return null;
  }

  const contentProps = {
    currentAnalise, media, isLoadingMedia, isDownloadingPdf, isWritingOff,
    isEditingDescription, setIsEditingDescription, editedDescription, setEditedDescription, handleSaveDescription, isSavingDescription,
    isEditingDataEntrada, setIsEditingDataEntrada, editedDataEntrada, setEditedDataEntrada, isSavingDataEntrada, setIsSavingDataEntrada, handleSaveDate,
    isEditingDataAnaliseConcluida, setIsEditingDataAnaliseConcluida, editedDataAnaliseConcluida, setEditedDataAnaliseConcluida, isSavingDataAnaliseConcluida, setIsSavingDataAnaliseConcluida,
    isEditingDataAprovacaoCliente, setIsEditingDataAprovacaoCliente, editedDataAprovacaoCliente, setEditedDataAprovacaoCliente, isSavingDataAprovacaoCliente, setIsSavingDataAprovacaoCliente,
    isEditingDataFinalizacaoRecuperacao, setIsEditingDataFinalizacaoRecuperacao, editedDataFinalizacaoRecuperacao, setEditedDataFinalizacaoRecuperacao, isSavingDataFinalizacaoRecuperacao, setIsSavingDataFinalizacaoRecuperacao,
    handleWriteOff, handleDownloadPdf, handleMediaUpdate: fetchMedia
  };

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b bg-muted/50">
            <div className="flex flex-col items-center text-center space-y-2">
              <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                Análise #{currentAnalise.numeroAnalise}
                <ChemicalAnalysisStatusBadge status={currentAnalise.status} showText />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-2 print:hidden"
                  onClick={() => handleDownloadPdf(currentAnalise.id)}
                  disabled={isDownloadingPdf === currentAnalise.id}
                  title="Imprimir PDF"
                >
                  {isDownloadingPdf === currentAnalise.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="h-5 w-5" />
                  )}
                </Button>
              </DialogTitle>
              <DialogDescription>
                Detalhes completos da análise, resultados e valores.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <ModalContent {...contentProps} />
          </div>
          <div className="flex justify-end gap-2 p-4 border-t">
            {/* Footer Buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadPdf(currentAnalise.id)}
              disabled={isDownloadingPdf === currentAnalise.id}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              {isDownloadingPdf === currentAnalise.id ? "Gerando..." : "Imprimir PDF"}
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">Fechar</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>Análise #{currentAnalise.numeroAnalise}</DrawerTitle>
          <DrawerDescription>
            <ChemicalAnalysisStatusBadge status={currentAnalise.status} showText />
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4">
          <ModalContent {...contentProps} />
        </div>
        <DrawerFooter className="pt-2 flex flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1 flex items-center gap-2"
            onClick={() => handleDownloadPdf(currentAnalise.id)}
            disabled={isDownloadingPdf === currentAnalise.id}
          >
            <Printer className="h-4 w-4" />
            {isDownloadingPdf === currentAnalise.id ? "Gerando..." : "PDF"}
          </Button>
          <DrawerClose asChild>
            <Button variant="ghost" className="flex-1">Fechar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
