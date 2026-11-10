import type { Kpi } from "@/lib/store";
import { daysBetween, dayShort } from "@/lib/time";

export default function KpiTag({ k, today, value }: { k: Kpi; today: string; value: number }) {
  if (k.period !== "deadline" || !k.deadline) {
    return <span className="tag">{k.period === "weekly" ? "mingguan" : "bulanan"}</span>;
  }
  const left = daysBetween(today, k.deadline);
  const done = value >= k.target;
  const text = done ? "tercapai" : left < 0 ? `lewat ${-left} hari` : left === 0 ? "deadline hari ini" : `${left} hari lagi`;
  const cls = done ? "tag ok" : left < 0 ? "tag late" : left <= 3 ? "tag soon" : "tag";
  return <span className={cls}>{dayShort(k.deadline)} · {text}</span>;
}
