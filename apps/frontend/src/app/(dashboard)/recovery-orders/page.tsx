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
import { RecoveryReport } from "@/components/recovery-orders/RecoveryReport";

export default function RecoveryOrdersPage() {
  const [recoveryOrders, setRecoveryOrders] = useState<RecoveryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      />
      <CreateRecoveryOrderModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />
    </Shell>
  );
}