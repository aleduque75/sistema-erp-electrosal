import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MetalCreditWithUsageDto, MetalAccountEntryDto, SaleUsageDto } from "@/types/metal-credit-with-usage.dto";
import { AnaliseQuimicaWithClientNameDto } from "@/types/analise-quimica-with-client-name.dto";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Printer, User, Calendar, Scale, Coins, History, Info, MapPin, FileText } from "lucide-react";
import { Badge } from "../ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface MetalCreditDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credit: MetalCreditWithUsageDto | null;
}

const formatGrams = (value?: number) => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value || 0) + " g";
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("pt-BR", { timeZone: 'UTC' });
};

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );

export function MetalCreditDetailsModal({ isOpen, onClose, credit }: MetalCreditDetailsModalProps) {
  const [chemicalAnalysisDetails, setChemicalAnalysisDetails] = useState<AnaliseQuimicaWithClientNameDto | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (isOpen && credit?.chemicalAnalysisId) {
      setIsLoadingAnalysis(true);
      api.get<AnaliseQuimicaWithClientNameDto>(`/analises-quimicas/${credit.chemicalAnalysisId}`)
        .then(response => {
          setChemicalAnalysisDetails(response.data);
        })
        .catch(error => {
          toast.error("Falha ao carregar detalhes da Análise Química.");
          console.error("Error fetching chemical analysis details:", error);
        })
        .finally(() => {
          setIsLoadingAnalysis(false);
        });
    } else if (!isOpen) {
      setChemicalAnalysisDetails(null);
    }
  }, [isOpen, credit?.chemicalAnalysisId]);

  const handlePrintPdf = async () => {
    if (!credit) return;
    setIsPrinting(true);
    try {
      const response = await api.get(`/metal-credits/${credit.id}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `extrato-credito-${credit.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Falha ao gerar o PDF.");
    } finally {
      setIsPrinting(false);
    }
  };

  const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    PENDING: { label: 'Disponível', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
    PARTIALLY_PAID: { label: 'Parcialmente Usado', color: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
    PAID: { label: 'Esgotado / Pago', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
    CANCELED: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500' },
  };

  const originalGrams = useMemo(() => {
    if (!credit) return 0;
    return Number(credit.grams) + (credit.usageEntries?.reduce((acc, curr) => acc + Math.abs(curr.grams), 0) || 0);
  }, [credit]);

  if (!credit) return null;

  const statusInfo = statusConfig[credit.status] || { label: credit.status, color: "bg-gray-100", dot: "bg-gray-400" };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl">Detalhes do Crédito de Metal</DialogTitle>
              <DialogDescription>
                Histórico completo de origem e utilização do saldo de metal.
              </DialogDescription>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusInfo.color} border`}>
              <div className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
              {statusInfo.label}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Top Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-4 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3" /> Cliente
                </p>
                <p className="text-sm font-semibold truncate">{credit.clientName}</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-4 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Scale className="w-3 h-3" /> Metal / Data
                </p>
                <p className="text-sm font-semibold">{credit.metalType} • {formatDate(credit.date as unknown as string)}</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/10 border-primary/20 ring-1 ring-primary/5">
              <CardContent className="p-4 space-y-1 text-center md:text-left">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Saldo Atual Disponível</p>
                <p className="text-2xl font-black text-primary">{formatGrams(Number(credit.grams))}</p>
              </CardContent>
            </Card>
          </div>

          {/* Details & Origin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações Gerais */}
            <Card>
              <CardHeader className="pb-3 px-4 pt-4">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <Info className="w-3.5 h-3.5" /> Informações do Lote
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Peso Original:</span>
                  <span className="font-medium">{formatGrams(originalGrams)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">Já Utilizado:</span>
                  <span className="font-medium text-red-500">-{formatGrams(originalGrams - Number(credit.grams))}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2 font-bold">
                  <span className="text-primary">Saldo Final:</span>
                  <span className="text-primary">{formatGrams(Number(credit.grams))}</span>
                </div>
              </CardContent>
            </Card>

            {/* Origem */}
            <Card>
              <CardHeader className="pb-3 px-4 pt-4">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Origem do Recurso
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {isLoadingAnalysis ? (
                  <p className="text-xs text-center py-4">Carregando origem...</p>
                ) : chemicalAnalysisDetails ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Análise:</span>
                      <span className="font-medium">#{chemicalAnalysisDetails.numeroAnalise}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Material:</span>
                      <p className="text-sm font-medium leading-tight">{chemicalAnalysisDetails.descricaoMaterial}</p>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-muted-foreground">Entrada:</span>
                      <span>{formatDate(chemicalAnalysisDetails.dataEntrada.toString())}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <FileText className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground italic">Lançamento direto / Adiantamento de metal</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Movimentações */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2 px-1">
              <History className="w-3.5 h-3.5" /> Histórico de Utilização
            </h4>
            
            {credit.usageEntries && credit.usageEntries.length > 0 ? (
              <div className="space-y-3">
                {credit.usageEntries.map((entry, index) => (
                  <Card key={index} className="border-l-4 border-l-red-400 bg-red-50/30 dark:bg-red-950/10">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-sm font-bold flex items-center gap-2">
                            {entry.description}
                            <Badge variant="outline" className="text-[9px] uppercase h-4 px-1">{entry.type}</Badge>
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(entry.date.toString())}</span>
                            {entry.sale && <span className="flex items-center gap-1 font-semibold text-primary"><FileText className="w-3 h-3" /> Pedido #{entry.sale.orderNumber}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold text-red-600">-{formatGrams(Math.abs(entry.grams))}</p>
                        </div>
                      </div>

                      {(entry.paymentDate || entry.sale) && (
                        <div className="mt-3 pt-3 border-t border-red-100 dark:border-red-900/30 grid grid-cols-2 gap-4 text-xs">
                          {entry.sale && (
                            <div className="flex flex-col">
                              <span className="text-muted-foreground uppercase text-[9px] font-bold">Valor da Venda</span>
                              <span>{formatCurrency(entry.sale.totalAmount)}</span>
                            </div>
                          )}
                          {entry.paymentDate && (
                            <div className="flex flex-col text-right">
                              <span className="text-muted-foreground uppercase text-[9px] font-bold">Valor do Abatimento</span>
                              <span className="font-bold text-emerald-600">{formatCurrency(entry.paymentValueBRL || 0)}</span>
                            </div>
                          )}
                          {entry.paymentQuotation && (
                            <div className="flex flex-col col-span-2 mt-1 border-t border-dashed border-red-100 dark:border-red-900/30 pt-1">
                              <span className="text-muted-foreground uppercase text-[9px] font-bold">Cotação do Pagamento</span>
                              <p className="flex justify-between">
                                <span>{formatCurrency(entry.paymentQuotation)} / g</span>
                                {entry.isPaid && <Badge className="bg-emerald-500 hover:bg-emerald-600 h-4 text-[9px]">PAGO</Badge>}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/20 rounded-lg border-2 border-dashed">
                <Coins className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground italic">Nenhum uso registrado para este crédito ainda.</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 bg-muted/30 border-t flex-row items-center justify-between sm:justify-between">
          <Button variant="outline" size="sm" onClick={handlePrintPdf} disabled={isPrinting}>
            <Printer className="mr-2 h-4 w-4" />
            {isPrinting ? "Gerando..." : "Imprimir Extrato PDF"}
          </Button>
          <Button size="sm" onClick={onClose}>Fechar Detalhes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
