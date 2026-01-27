// apps/frontend/src/app/contas-contabeis/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Importe o FormCombobox se estiver usando para outras seleções dinâmicas
import { FormCombobox } from "@/components/ui/FormCombobox";

interface ContaContabil {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  aceitaLancamento: boolean;
  contaPaiId?: string | null; // Adicionado para lidar com a seleção da conta pai
}

export default function CreateContaContabilPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [aceitaLancamento, setAceitaLancamento] = useState(true);
  const [contaPaiId, setContaPaiId] = useState<string | null>(null); // Estado para a conta pai
  const [contasPai, setContasPai] = useState<ContaContabil[]>([]); // Para listar opções de conta pai

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setIsPageLoading] = useState(true); // Controla o carregamento inicial da página

  // Fetch das contas pai existentes e dados iniciais
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else {
        const loadPageData = async () => {
          try {
            await fetchContasPai();
          } catch (error) {
            toast.error("Erro ao carregar dados da página de criação.");
            console.error("Erro ao carregar dados da página:", error);
          } finally {
            setIsPageLoading(false);
          }
        };
        loadPageData();
      }
    }
  }, [user, isLoading, router]);

  const fetchContasPai = async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;

    try {
      const response = await api.get("/contas-contabeis", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      // Filtrar para não permitir que uma conta seja pai dela mesma ou de seus descendentes
      setContasPai(
        response.data.filter(
          (conta: ContaContabil) => conta.aceitaLancamento === true
        )
      ); // Exemplo de filtro
    } catch (err: any) {
      console.error("Erro ao carregar contas pai:", err);
      throw err; // Propaga para o Promise.all no useEffect
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Por favor, faça login para criar a conta contábil.");
      return;
    }
    if (isSubmitting) return;

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Token de acesso não encontrado.");
      return;
    }

    // Validações básicas
    if (!codigo) {
      toast.error("O código é obrigatório.");
      return;
    }
    if (!nome) {
      toast.error("O nome é obrigatório.");
      return;
    }
    if (!tipo) {
      toast.error("O tipo é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(
        "/contas-contabeis",
        {
          codigo,
          nome,
          tipo,
          aceitaLancamento,
          contaPaiId: contaPaiId || null, // Envia null se não houver conta pai selecionada
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      toast.success("Conta Contábil criada com sucesso!");
      router.push("/contas-contabeis"); // Redireciona para a lista de contas contábeis
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "Ocorreu um erro ao criar a conta contábil.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderização condicional para carregamento ou autenticação
  if (isLoading || loading) {
    return (
      <p className="text-center text-lg mt-10">Carregando formulário...</p>
    );
  }

  if (!user) {
    return (
      <p className="text-center text-lg mt-10 text-red-500">
        Por favor, faça login para criar contas contábeis.
      </p>
    );
  }

  return (
    <Card className="mx-auto my-8 p-6 shadow-lg rounded-lg max-w-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Criar Nova Conta Contábil
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="w-full">
          {/* Campo Código */}
          <div className="mb-4">
            <Label htmlFor="codigo">Código:</Label>
            <Input
              id="codigo"
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              required
              className="w-full"
            />
          </div>

          {/* Campo Nome */}
          <div className="mb-4">
            <Label htmlFor="nome">Nome:</Label>
            <Input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full"
            />
          </div>

          {/* Campo Tipo */}
          <div className="mb-4">
            <Label htmlFor="tipo">Tipo:</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ATIVO">Ativo</SelectItem>
                <SelectItem value="PASSIVO">Passivo</SelectItem>
                <SelectItem value="PATRIMONIO_LIQUIDO">
                  Patrimônio Líquido
                </SelectItem>
                <SelectItem value="RECEITA">Receita</SelectItem>
                <SelectItem value="DESPESA">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campo Aceita Lançamento */}
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="aceitaLancamento"
              checked={aceitaLancamento}
              onChange={(e) => setAceitaLancamento(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600 rounded"
            />
            <Label htmlFor="aceitaLancamento">Aceita Lançamento Direto</Label>
          </div>

          {/* Campo Conta Pai */}
          <div className="mb-4">
            <Label htmlFor="contaPai">Conta Pai:</Label>
            <Select
              value={contaPaiId || ""} // Usar '' para o placeholder se contaPaiId for null
              onValueChange={setContaPaiId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma conta pai (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {/* CORRIGIDO AQUI: value="" */}
                <SelectItem value="">Nenhuma</SelectItem>
                {contasPai.map((conta) => (
                  <SelectItem key={conta.id} value={conta.id}>
                    {conta.nome} ({conta.codigo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Link href="/contas-contabeis">
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Conta Contábil"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
