import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Sale } from '../page';
import { TipoMetal } from '@/types/tipo-metal';

interface ConfirmSaleModalProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ContaCorrente {
  id: string;
  nome: string;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
const formatGrams = (value: number | null | undefined) => `${(Number(value) || 0).toFixed(4)}g`;

export function ConfirmSaleModal({
  sale,
  open,
  onOpenChange,
  onSuccess,
}: ConfirmSaleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<ContaCorrente[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined);
  const [selectedMetalType, setSelectedMetalType] = useState<TipoMetal | undefined>(undefined);
  const [keepSaleStatusPending, setKeepSaleStatusPending] = useState(false);

  useEffect(() => {
    if (open && sale?.paymentMethod === 'A_VISTA') {
      api.get('/contas-correntes?type=BANCO').then(response => {
        setAccounts(response.data);
      }).catch(() => {
        toast.error('Falha ao buscar contas correntes.');
      });
    }
    if (!open) {
      setSelectedAccountId(undefined);
      setSelectedMetalType(undefined);
      setKeepSaleStatusPending(false);
    }
  }, [open, sale]);

  const handleConfirm = async () => {
    if (!sale) return;

    setIsSubmitting(true);
    try {
      const payload: { 
        paymentMethod: string; 
        contaCorrenteId?: string; 
        paymentMetalType?: TipoMetal;
        keepSaleStatusPending?: boolean;
      } = {
        paymentMethod: sale.paymentMethod,
      };

      if (sale.paymentMethod === 'A_VISTA') {
        if (!selectedAccountId) {
          toast.error('Por favor, selecione uma conta de destino.');
          setIsSubmitting(false);
          return;
        }
        payload.contaCorrenteId = selectedAccountId;
      } else if (sale.paymentMethod === 'METAL') {
        if (!selectedMetalType) {
          toast.error('Por favor, selecione o tipo de metal para pagamento.');
          setIsSubmitting(false);
          return;
        }
        payload.paymentMetalType = selectedMetalType;
        payload.keepSaleStatusPending = keepSaleStatusPending;
      }

      await api.post(`/sales/${sale.id}/confirm`, payload);
      toast.success('Venda confirmada com sucesso!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Falha ao confirmar venda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sale) return null;

  const pesoOuroItens = sale.saleItems?.reduce((acc, item) => {
    const productGoldValue = item.product?.goldValue || 0;
    return acc + (item.quantity * productGoldValue);
  }, 0) || 0;

  const isVista = sale.paymentMethod === 'A_VISTA';
  const isMetal = sale.paymentMethod === 'METAL';
  const isConfirmButtonDisabled = 
    isSubmitting || 
    (isVista && !selectedAccountId) ||
    (isMetal && !selectedMetalType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirmar Venda #{sale.orderNumber}</DialogTitle>
          <DialogDescription>
            Você confirma os detalhes desta venda? Esta ação irá gerar os lançamentos financeiros.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2 rounded-lg border p-4">
              <p><span className="font-semibold">Cliente:</span> {sale.pessoa.name}</p>
              <p><span className="font-semibold">Método de Pagamento:</span> {sale.paymentMethod?.replace('_', ' ') || 'N/A'}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-lg border p-4">
            <h4 className="col-span-2 text-lg font-semibold text-center">Resumo do Pedido</h4>
            
            <div className="text-sm">
              <p className="font-semibold">Peso Ouro (Itens):</p>
              <p className="font-mono">{formatGrams(pesoOuroItens)}</p>
            </div>
            
            <div className="text-sm">
              <p className="font-semibold">Custo M.O. (g):</p>
              <p className="font-mono">{formatGrams(sale.adjustment?.costsInGrams)}</p>
            </div>

            <div className="text-sm font-bold">
              <p>Total Ouro (g):</p>
              <p className="font-mono">{formatGrams(sale.adjustment?.saleExpectedGrams)}</p>
            </div>

            <div className="text-sm text-green-600">
              <p className="font-semibold">Lucro (g):</p>
              <p className="font-mono font-bold">{formatGrams(sale.adjustment?.netDiscrepancyGrams)}</p>
            </div>

            <div className="text-sm">
              <p className="font-semibold">Cotação do Dia:</p>
              <p>{formatCurrency(sale.goldPrice || 0)}</p>
            </div>

            <div className="text-sm font-bold">
              <p>Valor Final (BRL):</p>
              <p>{formatCurrency(sale.netAmount)}</p>
            </div>
          </div>

          {isVista && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="conta-destino">Conta de Destino</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger id="conta-destino">
                  <SelectValue placeholder="Selecione a conta para recebimento..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isMetal && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="metal-type">Tipo de Metal do Pagamento</Label>
              <Select value={selectedMetalType} onValueChange={(value) => setSelectedMetalType(value as TipoMetal)}>
                <SelectTrigger id="metal-type">
                  <SelectValue placeholder="Selecione o metal..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TipoMetal.AU}>Ouro (AU)</SelectItem>
                  <SelectItem value={TipoMetal.AG}>Prata (AG)</SelectItem>
                  <SelectItem value={TipoMetal.RH}>Ródio (RH)</SelectItem>
                </SelectContent>
              </Select>

              {/* NOVO CHECKBOX */}
              <div className="flex items-center space-x-2 pt-4">
                <Checkbox
                  id="keepSaleStatusPending"
                  checked={keepSaleStatusPending}
                  onCheckedChange={(checked) => setKeepSaleStatusPending(checked as boolean)}
                />
                <Label htmlFor="keepSaleStatusPending">Manter venda como 'A Separar' (pagamento em metal recebido, produto pendente)</Label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={isConfirmButtonDisabled}>
            {isSubmitting ? 'Confirmando...' : 'Confirmar Venda'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
