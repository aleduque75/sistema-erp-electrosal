import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api";
import { useEffect, useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { ImageGallery } from "@/components/shared/ImageGallery";

const formSchema = z.object({
  descricao: z.string().min(3, "A descrição é obrigatória."),
  valor: z.coerce.number().optional(),
  goldAmount: z.coerce.number().optional(),
  goldPrice: z.coerce.number().optional(),
  tipo: z.enum(["CREDITO", "DEBITO"]),
  contaContabilId: z.string({
    required_error: "Selecione uma conta contábil.",
  }),
  fornecedorId: z.string().optional().nullable(),
  contaCorrenteId: z.string().optional(), // Adicionar contaCorrenteId ao schema
  dataHora: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido (AAAA-MM-DD)."),
  mediaIds: z.array(z.string()).optional(),
});

interface TransacaoFormProps {
  contaCorrenteId: string;
  onSave: () => void;
  initialData?: TransacaoExtrato | null;
  moeda?: string;
}

interface TransacaoExtrato {
  id: string;
  dataHora: string;
  descricao: string;
  valor: number;
  goldAmount?: number;
  tipo: 'CREDITO' | 'DEBITO';
  contaContabilId: string;
  fornecedorId?: string | null;
  medias?: { id: string; path: string }[];
  goldPrice?: number;
}

interface ContaContabil {
  id: string;
  nome: string;
  codigo: string;
}

interface Fornecedor {
  id: string;
  name: string;
}

// ... TransacaoExtrato, ContaContabil, Fornecedor interfaces ...

interface ContaCorrente { // Adicionar interface
  id: string;
  nome: string;
}

export function TransacaoForm({ contaCorrenteId, onSave, initialData }: TransacaoFormProps) {
  const [contasContabeis, setContasContabeis] = useState<ContaContabil[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  const [quotation, setQuotation] = useState(0);
  const [uploadedMedia, setUploadedMedia] = useState<{ id: string; path: string }[]>(initialData?.medias || []);
  const [tipoLancamento, setTipoLancamento] = useState<'CREDITO' | 'DEBITO'>(initialData?.tipo || 'CREDITO');

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataHora: new Date().toISOString().split("T")[0],
      tipo: "CREDITO",
      descricao: "",
      valor: 0,
      goldAmount: 0,
      contaContabilId: "",
      fornecedorId: null,
      mediaIds: [],
      contaCorrenteId: contaCorrenteId,
    },
  });

  const { watch, setValue, reset, getValues } = form;
  const dataHora = watch("dataHora");

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        dataHora: initialData.dataHora.split('T')[0],
        mediaIds: initialData.medias?.map(media => media.id) || [],
        contaCorrenteId: contaCorrenteId,
      });
      setTipoLancamento(initialData.tipo);
      setUploadedMedia(initialData.medias || []);
      if (initialData.goldPrice) {
        setQuotation(initialData.goldPrice);
      }
    } else {
      reset({
        dataHora: new Date().toISOString().split("T")[0],
        tipo: "CREDITO",
        descricao: "",
        valor: 0,
        goldAmount: 0,
        contaContabilId: "",
        fornecedorId: null,
        mediaIds: [],
        contaCorrenteId: contaCorrenteId,
      });
      setTipoLancamento('CREDITO');
      setUploadedMedia([]);
    }
  }, [initialData, reset, contaCorrenteId]);

  useEffect(() => {
    const fetchContas = async () => {
      if (tipoLancamento) {
        const endpoint = `/contas-contabeis?tipo=${tipoLancamento === "CREDITO" ? "RECEITA" : "DESPESA"}`;
        try {
          const res = await api.get(endpoint);
          setContasContabeis(res.data);
        } catch (error) {
          setContasContabeis([]);
        }
      } else {
        setContasContabeis([]);
      }
    };
    const fetchFornecedores = async () => {
      try {
        const res = await api.get("/pessoas?role=FORNECEDOR");
        setFornecedores(res.data);
      } catch (error) {
        setFornecedores([]);
      }
    };
    const fetchContasCorrentes = async () => {
      try {
        const res = await api.get("/contas-correntes", {
          params: { activeOnly: true }, // Filtra apenas ativas
        });
        setContasCorrentes(res.data);
      } catch (error) {
        setContasCorrentes([]);
      }
    };

    fetchContas();
    fetchFornecedores();
    fetchContasCorrentes();
  }, [tipoLancamento]);

  const handleTipoChange = (value: 'CREDITO' | 'DEBITO') => {
    setTipoLancamento(value);
    setValue('tipo', value);
    setValue('contaContabilId', '');
    if (value === 'CREDITO') {
      setValue('fornecedorId', null);
    }
  };

  // Fetch quotation when date changes
  useEffect(() => {
    const fetchQuotation = async () => {
      if (dataHora) {
        try {
          const response = await api.get(
            `/quotations/by-date?date=${dataHora}&metal=AU`,
          );
          const fetchedQuotation = response.data?.sellPrice || 0;
          setQuotation(fetchedQuotation);

          const currentBrlValue = getValues('valor') || 0;
          if (fetchedQuotation > 0 && currentBrlValue > 0) {
            const newGoldAmount = currentBrlValue / fetchedQuotation;
            setValue('goldAmount', parseFloat(newGoldAmount.toFixed(4)));
          } else if (fetchedQuotation === 0) {
            toast.info(
              'Cotação não encontrada para a data. Ajuste os valores.',
            );
          }
        } catch (error) {
          setQuotation(0);
          toast.error('Falha ao buscar cotação.');
        }
      }
    };
    fetchQuotation();
  }, [dataHora, setValue, getValues]);

  const handleBrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBrlValue = parseFloat(e.target.value) || 0;
    setValue('valor', newBrlValue);
    if (quotation > 0) {
      const newGoldAmount = newBrlValue / quotation;
      setValue('goldAmount', parseFloat(newGoldAmount.toFixed(4)));
    }
  };

  const handleGoldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newGoldValue = parseFloat(e.target.value) || 0;
    setValue('goldAmount', newGoldValue);
    if (quotation > 0) {
      const newBrlValue = newGoldValue * quotation;
      setValue('valor', parseFloat(newBrlValue.toFixed(2)));
    }
  };

  const handleQuotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuotation = parseFloat(e.target.value) || 0;
    setQuotation(newQuotation);
    const currentBrlValue = watch('valor') || 0;
    if (newQuotation > 0 && currentBrlValue > 0) {
      const newGoldAmount = currentBrlValue / newQuotation;
      setValue('goldAmount', parseFloat(newGoldAmount.toFixed(4)));
    }
  };

  const filteredOptions = useMemo(() => {
    return contasContabeis.map((c) => ({
      value: c.id,
      label: `${c.codigo} - ${c.nome}`,
    }));
  }, [contasContabeis]);

  const onSubmit = async (data: FormValues) => {
    try {
      const method = initialData ? "patch" : "post";
      const url = initialData
        ? `/transacoes/${initialData.id}`
        : "/transacoes";

      await api[method](url, {
        ...data,
        goldPrice: quotation,
        // contaCorrenteId já está em 'data' agora, mas o backend espera ele.
        // Se estiver editando, o backend permite atualizar se passar.
        // Se for criação, usa o do form ou da prop.
        contaCorrenteId: data.contaCorrenteId || contaCorrenteId,
      });

      toast.success(`Lançamento ${initialData ? 'atualizado' : 'realizado'} com sucesso!`);
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ocorreu um erro.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* ... existing fields ... */}
        
        {/* Campo de Conta Corrente (Editável apenas se for edição ou se quiser permitir mudar na criação) */}
        <FormField
          name="contaCorrenteId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conta Corrente</FormLabel>
              <Combobox
                options={contasCorrentes.map((c) => ({
                  value: c.id,
                  label: c.nome,
                }))}
                value={field.value}
                onChange={field.onChange}
                placeholder="Selecione a conta corrente..."
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="tipo"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Lançamento</FormLabel>
              <Select onValueChange={handleTipoChange} value={tipoLancamento}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CREDITO">Crédito (Entrada)</SelectItem>
                  <SelectItem value="DEBITO">Débito (Saída)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="dataHora"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data do Lançamento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4 items-end">
            <FormField
                name="valor"
                control={form.control}
                render={({ field }) => (
                <FormItem className="col-span-1">
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                    <Input type="number" step="0.01" {...field} onChange={handleBrlChange} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                name="quotation"
                render={({ field }) => (
                <FormItem className="col-span-1">
                    <FormLabel>Cotação do Dia</FormLabel>
                    <FormControl>
                    <Input type="number" step="0.01" value={quotation} onChange={handleQuotationChange} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                name="goldAmount"
                control={form.control}
                render={({ field }) => (
                <FormItem className="col-span-1">
                    <FormLabel>Valor (Au g)</FormLabel>
                    <FormControl>
                    <Input type="number" step="0.0001" {...field} onChange={handleGoldChange} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        <FormField
          name="descricao"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Taxa bancária, Aporte de sócio"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contaContabilId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {tipoLancamento === "CREDITO"
                  ? "Origem do Crédito"
                  : "Destino do Débito"}
              </FormLabel>
              <Combobox
                options={filteredOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Selecione a conta..."
                disabled={!tipoLancamento || filteredOptions.length === 0}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {tipoLancamento === 'DEBITO' && (
          <FormField
            control={form.control}
            name="fornecedorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor (Opcional)</FormLabel>
                <Combobox
                  options={fornecedores.map((f) => ({
                    value: f.id,
                    label: f.name,
                  }))}
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                  placeholder="Selecione um fornecedor..."
                />
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="space-y-4">
          <FormLabel>Imagens Anexadas</FormLabel>
          {initialData?.id && (
            <ImageUpload
              entity={{ type: 'transacao', id: initialData.id }}
              onMediaUploadSuccess={(media) => {
                setUploadedMedia((prev) => [...prev, media]);
                const currentMediaIds = form.getValues('mediaIds') || [];
                form.setValue('mediaIds', [...currentMediaIds, media.id], { shouldDirty: true, shouldTouch: true, shouldValidate: true });
              }}
            />
          )}
          <ImageGallery
            media={uploadedMedia}
            onRemoveMedia={(mediaIdToRemove) => {
              setUploadedMedia((prev) => prev.filter((media) => media.id !== mediaIdToRemove));
              form.setValue(
                'mediaIds',
                form.getValues('mediaIds')?.filter((id) => id !== mediaIdToRemove) || [],
              );
            }}
          />
        </div>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar Lançamento"}
        </Button>
      </form>
    </Form>
  );
}
