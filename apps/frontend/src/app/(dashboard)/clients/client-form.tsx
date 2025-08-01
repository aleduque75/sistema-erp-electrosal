"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

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

// Interface dos dados, agora com CPF e endereço estruturado
interface Client {
  id: string;
  name: string;
  email?: string | null;
  cpf?: string | null;
  phone?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
}
interface ClientFormProps {
  initialData?: Client | null;
  onSave: () => void;
}

// Schema de validação atualizado com CPF e endereço
const formSchema = z.object({
  name: z.string().min(2, "O nome é obrigatório."),
  email: z
    .string()
    .email("Formato de email inválido.")
    .optional()
    .or(z.literal("")),
  cpf: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  logradouro: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  complemento: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  uf: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export function ClientForm({ initialData, onSave }: ClientFormProps) {
  const [isCepLoading, setIsCepLoading] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      cpf: "",
      phone: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      uf: "",
      ...initialData,
    },
  });

  const { reset, setValue } = form;

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const handleCepLookup = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, "");
    if (cleanedCep.length !== 8) return;

    setIsCepLoading(true);
    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cleanedCep}/json/`
      );
      const data = await response.json();
      if (data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }
      setValue("logradouro", data.logradouro);
      setValue("bairro", data.bairro);
      setValue("cidade", data.localidade);
      setValue("uf", data.uf);
      document.getElementById("numero")?.focus();
    } catch (error) {
      toast.error("Erro ao buscar CEP.");
    } finally {
      setIsCepLoading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      if (initialData) {
        await api.patch(`/clients/${initialData.id}`, data);
        toast.success("Cliente atualizado com sucesso!");
      } else {
        await api.post("/clients", data);
        toast.success("Cliente criado com sucesso!");
      }
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ocorreu um erro.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* --- DADOS PESSOAIS --- */}
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              {" "}
              <FormLabel>Nome Completo</FormLabel>{" "}
              <FormControl>
                <Input placeholder="Nome do cliente" {...field} />
              </FormControl>{" "}
              <FormMessage />{" "}
            </FormItem>
          )}
        />
        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              {" "}
              <FormLabel>Email</FormLabel>{" "}
              <FormControl>
                <Input placeholder="email@exemplo.com" {...field} />
              </FormControl>{" "}
              <FormMessage />{" "}
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="cpf"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                {" "}
                <FormLabel>CPF</FormLabel>{" "}
                <FormControl>
                  <Input placeholder="000.000.000-00" {...field} />
                </FormControl>{" "}
                <FormMessage />{" "}
              </FormItem>
            )}
          />
          <FormField
            name="phone"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                {" "}
                <FormLabel>Telefone</FormLabel>{" "}
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} />
                </FormControl>{" "}
                <FormMessage />{" "}
              </FormItem>
            )}
          />
        </div>

        {/* --- ENDEREÇO --- */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-medium mb-4">Endereço</h3>
          <div className="space-y-4">
            <FormField
              name="cep"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        placeholder="00000-000"
                        {...field}
                        onBlur={(e) => handleCepLookup(e.target.value)}
                      />
                    </FormControl>
                    {isCepLoading && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <FormField
                  name="logradouro"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      {" "}
                      <FormLabel>Logradouro</FormLabel>{" "}
                      <FormControl>
                        <Input placeholder="Rua, Avenida..." {...field} />
                      </FormControl>{" "}
                      <FormMessage />{" "}
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  name="numero"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      {" "}
                      <FormLabel>Número</FormLabel>{" "}
                      <FormControl>
                        <Input id="numero" placeholder="Ex: 123" {...field} />
                      </FormControl>{" "}
                      <FormMessage />{" "}
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <FormField
              name="complemento"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  {" "}
                  <FormLabel>Complemento</FormLabel>{" "}
                  <FormControl>
                    <Input placeholder="Apto, Bloco, Casa" {...field} />
                  </FormControl>{" "}
                  <FormMessage />{" "}
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <FormField
                  name="bairro"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      {" "}
                      <FormLabel>Bairro</FormLabel>{" "}
                      <FormControl>
                        <Input {...field} />
                      </FormControl>{" "}
                      <FormMessage />{" "}
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                name="cidade"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    {" "}
                    <FormLabel>Cidade</FormLabel>{" "}
                    <FormControl>
                      <Input {...field} />
                    </FormControl>{" "}
                    <FormMessage />{" "}
                  </FormItem>
                )}
              />
              <FormField
                name="uf"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    {" "}
                    <FormLabel>UF</FormLabel>{" "}
                    <FormControl>
                      <Input maxLength={2} {...field} />
                    </FormControl>{" "}
                    <FormMessage />{" "}
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* --- BOTÃO DE AÇÃO --- */}
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar Cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
