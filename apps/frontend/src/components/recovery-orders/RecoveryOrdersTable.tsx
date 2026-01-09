"use client";

import React, { useState, useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { getColumns } from './columns';
import { RecoveryOrderDto } from '@/types/recovery-order';
import { RecoveryOrderDetailsModal } from './RecoveryOrderDetailsModal';
import { LaunchPurityModal } from './LaunchPurityModal';
import { LaunchResultModal } from './LaunchResultModal';
import { ApplyRecoveryOrderCommissionModal } from './ApplyRecoveryOrderCommissionModal';
import { EditRecoveryOrderModal } from './EditRecoveryOrderModal';
import { toast } from 'sonner';
import api from '@/lib/api';
import { startRecoveryOrder } from '@/services/recoveryOrdersApi';

interface RecoveryOrdersTableProps {
  recoveryOrders: RecoveryOrderDto[];
  isLoading: boolean;
  onRecoveryOrderUpdated: () => void;
  onCancelRecoveryOrder: (id: string) => void;
  onApplyCommission: (order: RecoveryOrderDto) => void;
}

export function RecoveryOrdersTable({
  recoveryOrders,
  isLoading,
  onRecoveryOrderUpdated,
  onCancelRecoveryOrder,
  onApplyCommission,
}: RecoveryOrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<RecoveryOrderDto | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<string | null>(null);

  const [recoveryOrderToLaunchPurity, setRecoveryOrderToLaunchPurity] = useState<RecoveryOrderDto | null>(null);
  const [isLaunchPurityModalOpen, setIsLaunchPurityModalOpen] = useState(false);

  const [recoveryOrderToLaunchResult, setRecoveryOrderToLaunchResult] = useState<RecoveryOrderDto | null>(null);
  const [isLaunchResultModalOpen, setIsLaunchResultModalOpen] = useState(false);

  const [recoveryOrderToEdit, setRecoveryOrderToEdit] = useState<RecoveryOrderDto | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleViewDetails = (id: string) => {
    const order = recoveryOrders.find(o => o.id === id);
    if (order) {
      setSelectedOrder(order);
      setIsViewModalOpen(true);
    }
  };

  const handleEdit = (id: string) => {
    const order = recoveryOrders.find(o => o.id === id);
    if (order) {
      setRecoveryOrderToEdit(order);
      setIsEditModalOpen(true);
    }
  };

  const handleDownloadPdf = async (orderId: string) => {
    setIsDownloadingPdf(orderId);
    try {
      const response = await api.get(`/recovery-orders/${orderId}/pdf`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `recovery_order_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
      toast.success("Download do PDF iniciado.");
    } catch (error) {
      console.error("Falha ao baixar o PDF:", error);
      toast.error("Falha ao baixar o PDF. Tente novamente.");
    }
  };

  const handleStartRecoveryOrder = async (id: string) => {
    try {
      await startRecoveryOrder(id);
      toast.success("Ordem de recuperação iniciada com sucesso!");
      onRecoveryOrderUpdated();
    } catch (error) {
      toast.error("Falha ao iniciar ordem de recuperação.");
      console.error("Error starting recovery order:", error);
    }
  };

  const handleLaunchResult = (id: string) => {
    const order = recoveryOrders.find(o => o.id === id);
    if (order) {
      setRecoveryOrderToLaunchResult(order);
      setIsLaunchResultModalOpen(true);
    }
  };

  const handleLaunchPurity = (id: string) => {
    const order = recoveryOrders.find(o => o.id === id);
    if (order) {
      setRecoveryOrderToLaunchPurity(order);
      setIsLaunchPurityModalOpen(true);
    }
  };

  const handleModalSuccess = () => {
    onRecoveryOrderUpdated();
    setIsLaunchPurityModalOpen(false);
    setIsLaunchResultModalOpen(false);
  };

  const columns = useMemo(
    () => getColumns(
      handleViewDetails, 
      handleEdit, 
      onCancelRecoveryOrder,
      handleDownloadPdf,
      (id: string) => isDownloadingPdf === id,
      handleStartRecoveryOrder,
      handleLaunchResult,
      handleLaunchPurity,
      (id: string) => {
        const order = recoveryOrders.find(o => o.id === id);
        if (order) onApplyCommission(order);
      }
    ),
    [onCancelRecoveryOrder, isDownloadingPdf, recoveryOrders, onApplyCommission]
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={recoveryOrders}
        isLoading={isLoading}
        filterColumnId="orderNumber"
        filterPlaceholder="Filtrar por número da ordem..."
      />
      {selectedOrder && (
        <RecoveryOrderDetailsModal
          isOpen={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          recoveryOrder={selectedOrder as any}
          onUpdate={onRecoveryOrderUpdated}
        />
      )}
      {recoveryOrderToLaunchResult && (
        <LaunchResultModal
          isOpen={isLaunchResultModalOpen}
          onOpenChange={setIsLaunchResultModalOpen}
          recoveryOrder={recoveryOrderToLaunchResult}
          onSuccess={handleModalSuccess}
        />
      )}
      {recoveryOrderToLaunchPurity && (
        <LaunchPurityModal
          isOpen={isLaunchPurityModalOpen}
          onOpenChange={setIsLaunchPurityModalOpen}
          recoveryOrder={recoveryOrderToLaunchPurity}
          onSuccess={handleModalSuccess}
        />
      )}
      {recoveryOrderToEdit && (
        <EditRecoveryOrderModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          recoveryOrder={recoveryOrderToEdit as any}
          onSuccess={onRecoveryOrderUpdated}
        />
      )}
    </>
  );
}