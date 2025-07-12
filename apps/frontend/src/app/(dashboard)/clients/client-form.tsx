"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format, parse } from "date-fns"; // 'parse' é importante para converter string para Date
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
import { DateInput } from "@/components/ui/date-input"; // Assumindo que este componente lida com máscara DD/MM/YYYY

interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  birthDate?: Date | null; // Assumindo que do backend pode vir como Date
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
  birthDate: z.union([
    z.date(),
    z.string().refine((val) => !val || !isNaN(parse(val, "dd/MM/yyyy", new Date()).getTime()), {
      message: "Data inválida",
    }),
  ]).optional().nullable(),
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
      // Ajuste para defaultValues:
      // birthDate precisa ser um objeto Date ou undefined, conforme o schema.
      // Se client?.birthDate for string, converta para Date. Se for Date, use como está.
      birthDate: client?.birthDate
        ? client.birthDate instanceof Date
          ? client.birthDate // Já é Date
          : new Date(client.birthDate) // Converte string para Date
        : undefined, // Se não houver, é undefined
      gender: client?.gender || "",
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    try {
      // ✅ IMPORTANTE: Se o backend espera string YYYY-MM-DD ou Date, ajuste aqui.
      // O Zod já garante que data.birthDate é um Date | undefined | null.
      // Se você precisa que seja string para o backend:
      const dataToSend = {
        ...data,
        birthDate:
          data.birthDate instanceof Date && !isNaN(data.birthDate.getTime())
            ? format(data.birthDate, "yyyy-MM-dd")
            : null, // Ou undefined, dependendo do que o backend aceita para nulo/ausente
      };

      if (client) {
        await api.patch(`/clients/${client.id}`, dataToSend); // Use dataToSend
        toast.success("Cliente atualizado com sucesso!");
      } else {
        await api.post("/clients", dataToSend); // Use dataToSend
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
              // ✅ CORREÇÃO APLICADA AQUI NO RENDER:
              // O DateInput espera uma string formatada (DD/MM/YYYY).
              // field.value virá do useForm (será Date ou undefined).
              // Convertemos Date para string 'DD/MM/YYYY' para exibir no input.
              const displayValue =
                field.value instanceof Date && !isNaN(field.value.getTime())
                  ? format(field.value, "dd/MM/yyyy")
                  : ""; // Se não for Date válido, exibe vazio

              return (
                <FormItem>
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl>
                    <DateInput
                      value={displayValue} // Passa a string formatada para o input
                      // onAccept deve passar a string formatada para o Zod preprocessar
                      onAccept={(value: string) => field.onChange(value)}
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
