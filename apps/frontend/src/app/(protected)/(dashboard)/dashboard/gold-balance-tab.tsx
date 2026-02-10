// apps/frontend/src/app/(dashboard)/dashboard/gold-balance-tab.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Coins, Scale, TrendingUp, Warehouse, Truck, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoldBalanceData {
  salesThisMonth: {
    productName: string;
    quantity: number;
    totalAu: number;
    profitAu: number;
  }[];
  balances: {
    caixaBancos: number;
    caixaBancosDetails: { name: string; balanceAu: number; originalBalance: string }[];
    fornecedores: number;
    fornecedoresDetails: { name: string; balanceAu: number; originalBalance: string }[];
    emprestimos: number;
    emprestimosDetails: { name: string; balanceAu: number; originalBalance: string }[];
    clientesAReceber: number;
  };
  stock: {
    products: number;
    productsDetails: {
      productName: string;
      quantity: number;
      unitGoldValue: number;
      totalAu: number;
    }[];
    metals: number;
    metalsDetails: {
      puro: number;
      puroBreakdown: {
        reacao: { cesto: number; destilado: number; geral: number };
        cliente: number;
        recuperacao: number;
        fornecedor: number;
        outros: number;
      };
      prataOriginal: number;
      prataConvertidaAu: number;
      outros: {
        name: string;
        quantity: number;
      }[];
    };
  };
  totalPatrimonioAu: number;
}

const formatGold = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + " g";
};

