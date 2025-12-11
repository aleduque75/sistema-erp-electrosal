"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Transacao } from "@/lib/types"; // Assuming a shared types file

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value
  );

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });

export const columns: ColumnDef<Transacao>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "dataHora",
    header: "Data",
    cell: ({ row }) => formatDate(row.getValue("dataHora")),
  },
  {
    accessorKey: "descricao",
    header: "Descrição",
  },
  {
    accessorKey: "valor",
    header: () => <div className="text-right">Valor</div>,
    cell: ({ row }) => {
      const valor = parseFloat(row.getValue("valor"));
      const tipo = row.original.tipo;
      const formatted = formatCurrency(valor);

      return (
        <div className={`text-right font-medium ${tipo === 'CREDITO' ? 'text-green-600' : 'text-red-600'}`}>
          {tipo === 'DEBITO' && '- '}
          {formatted}
        </div>
      );
    },
  },
  {
    accessorKey: "goldAmount",
    header: () => <div className="text-right">Valor em Au (g)</div>,
    cell: ({ row }) => {
      const goldAmount = row.original.goldAmount;
      if (goldAmount === null || goldAmount === undefined) {
        return <div className="text-right text-muted-foreground">N/A</div>;
      }
      return <div className="text-right">{parseFloat(String(goldAmount)).toFixed(4)}</div>;
    },
  },
  {
    accessorKey: "contaContabil.nome",
    header: "Categoria Atual",
    cell: ({ row }) => {
        const conta = row.original.contaContabil;
        return conta ? `${conta.codigo} - ${conta.nome}` : <span className="text-muted-foreground">N/A</span>;
    }
  },
];
