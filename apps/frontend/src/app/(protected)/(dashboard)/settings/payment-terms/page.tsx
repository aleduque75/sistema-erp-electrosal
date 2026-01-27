'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { PaymentTermsTable } from './components/PaymentTermsTable';
import { PaymentTermDialog } from './components/PaymentTermDialog';

export interface PaymentTerm {
  id: string;
  name: string;
  description: string | null;
  installmentsDays: number[];
  interestRate: number | null;
}

export default function PaymentTermsPage() {
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPaymentTerm, setSelectedPaymentTerm] = useState<PaymentTerm | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPaymentTerms = async () => {
    setLoading(true);
    try {
      const response = await api.get('/payment-terms');
      setPaymentTerms(response.data);
    } catch (error) {
      toast.error('Falha ao buscar os prazos de pagamento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentTerms();
  }, []);

  const handleSave = () => {
    fetchPaymentTerms();
    setIsDialogOpen(false);
  };

  const handleEdit = (term: PaymentTerm) => {
    setSelectedPaymentTerm(term);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedPaymentTerm(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Prazos de Pagamento</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Novo Prazo
        </Button>
      </div>

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <PaymentTermsTable paymentTerms={paymentTerms} onEdit={handleEdit} />
      )}

      <PaymentTermDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        paymentTerm={selectedPaymentTerm}
      />
    </div>
  );
}
