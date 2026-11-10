import { requireMember } from "@/lib/auth";
import { hoursBetween, kpiProgress, monthRange, read, weekRange } from "@/lib/store";
import { addDays, dayShort, fmtDateLong, fmtHours, wibDate, weekdayShort } from "@/lib/time";
import KpiBar from "@/components/KpiBar";
import KpiTag from "@/components/KpiTag";
import Linkify from "@/components/Linkify";
import Top from "@/components/Top";

export const dynamic = "force-dynamic";

const LABEL = { todo: "Belum", doing: "Proses", done: "Beres" } as const;

export default async function Overview() {
  const me = await requireMember();
  const db = await read();
  const today = wibDate();
  const [w0, w1] = weekRange(today);
  const [m0, m1] = monthRange(today);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(w0, i));

  return (
    <main className="wrap wide">
      <Top me={me} active="overview" />
      <h1 style={{ marginBottom: 12 }}>Overview · {fmtDateLong(today)}</h1>

      <div className="grid2">
        {db.members.map((m) => {
          const tasks = db.tasks.filter((t) => t.memberId === m.id && t.date === today).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          const done = tasks.filter((t) => t.status === "done").length;
          const kpis = db.kpis.filter((k) => k.memberId === m.id);
          const recent = db.tasks
            .filter((t) => t.memberId === m.id && t.status === "done" && t.result)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 5);
          return (
            <section className="card" key={m.id}>
              <h2 style={{ fontSize: "1.3rem" }}>{m.name}{m.id === me.id && <span className="tag" style={{ marginLeft: 8 }}>kamu</span>}</h2>

              <div className="stats">
                <div className="stat"><b>{fmtHours(hoursBetween(db, m.id, today, today))}</b><span className="muted">hari ini</span></div>
                <div className="stat"><b>{fmtHours(hoursBetween(db, m.id, w0, w1))}</b><span className="muted">minggu ini</span></div>
                <div className="stat"><b>{fmtHours(hoursBetween(db, m.id, m0, m1))}</b><span className="muted">bulan ini</span></div>
              </div>

              <div className="week">
                {weekDays.map((d) => {
                  const ms = hoursBetween(db, m.id, d, d);
                  return (
                    <div key={d} className={d === today ? "wd today" : "wd"}>
                      <span className="muted">{weekdayShort(d)}</span>
                      <b>{ms ? fmtHours(ms) : "–"}</b>
                    </div>
                  );
                })}
              </div>

              <h3 className="sub">Target</h3>
              {kpis.length === 0 && <p className="muted">Belum ada target.</p>}
              {kpis.map((k) => {
                const v = kpiProgress(db, k, today);
                return (
                  <div className="kpi" key={k.id}>
                    <div className="kpi-head">
                      <span>{k.title} <KpiTag k={k} today={today} value={v} /></span>
                      <span>{v}/{k.target} {k.unit}</span>
                    </div>
                    <KpiBar value={v} target={k.target} />
                  </div>
                );
              })}

              <h3 className="sub">Tugas hari ini {tasks.length > 0 && <span className="tag">{done}/{tasks.length} beres</span>}</h3>
              {tasks.length === 0 && <p className="muted">Belum check-in.</p>}
              {tasks.map((t) => (
                <div className="otask" key={t.id}>
                  <span className={`chip ${t.status}`}>{LABEL[t.status]}</span>
                  <div>
                    <div>{t.text}</div>
                    {t.result && <div className="muted"><Linkify text={t.result} /></div>}
                  </div>
                </div>
              ))}

              {recent.length > 0 && (
                <>
                  <h3 className="sub">Hasil terbaru</h3>
                  {recent.map((t) => (
                    <div className="otask" key={t.id}>
                      <span className="muted" style={{ minWidth: 64 }}>{dayShort(t.date)}</span>
                      <div>
                        <div>{t.text}</div>
                        <div className="muted"><Linkify text={t.result} /></div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
