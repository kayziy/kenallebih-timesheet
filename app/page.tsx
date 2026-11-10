import { addEntry, addTasks, addTick, deleteEntry, deleteKpi } from "./actions";
import { requireMember } from "@/lib/auth";
import { hoursBetween, kpiProgress, monthRange, read, weekRange } from "@/lib/store";
import { dayShort, entryMs, fmtDateLong, fmtHours, wibDate } from "@/lib/time";
import KpiBar from "@/components/KpiBar";
import KpiForm from "@/components/KpiForm";
import KpiTag from "@/components/KpiTag";
import PinForm from "@/components/PinForm";
import TaskRow from "@/components/TaskRow";
import Top from "@/components/Top";

export const dynamic = "force-dynamic";

export default async function Today() {
  const me = await requireMember();
  const db = await read();
  const today = wibDate();
  const [w0, w1] = weekRange(today);
  const [m0, m1] = monthRange(today);

  const mineTasks = db.tasks.filter((t) => t.memberId === me.id);
  const todayTasks = mineTasks.filter((t) => t.date === today).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const leftovers = mineTasks.filter((t) => t.date < today && t.status !== "done").sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  const doneCount = todayTasks.filter((t) => t.status === "done").length;

  const weekEntries = db.entries
    .filter((e) => e.memberId === me.id && e.date >= w0 && e.date <= w1)
    .sort((a, b) => b.date.localeCompare(a.date) || b.start.localeCompare(a.start));
  const days = [...new Set(weekEntries.map((e) => e.date))];
  const kpis = db.kpis.filter((k) => k.memberId === me.id);

  return (
    <main className="wrap">
      <Top me={me} active="today" />
      <p className="muted" style={{ margin: "0 0 12px" }}>Halo {me.name}! {fmtDateLong(today)}</p>

      <div className="stats">
        <div className="stat"><b>{fmtHours(hoursBetween(db, me.id, today, today))}</b><span className="muted">hari ini</span></div>
        <div className="stat"><b>{fmtHours(hoursBetween(db, me.id, w0, w1))}</b><span className="muted">minggu ini</span></div>
        <div className="stat"><b>{fmtHours(hoursBetween(db, me.id, m0, m1))}</b><span className="muted">bulan ini</span></div>
      </div>

      <section className="card">
        <h2>Rencana hari ini {todayTasks.length > 0 && <span className="tag">{doneCount}/{todayTasks.length} beres</span>}</h2>
        {todayTasks.length === 0 && <p className="muted">Belum ada rencana. Tulis di bawah, satu baris satu tugas.</p>}
        {todayTasks.map((t) => <TaskRow key={t.id} task={t} />)}
        <form action={addTasks} className="row" style={{ flexDirection: "column", alignItems: "stretch", marginTop: 10 }}>
          <textarea name="text" placeholder={"Satu baris satu tugas, contoh:\nBikin 2 reels\nRevisi caption klien A"} required />
          <button className="btn go">Tambah ke rencana</button>
        </form>
        <p className="muted" style={{ marginBottom: 0 }}>Malamnya tinggal tandai Belum / Proses / Beres, dan isi hasilnya (boleh link).</p>
      </section>

      {leftovers.length > 0 && (
        <section className="card">
          <h2>Belum beres dari hari sebelumnya</h2>
          {leftovers.map((t) => (
            <div key={t.id}>
              <span className="muted">{dayShort(t.date)}</span>
              <TaskRow task={t} carry />
            </div>
          ))}
        </section>
      )}

      <section className="card">
        <h2>Jam kerja</h2>
        <form action={addEntry} className="row">
          <input name="date" type="date" defaultValue={today} required aria-label="Tanggal" />
          <input name="start" type="time" required aria-label="Mulai" />
          <input name="end" type="time" required aria-label="Selesai" />
          <button className="btn">Tambah</button>
        </form>
        <p className="muted">Kerja terpisah? Tambahkan tiap blok, misal pagi 08:00–12:00 lalu malam 19:00–23:00. Lewat tengah malam juga bisa.</p>
        {days.length === 0 && <p className="muted">Belum ada jam minggu ini.</p>}
        {days.map((d) => {
          const es = weekEntries.filter((e) => e.date === d);
          return (
            <div className="log" key={d}>
              <b>{dayShort(d)}</b> <span className="tag">{fmtHours(hoursBetween(db, me.id, d, d))}</span>
              {es.map((e) => (
                <form action={deleteEntry} className="entry" key={e.id}>
                  <input type="hidden" name="id" value={e.id} />
                  <span>{e.start}–{e.end} <span className="muted">({fmtHours(entryMs(e.start, e.end))})</span></span>
                  <button className="btn ghost small" aria-label="Hapus blok jam">✕</button>
                </form>
              ))}
            </div>
          );
        })}
      </section>

      <section className="card">
        <h2>Target kamu</h2>
        {kpis.length === 0 && <p className="muted">Belum ada target. Tambahkan target mingguan atau bulanan di bawah.</p>}
        {kpis.map((k) => {
          const v = kpiProgress(db, k, today);
          return (
            <div className="kpi" key={k.id}>
              <div className="kpi-head">
                <span>{k.title} <KpiTag k={k} today={today} value={v} /></span>
                <span>{v}/{k.target} {k.unit}</span>
              </div>
              <KpiBar value={v} target={k.target} />
              <div className="row">
                <form action={addTick} className="row" style={{ flex: "1 1 auto" }}>
                  <input type="hidden" name="kpiId" value={k.id} />
                  <input name="amount" type="number" step="any" defaultValue={1} style={{ maxWidth: 90 }} aria-label="Jumlah" />
                  <button className="btn teal small">+ Tambah progres</button>
                </form>
                <form action={deleteKpi}><input type="hidden" name="id" value={k.id} /><button className="btn ghost small">Hapus</button></form>
              </div>
            </div>
          );
        })}
        <KpiForm />
      </section>

      <details className="card">
        <summary>Ganti PIN</summary>
        <div style={{ marginTop: 10 }}><PinForm /></div>
      </details>
    </main>
  );
}
