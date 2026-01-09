"use client";

import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header";
import { Shell } from "@/components/shell";
import { useEffect, useState } from "react";
import { RecoveryOrder } from "@/types/recovery-order";
import { getRecoveryOrders } from "@/services/recoveryOrdersApi";
import { RecoveryOrdersTable } from "@/components/recovery-orders/RecoveryOrdersTable";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CreateRecoveryOrderModal } from "@/components/recovery-orders/CreateRecoveryOrderModal";
import { ApplyRecoveryOrderCommissionModal } from "@/components/recovery-orders/ApplyRecoveryOrderCommissionModal";
import { RecoveryReport } from "@/components/recovery-orders/RecoveryReport";
import { toast } from "sonner"; // Import toast
import { // Import AlertDialog components
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cancelRecoveryOrder } from "@/services/recoveryOrdersApi"; // Import cancelRecoveryOrder

export default function RecoveryOrdersPage() {
  const [recoveryOrders, setRecoveryOrders] = useState<RecoveryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [recoveryOrderToApplyCommission, setRecoveryOrderToApplyCommission] = useState<RecoveryOrder | null>(null);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false); // New state for confirmation dialog
  const [recoveryOrderToCancel, setRecoveryOrderToCancel] = useState<string | null>(null); // New state for ID to cancel

  const fetchRecoveryOrders = async () => {
    setIsLoading(true);
    try {
      const fetchedOrders = await getRecoveryOrders();
      setRecoveryOrders(fetchedOrders);
    } catch (error) {
      console.error("Erro ao buscar ordens de recuperação:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecoveryOrders();
  }, []);

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchRecoveryOrders();
  };

  const handleCancelRecoveryOrder = (recoveryOrderId: string) => {
    setRecoveryOrderToCancel(recoveryOrderId);
    setIsCancelConfirmOpen(true);
  };

  const confirmCancelRecoveryOrder = async () => {
    if (!recoveryOrderToCancel) return;
    try {
      await cancelRecoveryOrder(recoveryOrderToCancel);
      toast.success("Ordem de Recuperação cancelada com sucesso!");
      fetchRecoveryOrders(); // Refresh the list
    } catch (error) {
      toast.error("Falha ao cancelar a Ordem de Recuperação.");
      console.error("Error canceling recovery order:", error);
    } finally {
      setRecoveryOrderToCancel(null);
      setIsCancelConfirmOpen(false);
    }
  };

  return (
    <Shell>
      <PageHeader
        title="Ordens de Recuperação"
        description="Gerencie as ordens de recuperação de metais."
      >
        <PageHeaderHeading size="sm">Ordens de Recuperação</PageHeaderHeading>
        <PageHeaderDescription>
          Gerencie as ordens de recuperação de metais.
        </PageHeaderDescription>
      </PageHeader>
      <RecoveryReport />
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Criar Nova Ordem
        </Button>
      </div>
      <RecoveryOrdersTable
        recoveryOrders={recoveryOrders}
        isLoading={isLoading}
        onRecoveryOrderUpdated={fetchRecoveryOrders}
        onCancelRecoveryOrder={handleCancelRecoveryOrder} // Pass the new handler
        onApplyCommission={(order) => setRecoveryOrderToApplyCommission(order)}
      />
      <CreateRecoveryOrderModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      <ApplyRecoveryOrderCommissionModal
        recoveryOrder={recoveryOrderToApplyCommission}
        open={!!recoveryOrderToApplyCommission}
        onOpenChange={(open) => !open && setRecoveryOrderToApplyCommission(null)}
        onSuccess={fetchRecoveryOrders}
      />

      {/* Confirmation Dialog for Cancellation */}
      <AlertDialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja cancelar esta Ordem de Recuperação? Todas as análises químicas associadas serão revertidas para o status "Aprovado para Recuperação".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelRecoveryOrder}>Sim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
}