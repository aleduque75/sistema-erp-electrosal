import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ImageGallery } from "@/components/shared/ImageGallery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// Funções de formatação (copiadas de extrato/page.tsx)
const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );

const formatGold = (value?: number | null) => {
  if (value == null) return "-";
  return `${value.toFixed(4).replace(".", ",")} g`;
};

const formatDateTime = (dateString?: string | null) =>
  dateString
    ? new Date(dateString).toLocaleString("pt-BR", { timeZone: "UTC" })
    : "N/A";

interface TransacaoExtrato {
  id: string;
  dataHora: string;
  descricao: string;
  valor: number;
  goldAmount?: number;
  tipo: "CREDITO" | "DEBITO";
  contaContabilId: string;
  contaContabilNome: string;
  sale?: {
    id: string;
    orderNumber: number;
  };
  medias?: { id: string; path: string }[];
  contrapartida?: { // Adicionar contrapartida
    contaCorrente: {
      nome: string;
    };
  };
  goldPrice?: number; // Adicionar goldPrice
}

interface TransactionDetailsModalProps {
  transaction: TransacaoExtrato | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDetailsModal({ transaction, isOpen, onClose }: TransactionDetailsModalProps) {
  if (!transaction) {
    return null;
  }

  console.log('TransactionDetailsModal - transaction:', transaction); // Adicionar console.log
  const isTransfer = transaction.contaContabilNome?.trim().toLowerCase() === 'transferencias entre contas';
  console.log('TransactionDetailsModal - isTransfer:', isTransfer); // Adicionar console.log

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalhes da Transação</DialogTitle>
          <DialogDescription>
            {isTransfer ? "Detalhes da transferência" : "Detalhes do lançamento"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data</Label>
              <p className="font-medium">{formatDateTime(transaction.dataHora)}</p>
            </div>
            <div>
              <Label>Descrição</Label>
              <p className="font-medium">{transaction.descricao}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor (R$)</Label>
              <p className="font-medium">{formatCurrency(transaction.valor)}</p>
            </div>
            {transaction.goldAmount && (
              <div>
                <Label>Valor (Au g)</Label>
                <p className="font-medium">{formatGold(transaction.goldAmount)}</p>
              </div>
            )}
            {transaction.goldPrice && (
              <div>
                <Label>Cotação</Label>
                <p className="font-medium">{formatCurrency(transaction.goldPrice)}</p>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <Label>Conta Contábil</Label>
            <p className="font-medium">{transaction.contaContabilNome}</p>
          </div>

          {isTransfer && transaction.contrapartida && (
            <>
              <Separator />
              <div>
                <Label>{transaction.tipo === 'DEBITO' ? 'Para a conta' : 'Da conta'}</Label>
                <p className="font-medium">{transaction.contrapartida.contaCorrente.nome}</p>
              </div>
            </>
          )}

          {transaction.medias && transaction.medias.length > 0 && (
            <>
              <Separator />
              <div>
                <Label>Imagens</Label>
                <div className="mt-2">
                  <ImageGallery media={transaction.medias} onDeleteSuccess={() => {}} />
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
