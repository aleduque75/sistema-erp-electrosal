import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RecoveryOrder } from "@/types/recovery-order";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

interface ViewRecoveryOrderModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recoveryOrder: RecoveryOrder | null;
}

const DetailItem = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div className="grid grid-cols-2 gap-2 py-2 border-b">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className="text-sm font-semibold">{value ?? 'N/A'}</p>
  </div>
);

export function ViewRecoveryOrderModal({
  isOpen,
  onOpenChange,
  recoveryOrder,
}: ViewRecoveryOrderModalProps) {
  if (!recoveryOrder) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalhes da Ordem de Recuperação</DialogTitle>
          <DialogDescription>ID: {recoveryOrder.id}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Informações Gerais</h4>
            <DetailItem label="Status" value={recoveryOrder.status} />
            <DetailItem label="Data de Início" value={format(new Date(recoveryOrder.dataInicio), 'dd/MM/yyyy HH:mm')} />
            <DetailItem label="Data de Fim" value={recoveryOrder.dataFim ? format(new Date(recoveryOrder.dataFim), 'dd/MM/yyyy HH:mm') : 'N/A'} />
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Valores (em gramas)</h4>
            <DetailItem label="Qtd. Total Estimada" value={`${(recoveryOrder.totalBrutoEstimadoGramas || 0).toFixed(2)}g`} />
            <DetailItem label="Resultado do Processamento" value={recoveryOrder.resultadoProcessamentoGramas ? `${recoveryOrder.resultadoProcessamentoGramas.toFixed(2)}g` : 'N/A'} />
            <DetailItem label="Teor Final Aplicado" value={recoveryOrder.teorFinal ? `${(recoveryOrder.teorFinal * 100).toFixed(2)}%` : 'N/A'} />
            <DetailItem label="Au Puro Recuperado" value={recoveryOrder.auPuroRecuperadoGramas ? `${recoveryOrder.auPuroRecuperadoGramas.toFixed(2)}g` : 'N/A'} />
            <DetailItem label="Resíduo Gerado" value={recoveryOrder.residuoGramas ? `${recoveryOrder.residuoGramas.toFixed(2)}g` : 'N/A'} />
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Análises Químicas Envolvidas</h4>
            <div className="flex flex-wrap gap-2 pt-2">
              {recoveryOrder.chemicalAnalysisIds.map(id => (
                <Badge key={id} variant="secondary">{id}</Badge>
              ))}
            </div>
          </div>

          {recoveryOrder.residueAnalysisId && (
            <div className="space-y-2">
              <h4 className="font-semibold">Análise de Resíduo Gerada</h4>
              <DetailItem label="ID da Análise de Resíduo" value={recoveryOrder.residueAnalysisId} />
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
