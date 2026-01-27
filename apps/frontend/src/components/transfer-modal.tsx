"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface Account {
  id: string;
  nome: string;
  numeroConta: string;
}

interface ContaContabil {
  id: string;
  nome: string;
}

export function TransferModal({ isOpen, onClose, onSave }: TransferModalProps) {
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const [amount, setAmount] = useState<number | string>("");
  const [goldAmount, setGoldAmount] = useState<number | string>("");
  const [description, setDescription] = useState("");
  const [contaContabilId, setContaContabilId] = useState("");
  const [dataHora, setDataHora] = useState(new Date());

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contasContabeis, setContasContabeis] = useState<ContaContabil[]>([]);
  const [loading, setIsPageLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchInitialData = async () => {
        try {
          const [accountsRes, contasContabeisRes] = await Promise.all([
            api.get("/contas-correntes"),
            api.get("/contas-contabeis"),
          ]);
          setAccounts(accountsRes.data);
          setContasContabeis(contasContabeisRes.data);

          const transferenciaInternaAccount = contasContabeisRes.data.find(
            (cc: ContaContabil) => cc.nome === 'Transferências Internas'
          );
          if (transferenciaInternaAccount) {
            setContaContabilId(transferenciaInternaAccount.id);
          }
        } catch (err) {
          toast.error("Falha ao carregar dados para a transferência.");
          onClose();
        }
      };
      fetchInitialData();
    }
  }, [isOpen, onClose]);

  const handleConversion = async (fieldToConvert: 'amount' | 'goldAmount') => {
    if (!dataHora) return;

    try {
      const response = await api.get(`/quotations/by-date?date=${dataHora.toISOString().split('T')[0]}&metal=AU`);
      const quotation = response.data;

      if (quotation) {
        if (fieldToConvert === 'amount' && amount) {
          const newGoldAmount = parseFloat(amount as string) / quotation.buyPrice;
          setGoldAmount(newGoldAmount.toFixed(4));
        } else if (fieldToConvert === 'goldAmount' && goldAmount) {
          const newAmount = parseFloat(goldAmount as string) * quotation.buyPrice;
          setAmount(newAmount.toFixed(2));
        }
      }
    } catch (error) {
      console.error('Failed to fetch quotation', error);
      toast.error('Cotação não encontrada para a data selecionada.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPageLoading(true);
    try {
      await api.post("/transacoes/transfer", {
        sourceAccountId,
        destinationAccountId,
        amount: parseFloat(amount as string),
        goldAmount: goldAmount ? parseFloat(goldAmount as string) : undefined,
        description,
        contaContabilId,
        dataHora,
      });
      toast.success("Transferência realizada com sucesso!");
      onSave();
      onClose();
      // Reset form
      setSourceAccountId("");
      setDestinationAccountId("");
      setAmount("");
      setGoldAmount("");
      setDescription("");
      setContaContabilId("");
      setDataHora(new Date());
    } catch (err) {
      toast.error("Falha ao realizar transferência.");
    } finally {
      setIsPageLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Transferência</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dataHora" className="text-right">
              Data
            </Label>
            <Input
              id="dataHora"
              type="date"
              value={dataHora.toISOString().split('T')[0]}
              onChange={(e) => setDataHora(new Date(e.target.value))}
              className="col-span-3"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sourceAccount" className="text-right">
              Conta Origem
            </Label>
            <Select onValueChange={setSourceAccountId} value={sourceAccountId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a conta de origem" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.nome} ({account.numeroConta})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="destinationAccount" className="text-right">
              Conta Destino
            </Label>
            <Select onValueChange={setDestinationAccountId} value={destinationAccountId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a conta de destino" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.nome} ({account.numeroConta})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Valor (R$)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={() => handleConversion('amount')}
              className="col-span-3"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="goldAmount" className="text-right">
              Valor (Au g)
            </Label>
            <Input
              id="goldAmount"
              type="number"
              step="0.0001"
              value={goldAmount}
              onChange={(e) => setGoldAmount(e.target.value)}
              onBlur={() => handleConversion('goldAmount')}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descrição
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contaContabil" className="text-right">
              Conta Contábil
            </Label>
            <Select onValueChange={setContaContabilId} value={contaContabilId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a conta contábil" />
              </SelectTrigger>
              <SelectContent>
                {contasContabeis.map((cc) => (
                  <SelectItem key={cc.id} value={cc.id}>
                    {cc.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Realizar Transferência
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}