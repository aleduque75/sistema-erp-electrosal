import { Badge } from "@/components/ui/badge";
import { RecoveryOrderStatus } from '@/types/recovery-order';

interface Props {
  status: RecoveryOrderStatus;
}

const statusMap: Record<RecoveryOrderStatus, { label: string; className: string }> = {
  [RecoveryOrderStatus.PENDENTE]: {
    label: "Pendente",
    className: "bg-yellow-400",
  },
  [RecoveryOrderStatus.EM_ANDAMENTO]: {
    label: "Em Andamento",
    className: "bg-blue-500",
  },
  [RecoveryOrderStatus.AGUARDANDO_TEOR]: {
    label: "Aguardando Teor",
    className: "bg-orange-500",
  },
  [RecoveryOrderStatus.FINALIZADA]: {
    label: "Finalizada",
    className: "bg-green-500",
  },
  [RecoveryOrderStatus.CANCELADA]: {
    label: "Cancelada",
    className: "bg-red-500",
  },
};

export function RecoveryOrderStatusBadge({ status }: Props) {
  const statusInfo = statusMap[status];

  if (!statusInfo) {
    return <Badge className="bg-gray-200 text-gray-700">?</Badge>;
  }

  // Renderiza apenas um círculo colorido sem texto
  return <div title={statusInfo.label} className={`h-4 w-4 rounded-full ${statusInfo.className}`} />;
}
