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
import { Badge } from "@/components/ui/badge";

interface Transacao {
  id: string;
  descricao?: string;
  valor: number;
  moeda: string;
  tipo: 'CREDITO' | 'DEBITO';
  dataHora: string;
  contaContabil: { nome: string; codigo: string };
  contaCorrente?: { nome: string } | null;
}

export default function TransacoesPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransacoes = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/transacoes");
      setTransacoes(response.data);
    } catch (err) {
      toast.error("Falha ao carregar transações.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransacoes();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lançamentos Financeiros</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Conta Contábil</TableHead>
              <TableHead>Conta Corrente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : transacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Nenhum lançamento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              transacoes.map((transacao) => (
                <TableRow key={transacao.id}>
                  <TableCell>{format(new Date(transacao.dataHora), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                  <TableCell>{transacao.descricao || '-'}</TableCell>
                  <TableCell>{transacao.moeda} {transacao.valor.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={transacao.tipo === 'CREDITO' ? 'default' : 'destructive'}>
                      {transacao.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>{`${transacao.contaContabil.codigo} - ${transacao.contaContabil.nome}`}</TableCell>
                  <TableCell>{transacao.contaCorrente?.nome || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
