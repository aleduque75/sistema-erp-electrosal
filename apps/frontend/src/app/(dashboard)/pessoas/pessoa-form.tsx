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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // ADDED

// Interface atualizada
interface Pessoa {
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
  client: object | null;
  fornecedor: object | null;
  funcionario: object | null;
}

interface PessoaFormProps {
  initialData?: Pessoa | null;
  onSave: () => void;
}

// Schema de validação com papéis
const formSchema = z.object({
  type: z.enum(["FISICA", "JURIDICA"], { message: "O tipo de pessoa é obrigatório." }), // ADDED
  name: z.string().min(2, "O nome é obrigatório."),
  email: z.string().email("Formato de email inválido.").optional().nullable(),
  cpf: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  logradouro: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  complemento: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  uf: z.string().optional().nullable(),
  roles: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Você deve selecionar pelo menos um papel.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const rolesDisponiveis = [
  { id: "CLIENT", label: "Cliente" },
  { id: "FORNECEDOR", label: "Fornecedor" },
  { id: "FUNCIONARIO", label: "Funcionário" },
];

export function PessoaForm({ initialData, onSave }: PessoaFormProps) {
  const [isCepLoading, setIsCepLoading] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "FISICA", // ADDED default type
      name: "",
      email: initialData?.email ?? undefined,
      cpf: "",
      phone: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      uf: "",
      roles: ["CLIENT"], // Default to client
      ...initialData,
    },
  });

  const { reset, setValue } = form;

  useEffect(() => {
    if (initialData) {
      const initialRoles = [];
      if (initialData.client) initialRoles.push("CLIENT");
      if (initialData.fornecedor) initialRoles.push("FORNECEDOR");
      if (initialData.funcionario) initialRoles.push("FUNCIONARIO");
      
      reset({
        ...initialData,
        roles: initialRoles.length > 0 ? initialRoles : ["CLIENT"],
      });
    }
  }, [initialData, reset]);

  const handleCepLookup = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, "");
    if (cleanedCep.length !== 8) return;

    setIsCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
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
        await api.patch(`/pessoas/${initialData.id}`, data);
        toast.success("Pessoa atualizada com sucesso!");
      } else {
        await api.post("/pessoas", data);
        toast.success("Pessoa criada com sucesso!");
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
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Nome da pessoa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* --- TIPO DE PESSOA --- */}
        <FormField
          name="type"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Pessoa</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="FISICA">Pessoa Física</SelectItem>
                  <SelectItem value="JURIDICA">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@exemplo.com" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="cpf"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input placeholder="000.000.000-00" {...field} value={field.value ?? ''}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="phone"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} value={field.value ?? ''}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* --- PAPÉIS --- */}
        <FormField
          name="roles"
          control={form.control}
          render={() => (
            <FormItem>
              <FormLabel>Papéis</FormLabel>
              <div className="flex items-center space-x-4">
                {rolesDisponiveis.map((role) => (
                  <FormField
                    key={role.id}
                    name="roles"
                    control={form.control}
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={role.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(role.id)}
                              onCheckedChange={(checked) => {
                                const currentRoles = field.value || [];
                                const newRoles = checked
                                  ? [...currentRoles, role.id]
                                  : currentRoles.filter(
                                      (value) => value !== role.id
                                    );
                                field.onChange(newRoles);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {role.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

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
                        value={field.value ?? ''}
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
                      <FormLabel>Logradouro</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, Avenida..." {...field} value={field.value ?? ''}/>
                      </FormControl>
                      <FormMessage />
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
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input id="numero" placeholder="Ex: 123" {...field} value={field.value ?? ''}/>
                      </FormControl>
                      <FormMessage />
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
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input placeholder="Apto, Bloco, Casa" {...field} value={field.value ?? ''}/>
                  </FormControl>
                  <FormMessage />
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
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                name="cidade"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="uf"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF</FormLabel>
                    <FormControl>
                      <Input maxLength={2} {...field} value={field.value ?? ''}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
