import { PureMetalLot } from "@/types/pure-metal-lot";

export interface LotSourceTypeInfo {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
  badgeClass?: string;
}

export function getLotSourceTypeInfo(sourceType?: string | null): LotSourceTypeInfo {
  if (!sourceType) {
    return {
      label: "Outros",
      variant: "outline",
      badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
    };
  }

  switch (sourceType.toUpperCase()) {
    case "PAGAMENTO_PEDIDO_CLIENTE":
    case "SALE_PAYMENT":
      return {
        label: "Pagamento de Venda",
        variant: "secondary",
        badgeClass: "bg-emerald-950/80 text-emerald-300 border-emerald-700/60 font-medium",
      };
    case "SUPPLIER_ACCOUNT_TRANSFER":
      return {
        label: "Conta Fornecedor",
        variant: "outline",
        badgeClass: "bg-amber-950/80 text-amber-300 border-amber-700/60 font-medium",
      };
    case "RECOVERY_ORDER":
      return {
        label: "Recuperação",
        variant: "default",
        badgeClass: "bg-blue-950/80 text-blue-300 border-blue-700/60 font-medium",
      };
    case "CHEMICAL_REACTION":
    case "REACTION":
    case "REACTION_LEFTOVER":
      return {
        label: "Reação Química",
        variant: "secondary",
        badgeClass: "bg-purple-950/80 text-purple-300 border-purple-700/60 font-medium",
      };
    case "METAL_CREDIT":
    case "METAL_RECEIVABLE":
      return {
        label: "Crédito de Metal",
        variant: "outline",
        badgeClass: "bg-cyan-950/80 text-cyan-300 border-cyan-700/60 font-medium",
      };
    case "COMPRA":
    case "SUPPLIER_PURCHASE":
    case "PURCHASE_ORDER":
      return {
        label: "Compra",
        variant: "default",
        badgeClass: "bg-green-950/80 text-green-300 border-green-700/60 font-medium",
      };
    case "INITIAL_SETUP":
    case "MIGRATION":
      return {
        label: "Saldo Inicial",
        variant: "outline",
        badgeClass: "bg-zinc-800 text-zinc-300 border-zinc-700",
      };
    default:
      return {
        label: sourceType.replace(/_/g, " "),
        variant: "outline",
        badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
      };
  }
}

export function getLotPartner(lot: {
  sale?: { pessoa?: { name?: string } };
  originDetails?: { name?: string };
  notes?: string | null;
  description?: string | null;
}): string {
  if (lot.sale?.pessoa?.name) {
    return lot.sale.pessoa.name;
  }
  if (lot.originDetails?.name) {
    return lot.originDetails.name;
  }

  const combined = `${lot.description || ""} ${lot.notes || ""}`;
  const clientMatch = combined.match(/Cliente:\s*([^\n\r,-]+)/i);
  if (clientMatch && clientMatch[1]?.trim()) {
    return clientMatch[1].trim();
  }

  const supplierMatch = combined.match(/Conta Fornecedor\s+([^:\n\r-]+)/i);
  if (supplierMatch && supplierMatch[1]?.trim()) {
    return supplierMatch[1].trim();
  }

  return "-";
}

export function getLotDescription(lot: {
  description?: string | null;
  notes?: string | null;
  originDetails?: { name?: string; orderNumber?: string };
}): string {
  if (lot.description && lot.description.trim() !== "") {
    return lot.description.trim();
  }
  if (lot.notes && lot.notes.trim() !== "") {
    return lot.notes.trim();
  }
  if (lot.originDetails?.orderNumber || lot.originDetails?.name) {
    const parts = [];
    if (lot.originDetails.orderNumber) parts.push(`Pedido #${lot.originDetails.orderNumber}`);
    if (lot.originDetails.name) parts.push(lot.originDetails.name);
    return parts.join(" - ");
  }
  return "-";
}

export function getLotIdentifier(lot: { id: string; lotNumber?: string | null }): string {
  if (lot.lotNumber) {
    return `Lote ${lot.lotNumber}`;
  }
  return `#${lot.id.substring(0, 8)}`;
}
