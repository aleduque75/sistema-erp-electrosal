'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableRowActions } from './data-table-row-actions';
import { Badge } from '@/components/ui/badge';

export type ProductGroup = {
  id: string;
  name: string;
  description: string | null;
  isReactionProductGroup: boolean;
  adjustmentCalcMethod: 'QUANTITY_BASED' | 'COST_BASED';
};

export const columns: ColumnDef<ProductGroup>[] = [
  {
    accessorKey: 'name',
    header: 'Nome',
  },
  {
    accessorKey: 'description',
    header: 'Descrição',
  },
  {
    accessorKey: 'adjustmentCalcMethod',
    header: 'Método de Cálculo',
    cell: ({ row }) => {
      const method = row.original.adjustmentCalcMethod;
      const variant = method === 'COST_BASED' ? 'destructive' : 'secondary';
      return <Badge variant={variant}>{method.replace('_', ' ')}</Badge>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
