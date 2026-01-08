import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MetalCreditWithUsageDto, MetalAccountEntryDto, SaleUsageDto } from "@/types/metal-credit-with-usage.dto";
import { AnaliseQuimicaWithClientNameDto } from "@/types/analise-quimica-with-client-name.dto";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Printer } from "lucide-react";
import { Badge } from "../ui/badge";

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

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("pt-BR");
};

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
      // Reset details when modal closes
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

  if (!credit) {
    return null;
  }

  const statusMap: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
    PARTIALLY_PAID: { label: "Pago Parcialmente", color: "bg-blue-100 text-blue-800" },
    PAID: { label: "Pago", color: "bg-green-100 text-green-800" },
    CANCELED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
  };

  const statusInfo = statusMap[credit.status] || { label: credit.status, color: "bg-gray-100 text-gray-800" };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Crédito de Metal</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre o crédito de metal do cliente e sua origem e uso.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <section>
              <h4 className="text-lg font-semibold border-b pb-2 mb-4">Informações do Crédito</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Cliente</p>
                  <p className="text-sm">{credit.clientName}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                  <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Tipo de Metal</p>
                  <p className="text-sm font-bold">{credit.metalType}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Data do Crédito</p>
                  <p className="text-sm">{formatDate(credit.date as unknown as string)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Grama Original</p>
                  <p className="text-sm">{formatGrams(Number(credit.grams) + (credit.usageEntries?.reduce((acc, curr) => acc + Math.abs(curr.grams), 0) || 0))}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Saldo Restante</p>
                  <p className="text-sm font-bold text-primary">{formatGrams(Number(credit.grams))}</p>
                </div>
              </div>
            </section>

            {isLoadingAnalysis ? (
              <p className="text-center p-4">Carregando detalhes da Análise Química...</p>
            ) : chemicalAnalysisDetails && (
              <section>
                <h4 className="text-lg font-semibold border-b pb-2 mb-4">Origem (Análise Química)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Número da Análise</p>
                    <p className="text-sm">{chemicalAnalysisDetails.numeroAnalise}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Data Entrada</p>
                    <p className="text-sm">{formatDate(chemicalAnalysisDetails.dataEntrada.toString())}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Material</p>
                    <p className="text-sm">{chemicalAnalysisDetails.descricaoMaterial}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Peso Entrada</p>
                    <p className="text-sm">{chemicalAnalysisDetails.volumeOuPesoEntrada} {chemicalAnalysisDetails.unidadeEntrada}</p>
                  </div>
                </div>
              </section>
            )}

            <section>
              <h4 className="text-lg font-semibold border-b pb-2 mb-4">Histórico de Movimentações (Uso do Crédito)</h4>
              {credit.usageEntries && credit.usageEntries.length > 0 ? (
                <div className="space-y-4">
                  {credit.usageEntries.map((entry, index) => (
                    <div key={index} className="bg-muted/30 p-4 rounded-lg border border-muted">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-bold">{entry.description}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(entry.date.toString())}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600">-{formatGrams(Math.abs(entry.grams))}</p>
                          <Badge variant="outline" className="text-[10px] py-0">{entry.type}</Badge>
                        </div>
                      </div>

                      {entry.sale && (
                        <div className="mt-2 pt-2 border-t border-muted-foreground/10 text-xs grid grid-cols-2 gap-1">
                          <p><span className="font-medium">Venda:</span> #{entry.sale.orderNumber}</p>
                          <p className="text-right"><span className="font-medium">Valor:</span> {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(entry.sale.totalAmount)}</p>
                        </div>
                      )}

                      {entry.paymentDate && (
                        <div className="mt-2 pt-2 border-t border-muted-foreground/10 text-xs grid grid-cols-2 gap-1">
                          <p><span className="font-medium">Pago em:</span> {formatDate(entry.paymentDate.toString())}</p>
                          <p className="text-right"><span className="font-medium">Valor BRL:</span> {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(entry.paymentValueBRL || 0)}</p>
                          {entry.paymentQuotation && (
                            <p className="col-span-2"><span className="font-medium">Cotação:</span> {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(entry.paymentQuotation)}/g</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded">Nenhuma movimentação de saída registrada para este cliente neste metal.</p>
              )}
            </section>
          </div>
          <DialogFooter className="flex justify-between items-center sm:justify-between">
            <Button variant="outline" onClick={handlePrintPdf} disabled={isPrinting}>
              <Printer className="mr-2 h-4 w-4" />
              {isPrinting ? "Gerando..." : "Imprimir Extrato (PDF)"}
            </Button>
            <Button onClick={onClose}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
