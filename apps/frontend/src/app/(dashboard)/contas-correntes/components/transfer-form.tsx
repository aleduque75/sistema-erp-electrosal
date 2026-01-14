import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { useTransfer } from "../hooks/use-transfer";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react"; // Importar useMemo
import { ImageUpload } from "@/components/shared/ImageUpload";
import { ImageGallery } from "@/components/shared/ImageGallery";
import api from "@/lib/api"; // Importar api

const transferSchema = z.object({
  destinationAccountId: z.string().min(1, "Campo obrigatório"),
  amount: z.coerce.number().optional(),
  goldAmount: z.coerce.number().optional(),
  description: z.string().optional(),
  mediaIds: z.array(z.string()).optional(),
  dataHora: z.string().optional(),
  contaContabilId: z.string({ // Adicionar contaContabilId
    required_error: "Selecione uma conta contábil.",
  }),
});

interface TransferFormProps {
  fromAccountId: string;
  transferType: "BRL" | "GOLD";
  onSave: () => void;
}

interface ContaContabil { // Definir interface para ContaContabil
  id: string;
  nome: string;
  codigo: string;
}

export function TransferForm({ fromAccountId, transferType, onSave }: TransferFormProps) {
  const [uploadedMedia, setUploadedMedia] = useState<{ id: string; path: string }[]>([]);
  const [quotation, setQuotation] = useState(0);
  const [contasContabeis, setContasContabeis] = useState<ContaContabil[]>([]); // Estado para contas contábeis

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      destinationAccountId: "",
      amount: 0,
      goldAmount: 0,
      description: "",
      mediaIds: [],
      dataHora: new Date().toISOString().split('T')[0],
      contaContabilId: "", // Inicializar contaContabilId
    },
  });

  const { accounts, isLoading, performTransfer } = useTransfer(transferType, fromAccountId);

  const dataHora = watch("dataHora");

  // Buscar cotação quando a data muda
  useEffect(() => {
    const fetchQuotation = async () => {
      if (!dataHora) return;
      try {
        const response = await api.get(`/quotations/by-date?date=${dataHora}&metal=AU`);
        const fetchedQuotation = response.data?.buyPrice || 0;
        setQuotation(fetchedQuotation);
        // Limpar os valores se a cotação for zero para evitar cálculos errados
        if (fetchedQuotation === 0) {
            toast.info('Cotação não encontrada para a data selecionada. O valor será zerado.');
            setValue('amount', 0);
            setValue('goldAmount', 0);
        }
      } catch (error) {
        setQuotation(0);
        setValue('amount', 0);
        setValue('goldAmount', 0);
        toast.info('Cotação não encontrada para a data selecionada. O valor será zerado.');
      }
    };
    fetchQuotation();
  }, [dataHora, setValue]);

  // Buscar contas contábeis
  useEffect(() => {
    const fetchContasContabeis = async () => {
      try {
        const response = await api.get("/contas-contabeis");
        setContasContabeis(response.data);
        const defaultAccount = response.data.find((cc: any) => cc.codigo === "1.1.7");
        if (defaultAccount) {
          setValue('contaContabilId', defaultAccount.id);
        }
      } catch (error) {
        toast.error("Falha ao carregar contas contábeis.");
      }
    };
    fetchContasContabeis();
  }, [setValue]);

  const filteredContasContabeisOptions = useMemo(() => {
    return contasContabeis.map((cc) => ({
      value: cc.id,
      label: `${cc.codigo} - ${cc.nome}`,
    }));
  }, [contasContabeis]);

  // Handlers para conversão dinâmica
  const handleBrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBrlValue = parseFloat(e.target.value) || 0;
    setValue('amount', newBrlValue);
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
      setValue('amount', parseFloat(newBrlValue.toFixed(2)));
    }
  };

  const handleQuotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuotation = parseFloat(e.target.value) || 0;
    setQuotation(newQuotation);
    const currentBrlValue = watch('amount') || 0;
    if (newQuotation > 0 && currentBrlValue > 0) {
      const newGoldAmount = currentBrlValue / newQuotation;
      setValue('goldAmount', parseFloat(newGoldAmount.toFixed(4)));
    }
  };

  const onSubmit = async (data: z.infer<typeof transferSchema>) => {
    try {
      await performTransfer({
        ...data,
        sourceAccountId: fromAccountId,
        mediaIds: watch('mediaIds'),
        quotation,
        contaContabilId: data.contaContabilId, // Passar contaContabilId
      });
      toast.success("Transferência realizada com sucesso!");
      setUploadedMedia([]);
      setValue('mediaIds', []);
      onSave();
    } catch (error: any) {
      toast.error("Erro ao realizar transferência", {
        description: error.response?.data?.message || "Ocorreu um erro desconhecido",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Data da Transferência</Label>
        <Controller
          name="dataHora"
          control={control}
          render={({ field }) => <Input type="date" {...field} />}
        />
        {errors.dataHora && <p className="text-red-500 text-sm">{errors.dataHora.message}</p>}
      </div>

      <div>
        <Label>Conta de Destino</Label>
        <Controller
          name="destinationAccountId"
          control={control}
          render={({ field }) => (
            <Combobox
              options={accounts.map((acc) => ({ value: acc.id, label: acc.nome }))}
              value={field.value}
              onChange={field.onChange}
              placeholder="Selecione a conta de destino"
              disabled={isLoading}
            />
          )}
        />
        {errors.destinationAccountId && <p className="text-red-500 text-sm">{errors.destinationAccountId.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4 items-end">
        <div>
          <Label>Valor (R$)</Label>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => <Input type="number" {...field} onChange={handleBrlChange} />}
          />
          {errors.amount && <p className="text-red-500 text-sm">{errors.amount.message}</p>}
        </div>
        <div>
          <Label>Cotação</Label>
          <Input type="number" value={quotation} onChange={handleQuotationChange} />
        </div>
        <div>
          <Label>Valor (Au g)</Label>
          <Controller
            name="goldAmount"
            control={control}
            render={({ field }) => <Input type="number" {...field} onChange={handleGoldChange} />}
          />
          {errors.goldAmount && <p className="text-red-500 text-sm">{errors.goldAmount.message}</p>}
        </div>
      </div>

      <div>
        <Label>Descrição</Label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </div>

      <div>
        <Label>Conta Contábil</Label>
        <Controller
          name="contaContabilId"
          control={control}
          render={({ field }) => (
            <Combobox
              options={filteredContasContabeisOptions}
              value={field.value}
              onChange={field.onChange}
              placeholder="Selecione a conta contábil..."
              disabled={filteredContasContabeisOptions.length === 0}
            />
          )}
        />
        {errors.contaContabilId && <p className="text-red-500 text-sm">{errors.contaContabilId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Anexar Imagens (Opcional)</Label>
        <ImageUpload
          entity={{ type: 'transacao', id: 'temp' }}
          onMediaUploadSuccess={(media) => {
            setUploadedMedia((prev) => [...prev, media]);
            setValue('mediaIds', [...(watch('mediaIds') || []), media.id]);
          }}
        />
        <ImageGallery
          media={uploadedMedia}
          onRemoveMedia={(mediaIdToRemove) => {
            setUploadedMedia((prev) => prev.filter((media) => media.id !== mediaIdToRemove));
            setValue(
              'mediaIds',
              watch('mediaIds')?.filter((id) => id !== mediaIdToRemove) || [],
            );
          }}
        />
      </div>

      <Button type="submit" disabled={isSubmitting || isLoading}>
        {isSubmitting ? "Transferindo..." : "Transferir"}
      </Button>
    </form>
  );
}