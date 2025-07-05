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
import { toast } from "sonner"; // Usando toast para feedback, como na página de importação

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
}

export default function ProductsPage() {
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);

  // O estado de erro agora pode ser tratado pelos toasts, mas mantemos se preferir
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      fetchProducts();
    }
  }, [user, loading]);

  const fetchProducts = async () => {
    try {
      // 1. A chamada da API está mais limpa. O interceptor cuida do token e do prefixo /api.
      const response = await api.get("/products");
      setProducts(
        response.data.map((product: any) => ({
          ...product,
          price: parseFloat(product.price),
        }))
      );
    } catch (err: any) {
      // 2. Tratamento de erro aprimorado para mostrar a mensagem do backend.
      const errorMessage =
        err.response?.data?.message || "Falha ao buscar produtos.";
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    // Adiciona uma confirmação antes de deletar, uma boa prática de UX.
    if (!confirm("Tem certeza que deseja remover este produto?")) {
      return;
    }

    try {
      // A chamada da API também está mais limpa aqui.
      await api.delete(`/products/${id}`);
      toast.success("Produto removido com sucesso!");

      // 3. Recarrega a lista do servidor para garantir consistência.
      fetchProducts();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Falha ao remover o produto.";
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>Please log in to view products.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex space-x-2">
          <Link href="/products/create">
            <Button>Criar Novo Produto</Button>
          </Link>
          <Link href="/products/import-xml">
            <Button variant="outline">Importar XML</Button>
          </Link>
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <Table className="border border-border">
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>R$ {product.price.toFixed(2)}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <Link href={`/products/${product.id}`} passHref>
                    <Button variant="ghost" size="sm" className="mr-2">
                      Ver
                    </Button>
                  </Link>
                  <Link href={`/products/${product.id}/edit`} passHref>
                    <Button variant="ghost" size="sm" className="mr-2">
                      Editar
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                  >
                    Deletar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
