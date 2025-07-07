"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format, parse } from "date-fns";
import api from "@/lib/api";

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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DateInput } from "@/components/ui/date-input";

interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  birthDate?: Date | null;
  gender?: string | null;
}

const formSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  email: z
    .string()
    .email("Formato de email inválido.")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  gender: z.string().optional(),
  birthDate: z.preprocess(
    (arg) => {
      if (typeof arg === "string" && arg.length >= 8) {
        const parsedDate = parse(arg, "dd/MM/yyyy", new Date());
        if (!isNaN(parsedDate.getTime())) return parsedDate;
      }
      if (arg instanceof Date) return arg;
      return undefined;
    },
    z
      .date({
        errorMap: () => ({
          message: "Por favor, insira uma data válida no formato DD/MM/AAAA.",
        }),
      })
      .optional()
  ),
});

type ClientFormValues = z.infer<typeof formSchema>;

interface ClientFormProps {
  client?: Client | null;
  onSave: () => void;
}

export function ClientForm({ client, onSave }: ClientFormProps) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: client?.name || "",
      email: client?.email || "",
      phone: client?.phone || "",
      address: client?.address || "",
      birthDate: client?.birthDate ? new Date(client.birthDate) : undefined,
      gender: client?.gender || "",
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    try {
      if (client) {
        await api.patch(`/clients/${client.id}`, data);
        toast.success("Cliente atualizado com sucesso!");
      } else {
        await api.post("/clients", data);
        toast.success("Cliente criado com sucesso!");
      }
      onSave();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Ocorreu um erro.";
      toast.error(errorMessage);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Campos Name, Email, Phone, Address */}
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Nome do Cliente" {...field} />
              </FormControl>
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
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  {...field}
                />
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
                <Input placeholder="(11) 99999-9999" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="address"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Rua, Número, Bairro, Cidade - Estado"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => {
              // ✅ **CORREÇÃO APLICADA AQUI**
              // O valor pode ser um objeto Date (do 'defaultValues') ou uma string (do input do usuário).
              // A máscara já formata a string visualmente, então só precisamos converter o objeto Date.
              const displayValue =
                field.value instanceof Date
                  ? format(field.value, "dd/MM/yyyy")
                  : field.value || "";

              return (
                <FormItem>
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl>
                    <DateInput
                      value={displayValue}
                      onAccept={(value: any) => field.onChange(value)}
                      placeholder="DD/MM/AAAA"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gênero</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex items-center space-x-4 pt-2"
                  >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="Feminino" />
                      </FormControl>
                      <FormLabel className="font-normal">Feminino</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="Masculino" />
                      </FormControl>
                      <FormLabel className="font-normal">Masculino</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </Form>
  );
}
