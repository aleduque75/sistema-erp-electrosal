import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PureMetalLot, PureMetalLotStatus } from '@/types/pure-metal-lot';
import { useState, useEffect } from 'react';
import { updatePureMetalLot } from '@/services/pureMetalLotsApi';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PureMetalLotEditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pureMetalLot: PureMetalLot;
  onSuccess: () => void;
}

export function PureMetalLotEditModal({
  isOpen,
  onOpenChange,
  pureMetalLot,
  onSuccess,
}: PureMetalLotEditModalProps) {
  const [entryDate, setEntryDate] = useState(format(new Date(pureMetalLot.entryDate), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<PureMetalLotStatus>(pureMetalLot.status);
  const [notes, setNotes] = useState(pureMetalLot.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEntryDate(format(new Date(pureMetalLot.entryDate), 'yyyy-MM-dd'));
    setStatus(pureMetalLot.status);
    setNotes(pureMetalLot.notes || '');
  }, [pureMetalLot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updatePureMetalLot(pureMetalLot.id, {
        entryDate: new Date(entryDate).toISOString(),
        status,
        notes,
      });
      toast.success("Lote de metal puro atualizado com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao atualizar lote de metal puro.");
      console.error("Erro ao atualizar lote de metal puro:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Lote de Metal Puro</DialogTitle>
          <DialogDescription>
            Faça alterações nos detalhes do lote de metal puro aqui. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="entryDate" className="text-right">
                Data de Entrada
              </Label>
              <Input
                id="entryDate"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select value={status} onValueChange={(value: PureMetalLotStatus) => setStatus(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PureMetalLotStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notas
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar mudanças"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}