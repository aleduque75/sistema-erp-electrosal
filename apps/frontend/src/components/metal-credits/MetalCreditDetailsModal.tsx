import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MetalCreditWithUsageDto, MetalAccountEntryDto, SaleUsageDto } from "@/types/metal-credit-with-usage.dto";
import { AnaliseQuimicaWithClientNameDto } from "@/types/analise-quimica-with-client-name.dto";
import api from "@/lib/api";
import { toast } from "sonner";

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

  useEffect(() => {
    if (isOpen && credit?.props.chemicalAnalysisId) {
      setIsLoadingAnalysis(true);
      api.get<AnaliseQuimicaWithClientNameDto>(`/analises-quimicas/${credit.props.chemicalAnalysisId}`)
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
  }, [isOpen, credit?.props.chemicalAnalysisId]);

  if (!credit) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Crédito de Metal</DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre o crédito de metal do cliente e sua origem e uso.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <h4 className="text-lg font-semibold">Informações do Crédito</h4>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium leading-none">Cliente:</p>
            <p className="col-span-3 text-sm">{credit.clientName}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium leading-none">Tipo de Metal:</p>
            <p className="col-span-3 text-sm">{credit.props.metalType}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium leading-none">Grama:</p>
            <p className="col-span-3 text-sm">{formatGrams(Number(credit.props.grams))}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium leading-none">Data do Crédito:</p>
            <p className="col-span-3 text-sm">{formatDate(credit.props.date as unknown as string)}</p>
          </div>

          {isLoadingAnalysis ? (
            <p className="text-center p-4">Carregando detalhes da Análise Química...</p>
          ) : chemicalAnalysisDetails ? (
            <>
              <h4 className="text-lg font-semibold mt-4">Origem (Análise Química)</h4>
              <div className="grid grid-cols-4 items-center gap-4">
                <p className="text-sm font-medium leading-none">Número da Análise:</p>
                <p className="col-span-3 text-sm">{chemicalAnalysisDetails.props.numeroAnalise}</p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <p className="text-sm font-medium leading-none">Material:</p>
                <p className="col-span-3 text-sm">{chemicalAnalysisDetails.props.descricaoMaterial}</p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <p className="text-sm font-medium leading-none">Volume/Peso Entrada:</p>
                <p className="col-span-3 text-sm">{chemicalAnalysisDetails.props.volumeOuPesoEntrada} {chemicalAnalysisDetails.props.unidadeEntrada}</p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <p className="text-sm font-medium leading-none">Status:</p>
                <p className="col-span-3 text-sm">{chemicalAnalysisDetails.props.status}</p>
              </div>
            </>
          ) : (
            <p className="text-center p-4 text-muted-foreground">Nenhum detalhe de Análise Química encontrado.</p>
          )}

          {credit.usageEntries && credit.usageEntries.length > 0 && (
            <>
              <h4 className="text-lg font-semibold mt-4">Uso do Crédito</h4>
              {credit.usageEntries.map((entry, index) => (
                <div key={index} className="border-t pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <p className="text-sm font-medium leading-none">Data do Uso:</p>
                    <p className="col-span-3 text-sm">{formatDate(entry.date.toString())}</p>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <p className="text-sm font-medium leading-none">Descrição:</p>
                    <p className="col-span-3 text-sm">{entry.description}</p>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <p className="text-sm font-medium leading-none">Grama Utilizada:</p>
                    <p className="col-span-3 text-sm">{formatGrams(entry.grams)}</p>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <p className="text-sm font-medium leading-none">Tipo de Uso:</p>
                    <p className="col-span-3 text-sm">{entry.type}</p>
                  </div>

                  {entry.sale && (
                    <div className="pl-4 border-l ml-2 mt-2">
                      <p className="text-sm font-medium leading-none">Venda Relacionada:</p>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <p className="text-sm font-medium leading-none">Número do Pedido:</p>
                        <p className="col-span-3 text-sm">{entry.sale.orderNumber}</p>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <p className="text-sm font-medium leading-none">Data da Venda:</p>
                        <p className="col-span-3 text-sm">{formatDate(entry.sale.saleDate.toString())}</p>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <p className="text-sm font-medium leading-none">Valor Total da Venda (R$):</p>
                        <p className="col-span-3 text-sm">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(entry.sale.totalAmount)}</p>
                      </div>
                    </div>
                  )}

                  {entry.paymentDate && ( // Only show payment details if paymentDate exists
                    <div className="pl-4 border-l ml-2 mt-2">
                      <p className="text-sm font-medium leading-none">Detalhes do Pagamento:</p>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <p className="text-sm font-medium leading-none">Data do Pagamento:</p>
                        <p className="col-span-3 text-sm">{formatDate(entry.paymentDate.toString())}</p>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <p className="text-sm font-medium leading-none">Valor Pago (R$):</p>
                        <p className="col-span-3 text-sm">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(entry.paymentValueBRL || 0)}</p>
                      </div>
                      {entry.paymentQuotation && ( // Conditionally show quotation
                        <div className="grid grid-cols-4 items-center gap-4">
                          <p className="text-sm font-medium leading-none">Cotação do Pagamento (R$/g):</p>
                          <p className="col-span-3 text-sm">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(entry.paymentQuotation)}</p>
                        </div>
                      )}
                      {entry.paymentSourceAccountName && ( // Conditionally show source account
                        <div className="grid grid-cols-4 items-center gap-4">
                          <p className="text-sm font-medium leading-none">Conta de Origem:</p>
                          <p className="col-span-3 text-sm">{entry.paymentSourceAccountName}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-4 items-center gap-4">
                        <p className="text-sm font-medium leading-none">Status do Pagamento:</p>
                        <p className="col-span-3 text-sm">{entry.isPaid ? "Pago" : "Pendente"}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
