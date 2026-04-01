import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  trend?: "up" | "down" | "neutral";
  color?: "primary" | "success" | "warning" | "info";
}

const colorMap = {
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  info: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
};

export default function StatCard({ title, value, icon: Icon, description, color = "primary" }: StatCardProps) {
  return (
    <Card className="card-hover border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
