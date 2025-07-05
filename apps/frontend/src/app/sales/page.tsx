// apps/frontend/src/app/sales/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import api from "../../lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Importe o componente Input

import { Eye, Trash2, PlusCircle, Search } from "lucide-react";
import { toast } from "sonner";

interface Sale {
  id: string;
  client: { name: string };
  totalAmount: number;
  saleDate: string;
  paymentMethod: string;
}

export default function SalesPage() {
  const { user, loading } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingSales, setIsFetchingSales] = useState(true);

  // NOVO ESTADO: valor do input (atualizado instantaneamente)
  const [inputValue, setInputValue] = useState("");
  // ESTADO DA PESQUISA: só é atualizado após o debounce
  const [searchTerm, setSearchTerm] = useState("");

  // useEffect para debounce do termo de pesquisa
  useEffect(() => {
    // Define um temporizador que só atualiza 'searchTerm' após um atraso (ex: 500ms)
    const delayDebounceFn = setTimeout(() => {
      setSearchTerm(inputValue); // Atualiza o termo de pesquisa real
    }, 800); // 500ms de atraso

    // Cleanup function: limpa o temporizador se o 'inputValue' mudar antes do atraso
    return () => clearTimeout(delayDebounceFn);
  }, [inputValue]); // Este useEffect roda sempre que 'inputValue' muda

  // useEffect existente para buscar vendas, agora depende de 'searchTerm'
  useEffect(() => {
    if (!loading && user) {
      fetchSales(searchTerm); // fetchSales é acionado quando 'searchTerm' muda (após debounce)
    }
  }, [user, loading, searchTerm]); // Adicionado searchTerm como dependência

  const fetchSales = async (term: string = "") => {
    setIsFetchingSales(true);
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setError(
        "Token de acesso não encontrado. Por favor, faça login novamente."
      );
      setIsFetchingSales(false);
      return;
    }

    try {
      const response = await api.get("/sales", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          search: term,
        },
      });
      setSales(
        response.data.map((sale: any) => ({
          ...sale,
          totalAmount: parseFloat(sale.totalAmount.toString()),
        }))
      );
      setError(null);
    } catch (err: any) {
      console.error("Erro ao carregar vendas:", err);
      const errorMessage =
        err.response?.data?.message || "Não foi possível carregar as vendas.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsFetchingSales(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value === undefined || value === null) {
      return "R$ 0,00";
    }
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("pt-BR");
    } catch (e) {
      console.error("Erro ao formatar data:", dateString, e);
      return dateString;
    }
  };

  const handleDeleteSale = async (id: string) => {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir esta venda? Esta ação é irreversível."
    );
    if (!confirmDelete) return;

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Token de acesso não encontrado. Faça login novamente.");
      return;
    }

    try {
      await api.delete(`/sales/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      toast.success("Venda excluída com sucesso!");
      fetchSales(searchTerm); // Recarrega a lista com o termo de pesquisa atual
    } catch (err: any) {
      console.error("Erro ao excluir venda:", err);
      const errorMessage =
        err.response?.data?.message || "Não foi possível excluir a venda.";
      toast.error(errorMessage);
    }
  };

  if (loading || isFetchingSales) {
    return <p className="text-center text-lg mt-10">Carregando vendas...</p>;
  }

  if (!user) {
    return (
      <p className="text-center text-lg mt-10 text-red-500">
        Por favor, faça login para visualizar as vendas.
      </p>
    );
  }

  return (
    <Card
      className="
        mx-auto my-8 p-6 shadow-lg rounded-lg
        bg-fuchsia-200/60 dark:bg-gray-900
        text-gray-900 dark:text-gray-50
      "
    >
      <CardHeader
        className="
      flex flex-col md:flex-row justify-between items-start md:items-center mb-4"
      >
        <CardTitle className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Listagem de Vendas
        </CardTitle>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          {/* Campo de Pesquisa */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <Input
              type="text"
              placeholder="Pesquisar por cliente..."
              value={inputValue} // O input agora usa 'inputValue'
              onChange={(e) => setInputValue(e.target.value)} // Atualiza 'inputValue' instantaneamente
              className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <Link href="/sales/create">
            <Button className="flex items-center gap-2 px-6 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 w-full md:w-auto">
              <PlusCircle className="w-5 h-5" /> Criar Nova Venda
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        {sales.length === 0 && !error ? (
          <p className="text-center text-gray-600 text-lg mt-8 dark:text-gray-400">
            Nenhuma venda encontrada. Que tal{" "}
            <Link
              href="/sales/create"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              criar uma agora
            </Link>
            ?
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table
              className="
            min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg"
            >
              <TableHeader className="bg-fuchsia-200/50 dark:bg-gray-800">
                <TableRow>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-300">
                    Cliente
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-300">
                    Valor Total
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-300">
                    Data da Venda
                  </TableHead>
                  <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-300">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-transparent divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {sales.map((sale) => (
                  <TableRow
                    key={sale.id}
                    className="hover:bg-gray-50/50 transition-colors duration-150 dark:hover:bg-gray-800"
                  >
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {sale.client.name}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold dark:text-gray-200">
                      {formatCurrency(sale.totalAmount)}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(sale.saleDate)}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-center items-center space-x-2">
                        <Link href={`/sales/${sale.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                          >
                            <Eye className="w-5 h-5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                          onClick={() => handleDeleteSale(sale.id)}
                          aria-label={`Excluir venda de ${sale.client.name}`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
