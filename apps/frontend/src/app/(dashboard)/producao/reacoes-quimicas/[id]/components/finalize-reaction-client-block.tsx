'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ReactionLeftoverType } from '@prisma/client';

// Tipos
interface Product {
  id: string;
  name: string;
}
type FinalizeReactionData = z.infer<typeof formSchema>;

const formSchema = z.object({
  productId: z.string().min(1, 'Selecione um produto.'),
  gramsProduced: z.coerce.number().positive('A quantidade produzida deve ser positiva.'),
  purity: z.coerce.number().positive('A pureza deve ser um número positivo.').optional(),
  newLeftovers: z.array(z.object({
    type: z.nativeEnum(ReactionLeftoverType),
    grams: z.coerce.number().positive('As gramas devem ser um número positivo.'),
  })).optional(),
});

function FinalizeReactionForm({ reactionId, setIsOpen }: { reactionId: string; setIsOpen: (open: boolean) => void }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await api.get('/products');
        setProducts(response.data);
      } catch (error) {
        toast.error('Erro ao buscar produtos', { description: 'Não foi possível carregar a lista de produtos.' });
      } finally {
        setIsLoadingProducts(false);
      }
    }
    fetchProducts();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { newLeftovers: [] },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'newLeftovers' });

  async function onSubmit(values: FinalizeReactionData) {
    try {
      await api.post(`/chemical-reactions/${reactionId}/finalize`, values);
      toast.success('Sucesso!', { description: 'A reação foi finalizada e o lote de produção foi criado.' });
      setIsOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error('Erro ao finalizar reação', { description: error.response?.data?.message || 'Ocorreu um erro desconhecido' });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField name="productId" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Produto Gerado</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingProducts}>
                <FormControl><SelectTrigger><SelectValue placeholder={isLoadingProducts ? 'Carregando...' : 'Selecione o produto...'} /></SelectTrigger></FormControl>
                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="gramsProduced" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Gramas Produzidas</FormLabel>
              <FormControl><Input type="number" placeholder="1250.50" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Novas Sobras</h3>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2">
                <FormField name={`newLeftovers.${index}.type`} control={form.control} render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Tipo..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value={ReactionLeftoverType.BASKET}>CESTO</SelectItem>
                        <SelectItem value={ReactionLeftoverType.DISTILLATE}>DESTILADO</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name={`newLeftovers.${index}.grams`} control={form.control} render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Gramas</FormLabel>
                    <FormControl><Input type="number" placeholder="50.2" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ type: ReactionLeftoverType.BASKET, grams: 0 })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Sobra
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Finalizando...' : 'Finalizar Reação'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function FinalizeReactionClientBlock({ reactionId }: { reactionId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">Finalizar Reação</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Finalizar Reação Química</DialogTitle>
          <DialogDescription>Insira os resultados da reação para criar o lote de produção e registrar as novas sobras.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <FinalizeReactionForm reactionId={reactionId} setIsOpen={setIsOpen} />
        </div>
      </DialogContent>
    </Dialog>
  );
}