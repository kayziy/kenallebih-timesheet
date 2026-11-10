export default function KpiBar({ value, target }: { value: number; target: number }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return <div className={value > target ? "bar over" : "bar"}><i style={{ width: pct + "%" }} /></div>;
}
