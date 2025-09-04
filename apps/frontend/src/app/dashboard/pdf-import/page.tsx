"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ContaContabilCombobox } from "@/components/shared/ContaContabilCombobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Interfaces
interface ParsedTransaction {
  date: string;
  description: string;
  value: number;
  installment?: string;
  organizationId: string;
  contaContabilId?: string;
  creditCardId?: string;
  isDuplicate?: boolean;
  isSelected?: boolean;
}
interface ContaContabil {
  id: string;
  codigo: string;
  nome: string;
}
interface CreditCard {
  id: string;
  name: string;
  flag: string;
}

export default function PdfImportPage() {
  const [plainText, setPlainText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTransaction[] | null>(
    null
  );
  const [editableData, setEditableData] = useState<ParsedTransaction[] | null>(
    null
  );
  const [contasContabeis, setContasContabeis] = useState<ContaContabil[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [selectedCreditCardId, setSelectedCreditCardId] = useState<string>("");
  const [loadingContas, setLoadingContas] = useState(true);
  const [loadingCreditCards, setLoadingCreditCards] = useState(true);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const router = useRouter();

  const fetchContasContabeis = async () => {
    setLoadingContas(true);
    try {
      const response = await api.get<ContaContabil[]>("/contas-contabeis");
      setContasContabeis(response.data);
    } catch (error) {
      toast.error("Falha ao carregar contas contábeis.");
    } finally {
      setLoadingContas(false);
    }
  };

  useEffect(() => {
    fetchContasContabeis();

    async function fetchCreditCards() {
      setLoadingCreditCards(true);
      try {
        const response = await api.get<CreditCard[]>("/credit-cards");
        setCreditCards(response.data);
        if (response.data.length > 0) {
          setSelectedCreditCardId(response.data[0].id);
        }
      } catch (error) {
        toast.error("Falha ao carregar cartões de crédito.");
      } finally {
        setLoadingCreditCards(false);
      }
    }
    fetchCreditCards();
  }, []);

  useEffect(() => {
    if (parsedData) {
      const dataWithCardId = parsedData.map((tx) => ({
        ...tx,
        creditCardId: selectedCreditCardId,
        isSelected: !tx.isDuplicate,
      }));
      setEditableData(dataWithCardId);
    }
  }, [parsedData, selectedCreditCardId]);

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) =>
    setPlainText(event.target.value);
  const handleEditChange = (
    index: number,
    field: keyof ParsedTransaction,
    value: any
  ) => {
    if (editableData) {
      const newData = [...editableData];
      (newData[index] as any)[field] = value;
      setEditableData(newData);
    }
  };
  const handleCheckboxChange = (index: number, checked: boolean) => {
    if (editableData) {
      const newData = [...editableData];
      newData[index].isSelected = checked;
      setEditableData(newData);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!plainText.trim() || !selectedCreditCardId) {
      toast.error("Por favor, cole o texto da fatura e selecione um cartão.");
      return;
    }
    setIsLoading(true);
    setParsedData(null);
    setEditableData(null);
    try {
      const response = await api.post("/pdf-import/statement", {
        text: plainText,
      });
      const parsedTransactions = response.data.data.map((tx) => ({
        ...tx,
        creditCardId: selectedCreditCardId,
      }));

      setCheckingDuplicates(true);
      const checkResponse = await api.post("/pdf-import/check-duplicates", {
        transactions: parsedTransactions,
      });

      setParsedData(checkResponse.data.data);
      toast.success("Fatura processada e duplicatas verificadas!");
    } catch (error: any) {
      toast.error(
        `Falha ao processar fatura: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setIsLoading(false);
      setCheckingDuplicates(false);
    }
  };

  const handleImportTransactions = async () => {
    if (!editableData) return;

    const transactionsToImport = editableData.filter(
      (tx) => tx.isSelected && !tx.isDuplicate
    );

    if (transactionsToImport.length === 0) {
      return toast.error("Nenhum lançamento novo selecionado para importar.");
    }

    const unclassified = transactionsToImport.find((tx) => !tx.contaContabilId);
    if (unclassified) {
      return toast.error(
        `A transação "${unclassified.description}" precisa de uma categoria.`
      );
    }

    setIsLoading(true);

    // 👇 CORREÇÃO APLICADA AQUI: Cria um payload "limpo" para a API 👇
    const payload = {
      transactions: transactionsToImport.map((tx) => ({
        date: tx.date,
        description: tx.description,
        value: tx.value,
        installment: tx.installment,
        contaContabilId: tx.contaContabilId,
        creditCardId: tx.creditCardId,
      })),
    };

    try {
      const response = await api.post(
        "/pdf-import/import-transactions",
        payload
      );
      toast.success(
        `${response.data.count} lançamentos importados com sucesso!`
      );
      // Limpa a tela para uma nova importação
      setPlainText("");
      setParsedData(null);
      setEditableData(null);
    } catch (error: any) {
      toast.error(
        `Falha ao importar lançamentos: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleContaCreated = (newConta: ContaContabil) => {
    toast.success(`Conta '${newConta.nome}' criada e adicionada à lista.`);
    fetchContasContabeis();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Importar Fatura de Cartão (Texto)</CardTitle>
        <CardDescription>
          Cole o texto extraído de um PDF de fatura de cartão de crédito para
          extrair os lançamentos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="plainText">Texto da Fatura</Label>
            <Textarea
              id="plainText"
              value={plainText}
              onChange={handleTextChange}
              placeholder="Cole o texto completo..."
              rows={10}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="creditCard">
              Importar para qual Cartão de Crédito?
            </Label>
            <Select
              value={selectedCreditCardId}
              onValueChange={setSelectedCreditCardId}
              disabled={isLoading || loadingCreditCards}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {creditCards.map((card) => (
                  <SelectItem
                    key={card.id}
                    value={card.id}
                  >{`${card.name} (${card.flag})`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isLoading || checkingDuplicates}>
            {isLoading || checkingDuplicates ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...
              </>
            ) : (
              "Processar Texto"
            )}
          </Button>
        </form>

        {editableData && editableData.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">
              Lançamentos Extraídos:
            </h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={editableData.every(
                          (tx) => tx.isSelected || tx.isDuplicate
                        )}
                        onCheckedChange={(checked) => {
                          setEditableData(
                            editableData.map((tx) => ({
                              ...tx,
                              isSelected: tx.isDuplicate ? false : !!checked,
                            }))
                          );
                        }}
                      />
                    </TableHead>
                    <TableHead className="w-[120px]">Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-[120px] text-right">
                      Valor
                    </TableHead>
                    <TableHead className="w-[100px]">Parcela</TableHead>
                    <TableHead className="w-[250px]">Conta Contábil</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editableData.map((transaction, index) => (
                    <TableRow
                      key={index}
                      className={
                        transaction.isDuplicate
                          ? "bg-muted/50 text-muted-foreground"
                          : ""
                      }
                    >
                      <TableCell>
                        <Checkbox
                          checked={transaction.isSelected}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(index, !!checked)
                          }
                          disabled={transaction.isDuplicate}
                        />
                      </TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>
                        <Input
                          value={transaction.description}
                          onChange={(e) =>
                            handleEditChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          disabled={transaction.isDuplicate}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={transaction.value}
                          onChange={(e) =>
                            handleEditChange(
                              index,
                              "value",
                              parseFloat(e.target.value)
                            )
                          }
                          disabled={transaction.isDuplicate}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={transaction.installment || ""}
                          onChange={(e) =>
                            handleEditChange(
                              index,
                              "installment",
                              e.target.value
                            )
                          }
                          disabled={transaction.isDuplicate}
                        />
                      </TableCell>
                      <TableCell>
                        <ContaContabilCombobox
                          selectedContaId={transaction.contaContabilId}
                          onSelectConta={(value) =>
                            handleEditChange(index, "contaContabilId", value)
                          }
                          onContaCreated={handleContaCreated}
                          contasContabeis={contasContabeis}
                          loadingContas={loadingContas}
                          disabled={transaction.isDuplicate}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleImportTransactions}
                disabled={
                  isLoading ||
                  editableData.filter((tx) => tx.isSelected).length === 0
                }
              >
                Importar ({editableData.filter((tx) => tx.isSelected).length})
                Lançamentos
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
