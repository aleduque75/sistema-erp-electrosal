"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { ContaContabilModal } from "./conta-contabil-modal";
import { ContaContabilEditModal } from "./conta-contabil-edit-modal";

interface Conta {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  aceitaLancamento: boolean;
  contaPaiId: string | null;
  subContas?: Conta[];
}

const AccountRow = ({ conta, level = 0, onEdit }: { conta: Conta; level?: number; onEdit: (conta: Conta) => void }) => (
  <>
    <TableRow className={!conta.aceitaLancamento ? "bg-muted/50" : ""}>
      <TableCell style={{ paddingLeft: `${1 + level * 1.5}rem` }}>
        <span className="font-mono text-sm text-muted-foreground">
          {conta.codigo}
        </span>
      </TableCell>
      <TableCell className="font-medium">{conta.nome}</TableCell>
      <TableCell>
        <Badge variant="outline">{conta.tipo}</Badge>
      </TableCell>
      <TableCell>{conta.aceitaLancamento ? "Sim" : "Não"}</TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={() => onEdit(conta)}>
          Editar
        </Button>
      </TableCell>
    </TableRow>
    {conta.subContas
      ?.sort((a, b) => a.codigo.localeCompare(b.codigo))
      .map((subConta) => (
        <AccountRow key={subConta.id} conta={subConta} level={level + 1} onEdit={onEdit} />
      ))}
  </>
);

export default function ContasContabeisPage() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setIsPageLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<Conta | null>(null);

  const fetchContas = async () => {
    setIsPageLoading(true);
    try {
      const response = await api.get("/contas-contabeis");

      const contasMap = new Map<string, Conta>(
        response.data.map((c: Conta) => [c.id, { ...c, subContas: [] } as Conta])
      );
      const tree: Conta[] = [];
      response.data.forEach((c: Conta) => {
        if (c.contaPaiId && contasMap.has(c.contaPaiId)) {
          const parentConta = contasMap.get(c.contaPaiId);
          if (parentConta) {
            if (!parentConta.subContas) {
              parentConta.subContas = [];
            }
            parentConta.subContas.push(contasMap.get(c.id)!);
          }
        } else {
          tree.push(contasMap.get(c.id)!);
        }
      });
      tree.sort((a, b) => a.codigo.localeCompare(b.codigo));
      setContas(tree);
    } catch (err) {
      toast.error("Falha ao carregar o plano de contas.");
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    fetchContas();
  }, []);

  const handleSave = () => {
    setIsModalOpen(false);
    setIsEditModalOpen(false);
    setEditingConta(null);
    fetchContas();
  };

  const handleEdit = (conta: Conta) => {
    setEditingConta(conta);
    setIsEditModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Plano de Contas</CardTitle>
          <ContaContabilModal onSave={handleSave} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Código</TableHead>
                <TableHead>Nome da Conta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Aceita Lançamento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : (
                contas.map((conta) => <AccountRow key={conta.id} conta={conta} onEdit={handleEdit} />)
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editingConta && (
        <ContaContabilEditModal
          conta={editingConta}
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSave={handleSave}
        />
      )}
    </>
  );
}
