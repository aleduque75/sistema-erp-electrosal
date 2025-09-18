"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NovaCotacaoModal } from "@/components/cotacoes/NovaCotacaoModal";

interface Cotacao {
  id: string;
  metal: string;
  data: string;
  valorCompra: number;
  valorVenda: number;
  tipoPagamento?: string;
}

export default function CotacoesPage() {
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCotacoes = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/cotacoes");
      setCotacoes(response.data);
    } catch (err) {
      toast.error("Falha ao carregar cotações.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCotacoes();
  }, []);

  const handleSave = () => {
    fetchCotacoes(); // Recarrega a lista após salvar uma nova cotação
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Cotações Diárias</CardTitle>
        <NovaCotacaoModal onSave={handleSave} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metal</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Valor Compra (R$)</TableHead>
              <TableHead>Valor Venda (R$)</TableHead>
              <TableHead>Tipo Pagamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : cotacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Nenhuma cotação cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              cotacoes.map((cotacao) => (
                <TableRow key={cotacao.id}>
                  <TableCell>{cotacao.metal}</TableCell>
                  <TableCell>{format(new Date(cotacao.data), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                  <TableCell>{parseFloat(cotacao.valorCompra.toString()).toFixed(2)}</TableCell>
                  <TableCell>{parseFloat(cotacao.valorVenda.toString()).toFixed(2)}</TableCell>
                  <TableCell>{cotacao.tipoPagamento || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
