"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ForecastData {
  month: string;
  total: number;
}

export function CreditCardForecastChart() {
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        const response = await api.get<ForecastData[]>("/credit-card-forecast");
        setForecast(response.data);
      } catch (error) {
        console.error("Erro ao buscar previsão de cartão de crédito:", error);
        toast.error("Falha ao carregar previsão de cartão de crédito.");
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, []);

  if (isLoading) {
    return (
      <Card className="col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Previsão de Lançamentos no Cartão</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p>Carregando previsão...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle>Previsão de Lançamentos no Cartão</CardTitle>
      </CardHeader>
      <CardContent>
        {forecast.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={forecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
              <Legend />
              <Bar dataKey="total" fill="#8884d8" name="Total Previsto" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground">Nenhuma previsão disponível para os próximos 6 meses.</p>
        )}
      </CardContent>
    </Card>
  );
}
