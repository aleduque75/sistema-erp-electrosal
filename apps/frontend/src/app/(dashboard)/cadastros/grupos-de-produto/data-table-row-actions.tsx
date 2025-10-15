'use client';

import { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { ProductGroup } from './columns';

interface DataTableRowActionsProps {
  row: Row<ProductGroup>;
  onEdit: (group: ProductGroup) => void;
  onDelete: (groupId: string) => void;
}

export function DataTableRowActions({ row, onEdit, onDelete }: DataTableRowActionsProps) {
  const productGroup = row.original;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(productGroup)}>Editar</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete(productGroup.id)} className="text-red-600">
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
