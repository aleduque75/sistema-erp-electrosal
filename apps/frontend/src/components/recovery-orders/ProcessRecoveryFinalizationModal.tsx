import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import { RecoveryOrder } from "@/types/recovery-order";
import { finalizeRecoveryOrder } from "@/services/recoveryOrdersApi";

interface ProcessRecoveryFinalizationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recoveryOrder: RecoveryOrder | null;
  onSuccess: () => void;
}

export function ProcessRecoveryFinalizationModal({
  isOpen,
  onOpenChange,
  recoveryOrder,
  onSuccess,
}: ProcessRecoveryFinalizationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!recoveryOrder) return null;

  const handleFinalize = async () => {
    setIsSubmitting(true);
    try {
      await finalizeRecoveryOrder(recoveryOrder.id, {}); // Empty DTO for now
      toast.success("Ordem de recuperação finalizada com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao finalizar ordem de recuperação", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar Ordem de Recuperação</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja finalizar a ordem de recuperação ID:{" "}
            <strong>{recoveryOrder.id}</strong>? Esta ação é irreversível e irá gerar o crédito de metal e a análise de resíduo.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleFinalize} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Confirmar Finalização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
