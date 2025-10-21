"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NovaQuotationModal } from "@/components/quotations/NovaQuotationModal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Quotation {
  id: string;
  metal: string;
  date: string;
  buyPrice: number;
  sellPrice: number;
  tipoPagamento?: string;
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const fetchQuotations = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await api.get(`/quotations?${params.toString()}`);
      const quotationsWithNumbers = response.data.map((q: Quotation) => ({
        ...q,
        buyPrice: Number(q.buyPrice),
        sellPrice: Number(q.sellPrice),
      }));
      setQuotations(quotationsWithNumbers);
    } catch (error) {
      console.error("Erro ao buscar cotações:", error);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleFilter = () => {
    fetchQuotations();
  }

  const handleSaveSuccess = () => {
    fetchQuotations();
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Cotações</CardTitle>
            <CardDescription>
              Gerencie as cotações de metais preciosos.
            </CardDescription>
          </div>
          <NovaQuotationModal onSaveSuccess={handleSaveSuccess} />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div>
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="end-date">Data Final</Label>
              <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <Button onClick={handleFilter}>Filtrar</Button>
          </div>
          {quotations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metal</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor Compra</TableHead>
                  <TableHead>Valor Venda</TableHead>
                  <TableHead>Tipo Pagamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell>{quotation.metal}</TableCell>
                    <TableCell>
                      {new Date(quotation.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{quotation.buyPrice.toFixed(2)}</TableCell>
                    <TableCell>{quotation.sellPrice.toFixed(2)}</TableCell>
                    <TableCell>{quotation.tipoPagamento || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              console.log("Editar cotação:", quotation.id)
                            }
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              console.log("Excluir cotação:", quotation.id)
                            }
                          >
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-500">
              Nenhuma cotação encontrada.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}