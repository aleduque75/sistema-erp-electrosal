'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

export function DataFixing() {
  const [salesMovementFile, setSalesMovementFile] = useState<File | null>(null);
  const [isProcessingSheet, setIsProcessingSheet] = useState(false);
  const [isDoingFullMaintenance, setIsDoingFullMaintenance] = useState(false);
  const [isExportingSeedData, setIsExportingSeedData] = useState(false);
  const [tecgalvanoGrams, setTecgalvanoGrams] = useState<number | ''>(0);
  const [isSettingInitialStock, setIsSettingInitialStock] = useState(false);

  const handleProcessSheet = async () => {
    if (!salesMovementFile) {
      toast.error('Por favor, selecione um arquivo de planilha (CSV).');
      return;
    }
    setIsProcessingSheet(true);
    const formData = new FormData();
    formData.append('file', salesMovementFile);

    const promise = api.post('/sales-movement-import/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    toast.promise(promise, {
      loading:
        'Processando planilha de movimentação... Isso pode levar alguns minutos.',
      success: (response) => response.data.message,
      error: (err) =>
        err.response?.data?.message || 'Falha ao processar a planilha.',
      finally: () => setIsProcessingSheet(false),
    });
  };

  const handleFullMaintenance = async () => {
    setIsDoingFullMaintenance(true);
    const promise = api.post('/data-correction/run-full-maintenance');
    toast.promise(promise, {
      loading: 'Executando manutenção completa... Isso pode levar vários minutos.',
      success: (response) => response.data.message,
      error: (err) =>
        err.response?.data?.message || 'Falha ao executar manutenção.',
      finally: () => setIsDoingFullMaintenance(false),
    });
  };

  const handleExportSeedData = async () => {
    setIsExportingSeedData(true);
    const promise = api.post('/settings/export-seed-data');
    toast.promise(promise, {
      loading: 'Exportando dados de seed...',
      success: (response) =>
        response.message || 'Dados de seed exportados com sucesso!',
      error: (err) =>
        err.response?.data?.message || 'Falha ao exportar dados de seed.',
      finally: () => setIsExportingSeedData(false),
    });
  };

  const handleInitialStockSetup = async () => {
    if (tecgalvanoGrams === '' || tecgalvanoGrams <= 0) {
      toast.error('Por favor, insira uma quantidade válida para Tecgalvano.');
      return;
    }
    setIsSettingInitialStock(true);
    const promise = api.post('/data-correction/initial-stock-setup', { tecgalvanoGrams });
    toast.promise(promise, {
      loading: 'Configurando estoque inicial...',
      success: (response) => response.data.message,
      error: (err) => err.response?.data?.message || 'Falha ao configurar estoque inicial.',
      finally: () => setIsSettingInitialStock(false),
    });
  };

  return (
    <div className="flex flex-wrap gap-8 justify-center items-start">
      <Card className="w-full max-w-lg border-green-500">
        <CardHeader>
          <CardTitle className="text-green-700">
            Processar Planilha de Movimentação
          </CardTitle>
          <CardDescription>
            Faça o upload da sua planilha (em formato CSV) para criar lotes,
            dar baixa em estoque e conciliar as vendas e contas a receber de
            forma automática.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sales-movement-sheet">Planilha (.csv)</Label>
            <Input
              id="sales-movement-sheet"
              type="file"
              accept=".csv"
              onChange={(e) =>
                setSalesMovementFile(e.target.files ? e.target.files[0] : null)
              }
            />
          </div>
          <Button
            onClick={handleProcessSheet}
            disabled={isProcessingSheet}
            className="w-full"
          >
            {isProcessingSheet ? 'Processando...' : 'Processar Planilha'}
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-lg border-indigo-500">
        <CardHeader>
          <CardTitle className="text-indigo-700">
            Manutenção Completa de Dados
          </CardTitle>
          <CardDescription>
            Use este botão após uma importação ou mudança de regra. Ele executa
            todos os passos necessários para corrigir os dados financeiros de
            vendas legadas e recalcular todos os ajustes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleFullMaintenance}
            disabled={isDoingFullMaintenance}
            className="w-full"
          >
            {isDoingFullMaintenance
              ? 'Executando Manutenção...'
              : 'Executar Manutenção Completa'}
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-lg border-gray-400">
        <CardHeader>
          <CardTitle className="text-gray-600">Utilitários</CardTitle>
          <CardDescription>
            Ações de desenvolvimento para preparação de ambiente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div>
              <Label htmlFor="tecgalvano-grams">Tecgalvano (gramas)</Label>
              <Input
                id="tecgalvano-grams"
                type="number"
                value={tecgalvanoGrams}
                onChange={(e) => setTecgalvanoGrams(Number(e.target.value))}
                placeholder="Quantidade em gramas"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleInitialStockSetup}
              disabled={isSettingInitialStock}
              className="w-full"
            >
              {isSettingInitialStock ? 'Configurando...' : 'Configurar Estoque Inicial'}
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={handleExportSeedData}
            disabled={isExportingSeedData}
            className="w-full"
          >
            {isExportingSeedData ? 'Exportando...' : 'Exportar Dados de Seed'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}