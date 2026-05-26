'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { IconMap } from '@/lib/icon-map';
import * as Icons from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const formSchema = z.object({
  title: z.string().min(2, 'Título deve ter ao menos 2 caracteres'),
  href: z.string().min(1, 'Link é obrigatório'),
  icon: z.string().optional(),
  order: z.number().int(),
  disabled: z.boolean().optional(),
  parentId: z.string().nullable().optional(),
  allowedSectors: z.array(z.string()).optional(),
  allowedRoles: z.array(z.string()).optional(),
});

interface MenuItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
  parentItems: any[];
}

export function MenuItemForm({
  open,
  onOpenChange,
  onSuccess,
  initialData,
  parentItems,
}: MenuItemFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      href: '#',
      icon: 'Package',
      order: 0,
      disabled: false,
      parentId: null,
      allowedSectors: [],
      allowedRoles: [],
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title || '',
        href: initialData.href || '#',
        icon: initialData.icon || 'Package',
        order: initialData.order || 0,
        disabled: initialData.disabled || false,
        parentId: initialData.parentId || null,
        allowedSectors: initialData.allowedSectors || [],
        allowedRoles: initialData.allowedRoles || [],
      });
    } else {
      form.reset({
        title: '',
        href: '#',
        icon: 'Package',
        order: parentItems.length + 1,
        disabled: false,
        parentId: null,
        allowedSectors: [],
        allowedRoles: [],
      });
    }
  }, [initialData, open, form, parentItems.length]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      const data = {
        ...values,
        parentId: values.parentId === 'none' ? null : values.parentId,
      };

      if (initialData) {
        await api.patch(`/menu/${initialData.id}`, data);
        toast.success('Página de menu atualizada!');
      } else {
        await api.post('/menu', data);
        toast.success('Novo item de menu criado!');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar item de menu');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const iconOptions = Object.keys(IconMap);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Item de Menu' : 'Novo Item de Menu'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Estoque" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="href"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Link (HREF)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: /inventory/lots ou #" {...field} />
                    </FormControl>
                    <FormDescription>
                      Use '#' para itens que possuem sub-menus.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ícone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um ícone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {iconOptions.map((icon) => {
                          const LucideIcon = (Icons as any)[icon];
                          return (
                            <SelectItem key={icon} value={icon}>
                              <div className="flex items-center gap-2">
                                {LucideIcon && <LucideIcon size={16} />}
                                <span>{icon}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Item Pai</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível superior" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum (Raiz)</SelectItem>
                        {parentItems
                          .filter(item => item.id !== initialData?.id)
                          .map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecione um item se este for um sub-menu.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="col-span-2 space-y-2">
                <FormLabel>Setores Autorizados</FormLabel>
                <div className="grid grid-cols-2 gap-2 border rounded-md p-3">
                  {[
                    { value: "PCP", label: "PCP (Produção)" },
                    { value: "FINANCEIRO", label: "Financeiro" },
                    { value: "OPERACOES", label: "Operações" },
                    { value: "ESTOQUE", label: "Estoque" },
                    { value: "RELATORIOS", label: "Relatórios" },
                    { value: "ADMINISTRACAO", label: "Administração" },
                    { value: "GERAL", label: "Geral (Sem Setor)" },
                  ].map((sector) => (
                    <FormField
                      key={sector.value}
                      control={form.control}
                      name="allowedSectors"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={sector.value}
                            className="flex flex-row items-start space-x-2 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(sector.value)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), sector.value])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== sector.value
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer select-none">
                              {sector.label}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="col-span-2 space-y-2">
                <FormLabel>Funções Autorizadas</FormLabel>
                <div className="grid grid-cols-2 gap-2 border rounded-md p-3">
                  {[
                    { value: "ADMIN", label: "Administrador" },
                    { value: "USER", label: "Usuário Comum" },
                  ].map((role) => (
                    <FormField
                      key={role.value}
                      control={form.control}
                      name="allowedRoles"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={role.value}
                            className="flex flex-row items-start space-x-2 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(role.value)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), role.value])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== role.value
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer select-none">
                              {role.label}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="disabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 col-span-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Desativar Item</FormLabel>
                      <FormDescription>
                        Oculta o item do menu sem excluí-lo.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Criar Item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
