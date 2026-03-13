import { Card, CardContent } from "@/components/ui/card";
import { Activity, Users, Clock, TrendingUp } from "lucide-react";

interface KpiCardsProps {
  totalEvents: number;
  events7d: number;
  uniqueActors: number;
  lastIngestedAt: string | null;
}

export function KpiCards({ totalEvents, events7d, uniqueActors, lastIngestedAt }: KpiCardsProps) {
  const cards = [
    {
      label: "총 이벤트",
      value: totalEvents.toLocaleString(),
      icon: Activity,
    },
    {
      label: "이벤트 (7일)",
      value: events7d.toLocaleString(),
      icon: TrendingUp,
    },
    {
      label: "고유 액터",
      value: uniqueActors.toLocaleString(),
      icon: Users,
    },
    {
      label: "마지막 수집",
      value: lastIngestedAt ? new Date(lastIngestedAt).toLocaleString() : "—",
      icon: Clock,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
