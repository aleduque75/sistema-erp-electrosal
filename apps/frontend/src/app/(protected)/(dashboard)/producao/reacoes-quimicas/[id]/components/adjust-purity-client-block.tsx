'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const formSchema = z.object({
  finalPurity: z.coerce.number().positive('A pureza final deve ser um número positivo.'),
});

function AdjustPurityForm({ reactionId, setIsOpen }: { reactionId: string; setIsOpen: (open: boolean) => void }) {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await api.patch(`/chemical-reactions/${reactionId}/adjust-purity`, values);
      toast.success('Sucesso!', { description: 'A pureza da reação foi ajustada.' });
      setIsOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error('Erro ao ajustar pureza', { description: error.response?.data?.message || 'Ocorreu um erro desconhecido' });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField name="finalPurity" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Pureza Final (%)</FormLabel>
            <FormControl><Input type="number" placeholder="68.5" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Salvando...' : 'Ajustar Pureza'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function AdjustPurityClientBlock({ reactionId }: { reactionId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="secondary">Ajustar Pureza</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Pureza da Reação</DialogTitle>
          <DialogDescription>Insira a pureza final para calcular os ajustes necessários.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <AdjustPurityForm reactionId={reactionId} setIsOpen={setIsOpen} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
