"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ColumnDef } from "@tanstack/react-table";
import { format, parse, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTableWithSelection } from "@/components/ui/data-table-with-selection";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Interfaces
interface CreditCard {
  id: string;
  name: string;
}
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
}

// Schema do formulário
const formSchema = z.object({
  name: z.string().min(3, "O nome da fatura é obrigatório."),
  endDate: z.date({
    required_error: "A data de fechamento é obrigatória.",
  }),
  dueDate: z.date({ required_error: "A data de vencimento é obrigatória." }),
});
type FormValues = z.infer<typeof formSchema>;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });

export default function GenerateBillPage() {
  const router = useRouter();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingTransactions, setIsFetchingTransactions] = useState(false);

  const [startDate, setStartDate] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    // ✅ CORREÇÃO PRINCIPAL: Definindo valores padrão para as datas
    defaultValues: {
      name: "",
      endDate: new Date(),
      dueDate: new Date(),
    },
  });
  const { control, handleSubmit, setValue } = form;

  useEffect(() => {
    api.get("/credit-cards").then((res) => setCards(res.data));
  }, []);

  useEffect(() => {
    if (selectedCardId) {
      setIsFetchingTransactions(true);
      api
        .get("/credit-card-transactions", {
          params: {
            creditCardId: selectedCardId,
            status: "unbilled",
            startDate,
            endDate,
          },
        })
        .then((res) => {
          setTransactions(
            res.data.map((t: any) => ({ ...t, amount: parseFloat(t.amount) }))
          );
        })
        .finally(() => setIsFetchingTransactions(false));
    } else {
      setTransactions([]);
    }
  }, [selectedCardId, startDate, endDate]);

  const onGenerateBill = async (formData: FormValues) => {
    // ✅ CORREÇÃO: Mapeia os índices selecionados para os IDs (UUIDs) corretos
    const selectedIndices = Object.keys(rowSelection).map(Number);
    const transactionIds = selectedIndices.map(index => transactions[index].id);

    if (transactionIds.length === 0) {
      toast.error('Selecione pelo menos uma transação para incluir na fatura.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.post('/credit-card-bills/from-transactions', {
        name: formData.name,
        dueDate: formData.dueDate,
        endDate: formData.endDate,
        creditCardId: selectedCardId,
        transactionIds, // Agora envia o array de UUIDs correto
        startDate: new Date(startDate),
      });
      toast.success('Fatura gerada com sucesso!');
      router.push('/credit-card-bills');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Falha ao gerar a fatura.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSelecionado = useMemo(() => {
    const selectedRowIndices = Object.keys(rowSelection).map(Number);
    return selectedRowIndices.reduce((sum, index) => {
      const transaction = transactions[index];
      return transaction ? sum + transaction.amount : sum;
    }, 0);
  }, [rowSelection, transactions]);

  const columns: ColumnDef<Transaction>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Selecionar todos"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecionar linha"
        />
      ),
    },
    {
      accessorKey: "date",
      header: "Data",
      cell: ({ row }) => formatDate(row.getValue("date")),
    },
    { accessorKey: "description", header: "Descrição" },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Valor</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {formatCurrency(row.getValue("amount"))}
        </div>
      ),
    },
  ];

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onGenerateBill)}>
        <Card className="my-8">
          <CardHeader>
            <CardTitle>Gerar Nova Fatura de Cartão</CardTitle>
            <CardDescription>
              Selecione um cartão e um período para ver as transações em aberto
              e gerar a fatura.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>1. Selecione o Cartão</Label>
                <Combobox
                  options={cards.map((c) => ({ value: c.id, label: c.name }))}
                  value={selectedCardId}
                  onValueChange={setSelectedCardId}
                  placeholder="Escolha um cartão..."
                />
              </div>
              <div className="space-y-2">
                <Label>Período - De</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={!selectedCardId}
                />
              </div>
              <div className="space-y-2">
                <Label>Período - Até</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={!selectedCardId}
                />
              </div>
            </div>

            {selectedCardId && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>2. Nome da Fatura</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={`Fatura ${cards.find((c) => c.id === selectedCardId)?.name}`}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Fechamento</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "PPP", { locale: ptBR })
                                ) : (
                                  <span>Escolha uma data</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Vencimento</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "PPP", { locale: ptBR })
                                ) : (
                                  <span>Escolha uma data</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>3. Selecione as Transações para Incluir</Label>
                  {isFetchingTransactions ? (
                    <p className="text-center p-10">Buscando transações...</p>
                  ) : (
                    <>
                      <DataTableWithSelection
                        columns={columns}
                        data={transactions}
                        rowSelection={rowSelection}
                        onRowSelectionChange={setRowSelection}
                      />
                      <div className="text-right font-bold mt-2">
                        Total Selecionado: {formatCurrency(totalSelecionado)}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={!selectedCardId || isSubmitting}>
              {isSubmitting ? "Gerando..." : "Gerar Fatura"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
