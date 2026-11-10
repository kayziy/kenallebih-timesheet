"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearSession, requireMember, setSession } from "@/lib/auth";
import { hashPin, read, uid, update, type TaskStatus } from "@/lib/store";
import { wibDate } from "@/lib/time";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;
const refresh = () => { revalidatePath("/"); revalidatePath("/overview"); };

export async function login(_: string | null, fd: FormData): Promise<string | null> {
  const id = String(fd.get("member") ?? "");
  const pin = String(fd.get("pin") ?? "");
  const db = await read();
  const m = db.members.find((x) => x.id === id);
  if (!m || m.pinHash !== hashPin(pin)) return "PIN salah, coba lagi.";
  await setSession(m.id);
  redirect("/");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}

export async function changePin(_: string | null, fd: FormData): Promise<string | null> {
  const me = await requireMember();
  const oldPin = String(fd.get("old") ?? "");
  const next = String(fd.get("next") ?? "");
  if (!/^\d{4}$/.test(next)) return "PIN baru harus 4 angka.";
  const ok = await update((db) => {
    const m = db.members.find((x) => x.id === me.id);
    if (!m || m.pinHash !== hashPin(oldPin)) return false;
    m.pinHash = hashPin(next);
    return true;
  });
  return ok ? "PIN berhasil diganti." : "PIN lama salah.";
}

/* ---------- Jam kerja (isi manual) ---------- */

export async function addEntry(fd: FormData) {
  const me = await requireMember();
  const date = String(fd.get("date") ?? "");
  const start = String(fd.get("start") ?? "");
  const end = String(fd.get("end") ?? "");
  if (!DATE.test(date) || !TIME.test(start) || !TIME.test(end) || start === end) return;
  await update((db) => { db.entries.push({ id: uid(), memberId: me.id, date, start, end }); });
  refresh();
}

export async function deleteEntry(fd: FormData) {
  const me = await requireMember();
  const id = String(fd.get("id"));
  await update((db) => { db.entries = db.entries.filter((e) => !(e.id === id && e.memberId === me.id)); });
  refresh();
}

/* ---------- Rencana & checklist harian ---------- */

/** Satu baris = satu tugas. */
export async function addTasks(fd: FormData) {
  const me = await requireMember();
  const lines = String(fd.get("text") ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return;
  const date = wibDate();
  await update((db) => {
    for (const text of lines) {
      db.tasks.push({ id: uid(), memberId: me.id, date, text, status: "todo", result: "", createdAt: new Date().toISOString() });
    }
  });
  refresh();
}

export async function updateTask(fd: FormData) {
  const me = await requireMember();
  const id = String(fd.get("id"));
  const st = String(fd.get("status"));
  const status: TaskStatus = st === "done" ? "done" : st === "doing" ? "doing" : "todo";
  const result = String(fd.get("result") ?? "").trim().slice(0, 500);
  await update((db) => {
    const t = db.tasks.find((x) => x.id === id && x.memberId === me.id);
    if (t) { t.status = status; t.result = result; }
  });
  refresh();
}

export async function deleteTask(fd: FormData) {
  const me = await requireMember();
  const id = String(fd.get("id"));
  await update((db) => { db.tasks = db.tasks.filter((t) => !(t.id === id && t.memberId === me.id)); });
  refresh();
}

/** Bawa tugas yang belum beres ke hari ini. */
export async function carryTask(fd: FormData) {
  const me = await requireMember();
  const id = String(fd.get("id"));
  await update((db) => {
    const t = db.tasks.find((x) => x.id === id && x.memberId === me.id);
    if (t) t.date = wibDate();
  });
  refresh();
}

/* ---------- Target (KPI) milik sendiri ---------- */

export async function addKpi(fd: FormData) {
  const me = await requireMember();
  const title = String(fd.get("title") ?? "").trim();
  const target = Number(fd.get("target"));
  const unit = String(fd.get("unit") ?? "").trim();
  const p = String(fd.get("period"));
  const period = p === "monthly" ? "monthly" : p === "deadline" ? "deadline" : "weekly";
  const deadline = String(fd.get("deadline") ?? "");
  if (!title || !(target > 0)) return;
  if (period === "deadline" && !DATE.test(deadline)) return;
  await update((db) => {
    db.kpis.push({ id: uid(), memberId: me.id, title, period, target, unit, ...(period === "deadline" ? { deadline } : {}) });
  });
  refresh();
}

export async function deleteKpi(fd: FormData) {
  const me = await requireMember();
  const id = String(fd.get("id"));
  await update((db) => {
    const k = db.kpis.find((x) => x.id === id && x.memberId === me.id);
    if (!k) return;
    db.kpis = db.kpis.filter((x) => x.id !== id);
    db.ticks = db.ticks.filter((t) => t.kpiId !== id);
  });
  refresh();
}

export async function addTick(fd: FormData) {
  const me = await requireMember();
  const kpiId = String(fd.get("kpiId"));
  const amount = Number(fd.get("amount") ?? 1);
  if (!Number.isFinite(amount) || amount === 0) return;
  await update((db) => {
    if (db.kpis.some((k) => k.id === kpiId && k.memberId === me.id)) db.ticks.push({ id: uid(), kpiId, date: wibDate(), amount });
  });
  refresh();
}
