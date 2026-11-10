"use client";
import { useState } from "react";
import { addKpi } from "@/app/actions";

export default function KpiForm() {
  const [period, setPeriod] = useState("weekly");
  return (
    <form
      action={async (fd) => {
        await addKpi(fd);
        setPeriod("weekly"); // form di-reset React setelah submit, samakan state-nya
      }}
      className="row"
      style={{ marginTop: 12 }}
    >
      <input name="title" placeholder="Target baru, mis. Konten Reels" required style={{ flex: "2 1 180px" }} />
      <input name="target" type="number" step="any" min="0" placeholder="Angka" required style={{ maxWidth: 90 }} />
      <input name="unit" placeholder="satuan" style={{ maxWidth: 100 }} />
      <select name="period" value={period} onChange={(e) => setPeriod(e.target.value)} style={{ maxWidth: 130 }}>
        <option value="weekly">Mingguan</option>
        <option value="monthly">Bulanan</option>
        <option value="deadline">Deadline</option>
      </select>
      {period === "deadline" && <input name="deadline" type="date" required aria-label="Tanggal deadline" style={{ maxWidth: 170 }} />}
      <button className="btn">Tambah</button>
    </form>
  );
}
