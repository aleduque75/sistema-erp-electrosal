'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useEffect } from 'react';

// Esquema de validação com Zod
const formSchema = z.object({
  name: z.string().min(2, {
    message: 'O nome da função deve ter pelo menos 2 caracteres.',
  }),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).default([]),
});

// Tipos baseados no schema
type RoleFormValues = z.infer<typeof formSchema>;

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface RoleFormProps {
  initialData?: {
    name: string;
    description?: string | null;
    permissions: { id: string }[];
  } | null;
  permissions: Permission[];
  onSubmit: (values: RoleFormValues) => void;
  isSubmitting: boolean;
}

export function RoleForm({
  initialData,
  permissions,
  onSubmit,
  isSubmitting,
}: RoleFormProps) {
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      permissionIds: initialData?.permissions.map((p) => p.id) || [],
    },
  });

  useEffect(() => {
    // Reseta o formulário se os dados iniciais mudarem (ex: ao selecionar outra role para editar)
    form.reset({
      name: initialData?.name || '',
      description: initialData?.description || '',
      permissionIds: initialData?.permissions.map((p) => p.id) || [],
    });
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Função</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Vendedor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Acesso para a equipe de vendas" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="permissionIds"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Permissões</FormLabel>
                <FormDescription>
                  Selecione as permissões que esta função terá.
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {permissions.map((permission) => (
                  <FormField
                    key={permission.id}
                    control={form.control}
                    name="permissionIds"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={permission.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(permission.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([
                                      ...(field.value || []),
                                      permission.id,
                                    ])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== permission.id,
                                      ),
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {permission.name}
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </Form>
  );
}
