"use client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const formatCurrencyForChart = (value: number) =>
  `R$${(value / 1000).toFixed(0)}k`;

type CashFlowChartData = {
  month: string;
  incomes: number;
  expenses: number;
};

export function CashFlowChart({ data }: { data: CashFlowChartData[] }) {
  return (
    <Card className="border border-border/80 shadow-sm overflow-hidden h-full flex flex-col">
      <CardHeader className="p-4 sm:p-6 pb-2">
        <CardTitle className="text-base sm:text-lg font-bold">Fluxo de Caixa</CardTitle>
        <CardDescription className="text-xs">
          Entradas vs. Saídas nos últimos 6 meses.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 sm:p-6 pt-0 flex-1">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 12, left: 16, bottom: 6 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              width={65}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={formatCurrencyForChart}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted)/0.3)" }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-card/95 backdrop-blur-md border border-border shadow-xl p-3 rounded-xl space-y-1.5 min-w-[170px] text-xs">
                      <p className="font-bold text-foreground border-b border-border/50 pb-1">{label}</p>
                      {payload.map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.fill }} />
                            {p.name}:
                          </span>
                          <span className="font-bold text-foreground font-mono">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(p.value) || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            <Bar
              dataKey="incomes"
              name="Entradas"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              maxBarSize={45}
            />
            <Bar
              dataKey="expenses"
              name="Saídas"
              fill="#f43f5e"
              radius={[6, 6, 0, 0]}
              maxBarSize={45}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
