"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
// 1. Importe o novo componente Combobox que criamos
import { ProductCombobox } from "../../../components/ProductCombobox";

// --- Interfaces para tipar os dados ---
interface Product {
  id: string;
  name: string;
}
interface AnalyzedProduct {
  xmlName: string;
  xmlPrice: number;
  xmlStock: number;
  status: "MATCHED" | "NEW";
  matchedProductId?: string;
}
interface AnalyzedData {
  products: AnalyzedProduct[];
  nfeKey: string;
}

export default function ImportXmlPage() {
  const router = useRouter();
  const { user } = useAuth();

  // --- Estados do Componente ---
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [xmlContent, setXmlContent] = useState<string | null>(null);
  const [analyzedData, setAnalyzedData] = useState<AnalyzedData | null>(null);
  const [manualMatches, setManualMatches] = useState<{
    [xmlName: string]: string;
  }>({});
  const [existingProducts, setExistingProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carrega todos os produtos existentes para usar no Combobox
  useEffect(() => {
    if (user) {
      api.get("/products").then((response) => {
        setExistingProducts(response.data);
      });
    }
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setXmlFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setXmlContent(e.target?.result as string);
      reader.readAsText(file);
      setAnalyzedData(null);
      setManualMatches({});
    }
  };

  const handleAnalyze = async () => {
    if (!xmlContent) return toast.error("Por favor, selecione um arquivo XML.");
    setIsSubmitting(true);
    try {
      const response = await api.post("/products/import-xml/analyze", {
        xmlContent,
      });
      setAnalyzedData(response.data);
      toast.success(
        "XML analisado com sucesso. Associe os produtos novos se necessário."
      );
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erro ao analisar o XML.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMatchChange = (xmlName: string, existingProductId: string) => {
    setManualMatches((prev) => ({ ...prev, [xmlName]: existingProductId }));
  };

  const handleConfirmImport = async () => {
    if (!xmlContent) return toast.error("Não há dados para importar.");
    setIsSubmitting(true);
    try {
      await api.post("/products/import-xml", { xmlContent, manualMatches });
      toast.success("Produtos e contas a pagar importados com sucesso!");
      router.push("/products");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erro ao importar os dados.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar NF-e (Produtos e Contas a Pagar)</CardTitle>
      </CardHeader>
      <CardContent>
        {!analyzedData ? (
          <div className="w-full max-w-lg">
            <div className="mb-4">
              <Label htmlFor="xmlFile">Arquivo XML da NF-e</Label>
              <Input
                id="xmlFile"
                type="file"
                accept=".xml"
                onChange={handleFileChange}
              />
            </div>
            <Button onClick={handleAnalyze} disabled={isSubmitting || !xmlFile}>
              {isSubmitting ? "Analisando..." : "Analisar XML"}
            </Button>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-2">
              Análise do XML - Chave: {analyzedData.nfeKey}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Revise os produtos encontrados. Para produtos "NOVOS", você pode
              associá-los a um produto já existente ou deixar em branco para
              criá-los.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto no XML</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Associar a Produto Existente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyzedData.products.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div>{p.xmlName}</div>
                      <div className="text-xs text-gray-500">
                        Preço: R$ {p.xmlPrice.toFixed(2)} | Qtd: {p.xmlStock}
                      </div>
                    </TableCell>
                    <TableCell>{p.status}</TableCell>
                    <TableCell>
                      {p.status === "NEW" && (
                        // 2. AQUI ESTÁ A MUDANÇA: Usamos o ProductCombobox no lugar do Select
                        <ProductCombobox
                          products={existingProducts}
                          onProductSelect={(selectedId) =>
                            handleMatchChange(p.xmlName, selectedId)
                          }
                        />
                      )}
                      {p.status === "MATCHED" && (
                        <span className="text-gray-500 italic">
                          Correspondência automática
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-6 flex space-x-2">
              <Button onClick={handleConfirmImport} disabled={isSubmitting}>
                {isSubmitting ? "Importando..." : "Confirmar e Importar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setAnalyzedData(null)}
                disabled={isSubmitting}
              >
                Voltar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