export function GoldBalanceTab() {
  const [data, setData] = useState<GoldBalanceData | null>(null);
  const [loading, setLoading] = useState(true);

  // ... (fetchData and useEffect remain same) ...
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/dashboard/gold-balance");
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch gold balance data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!data && loading) return <div className="p-8 text-center text-muted-foreground">Carregando balanço em ouro...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Erro ao carregar dados.</div>;

  const { puroBreakdown } = data.stock.metalsDetails;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Resumo Patrimonial */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-500 flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Patrimônio Líquido Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-400">
              {formatGold(data.totalPatrimonioAu)}
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-600 mt-1">
              Consolidado de ativos e passivos em ouro
            </p>
          </CardContent>
        </Card>

        {/* Card Caixa e Bancos Expandido */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Caixa & Bancos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold mb-2 ${data.balances.caixaBancos < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatGold(data.balances.caixaBancos)}
            </div>
            <div className="max-h-[150px] overflow-y-auto space-y-1 pr-1">
                {data.balances.caixaBancosDetails.map((acc, idx) => (
                    <div key={idx} className="flex justify-between text-xs border-b pb-1 last:border-0">
                        <span title={acc.name} className="truncate max-w-[120px]">{acc.name}</span>
                        <span className={acc.balanceAu < 0 ? 'text-red-500' : ''}>{formatGold(acc.balanceAu)}</span>
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Users className="h-4 w-4" />
              Clientes a Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {formatGold(data.balances.clientesAReceber)}
            </div>
            <div className="max-h-[150px] overflow-y-auto space-y-1 pr-1">
                {data.balances.clientesAReceberDetails && data.balances.clientesAReceberDetails.length > 0 ? (
                    data.balances.clientesAReceberDetails.map((client, idx) => (
                        <div key={idx} className="flex justify-between text-xs border-b pb-1 last:border-0">
                            <span title={client.name} className="truncate max-w-[120px]">{client.name}</span>
                            <span className="font-medium">{formatGold(client.balanceAu)}</span>
                        </div>
                    ))
                ) : (
                    <span className="text-xs text-muted-foreground">Nenhum valor a receber.</span>
                )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Estoque Total (Produtos + Metais)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {formatGold(data.stock.products + data.stock.metals)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ... (Vendas e Estoque mantidos iguais) ... */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Vendas do Mês (por Produto)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right">Total (Au)</TableHead>
                  <TableHead className="text-right">Lucro (Au)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.salesThisMonth.length > 0 ? (
                  data.salesThisMonth.map((sale, i) => (
                    <TableRow key={i}>
                      <TableCell>{sale.productName}</TableCell>
                      <TableCell className="text-right">{sale.quantity}</TableCell>
                      <TableCell className="text-right font-medium">{formatGold(sale.totalAu)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">{formatGold(sale.profitAu)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhuma venda registrada este mês.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detalhe do Estoque */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Composição do Estoque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
             <div>
                <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Produtos Acabados</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                      <TableHead className="text-right">Valor (Au)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {data.stock.productsDetails.length > 0 ? (
                        data.stock.productsDetails.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right font-medium">{formatGold(item.totalAu)}</TableCell>
                          </TableRow>
                        ))
                     ) : (
                        <TableRow>
                           <TableCell colSpan={3} className="text-center text-muted-foreground text-sm">Sem produtos em estoque.</TableCell>
                        </TableRow>
                     )}
                  </TableBody>
                </Table>
             </div>

             <div>
                <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Metais e Processos</h4>
                 <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                        <span>Ouro Puro (Lotes)</span>
                        <span className="font-bold">{formatGold(data.stock.metalsDetails.puro)}</span>
                    </div>
                    
                    {/* Detalhamento da Origem do Ouro */}
                    <div className="pl-4 space-y-1 text-sm border-l-2 border-muted">
                        {puroBreakdown.reacao.cesto > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                                <span>Reação (Cesto)</span>
                                <span>{formatGold(puroBreakdown.reacao.cesto)}</span>
                            </div>
                        )}
                        {puroBreakdown.reacao.destilado > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                                <span>Reação (Destilado)</span>
                                <span>{formatGold(puroBreakdown.reacao.destilado)}</span>
                            </div>
                        )}
                        {puroBreakdown.reacao.geral > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                                <span>Reação (Geral)</span>
                                <span>{formatGold(puroBreakdown.reacao.geral)}</span>
                            </div>
                        )}
                        {puroBreakdown.cliente > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                                <span>Pagamento Cliente</span>
                                <span>{formatGold(puroBreakdown.cliente)}</span>
                            </div>
                        )}
                        {puroBreakdown.recuperacao > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                                <span>Recuperação</span>
                                <span>{formatGold(puroBreakdown.recuperacao)}</span>
                            </div>
                        )}
                        {puroBreakdown.fornecedor > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                                <span>Fornecedor de Metal</span>
                                <span>{formatGold(puroBreakdown.fornecedor)}</span>
                            </div>
                        )}
                        {puroBreakdown.outros > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                                <span>Outros</span>
                                <span>{formatGold(puroBreakdown.outros)}</span>
                            </div>
                        )}
                    </div>

                    {data.stock.metalsDetails.prataConvertidaAu > 0 && (
                        <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span className="flex flex-col">
                                <span>Prata (Convertida em Au)</span>
                                <span className="text-xs text-muted-foreground font-normal">
                                    Original: {formatGold(data.stock.metalsDetails.prataOriginal).replace(' g', ' g Ag')}
                                </span>
                            </span>
                            <span className="font-bold">{formatGold(data.stock.metalsDetails.prataConvertidaAu)}</span>
                        </div>
                    )}
                    {data.stock.metalsDetails.outros.map((m, i) => (
                        <div key={i} className="flex justify-between items-center p-2 border-b text-sm">
                           <span>{m.name}</span>
                           <span className="text-muted-foreground">{m.quantity} un/g</span>
                        </div>
                    ))}
                 </div>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <Card className="border-red-100 dark:border-red-900/30">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600 dark:text-red-400">
                  <Truck className="h-4 w-4" />
                  Passivo: Fornecedores de Metal
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-xl font-bold text-red-600 mb-2">
                  {formatGold(data.balances.fornecedores)}
               </div>
               <div className="space-y-1">
                    {data.balances.fornecedoresDetails.map((acc, idx) => (
                        <div key={idx} className="flex justify-between text-sm border-b border-red-200 dark:border-red-800 pb-1 last:border-0">
                            <span title={acc.name} className="truncate">{acc.name}</span>
                            <span className="font-medium">{formatGold(acc.balanceAu)}</span>
                        </div>
                    ))}
               </div>
            </CardContent>
         </Card>

         <Card className="border-orange-100 dark:border-orange-900/30">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <Scale className="h-4 w-4" />
                  Passivo: Empréstimos
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-xl font-bold text-orange-600 mb-2">
                  {formatGold(data.balances.emprestimos)}
               </div>
               <div className="space-y-1">
                    {data.balances.emprestimosDetails.map((acc, idx) => (
                        <div key={idx} className="flex justify-between text-sm border-b border-orange-200 dark:border-orange-800 pb-1 last:border-0">
                            <span title={acc.name} className="truncate">{acc.name}</span>
                            <span className="font-medium">{formatGold(acc.balanceAu)}</span>
                        </div>
                    ))}
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}