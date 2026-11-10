import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { addDays, entryMs, monthStart, weekStart } from "./time";

export type Member = { id: string; name: string; pinHash: string };
export type TimeEntry = { id: string; memberId: string; date: string; start: string; end: string };
export type TaskStatus = "todo" | "doing" | "done";
export type Task = { id: string; memberId: string; date: string; text: string; status: TaskStatus; result: string; createdAt: string };
export type Kpi = { id: string; memberId: string; title: string; period: "weekly" | "monthly" | "deadline"; target: number; unit: string; deadline?: string };
export type Tick = { id: string; kpiId: string; date: string; amount: number };
export type Db = { members: Member[]; entries: TimeEntry[]; tasks: Task[]; kpis: Kpi[]; ticks: Tick[] };

/*
 * Storage: kalau SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY diisi di .env.local -> Supabase.
 * Kalau tidak -> file JSON lokal (.data/db-v2.json) untuk coba-coba.
 * Semua akses lewat read()/update(); kode lain tidak peduli backend-nya.
 */
const FILE = path.join(process.cwd(), ".data", "db-v2.json");
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY, { auth: { persistSession: false } }) : null;
let queue: Promise<unknown> = Promise.resolve();

export const uid = () => crypto.randomUUID();
export const hashPin = (pin: string) => crypto.createHash("sha256").update("kenallebih:" + pin).digest("hex");

// ID tetap supaya seeding idempotent (tidak dobel kalau dua request jalan bersamaan).
const seed = (): Db => ({
  members: [
    { id: "0ccabcd1-6a34-46dd-b114-08ba8147b2fb", name: "Kay", pinHash: hashPin("1234") },
    { id: "0fac4d4a-5cc0-4f66-bfc1-483066ffbd61", name: "Dzak", pinHash: hashPin("1234") },
  ],
  entries: [], tasks: [], kpis: [], ticks: [],
});

/* ----- Backend file ----- */

async function loadFile(): Promise<Db> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    const db = seed();
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(db, null, 2));
    return db;
  }
}

/* ----- Backend Supabase ----- */

const TABLES = ["members", "kpis", "entries", "tasks", "ticks"] as const;
type TableName = (typeof TABLES)[number];
type Row = { id: string } & Record<string, unknown>;

// camelCase (kode) <-> snake_case (database). "end" itu kata terlarang di SQL, jadi start/end -> start_at/end_at.
const OVERRIDE: Record<string, string> = { start: "start_at", end: "end_at" };
const REVERSE = Object.fromEntries(Object.entries(OVERRIDE).map(([k, v]) => [v, k]));
const toSnake = (k: string) => OVERRIDE[k] ?? k.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
const toCamel = (k: string) => REVERSE[k] ?? k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const toRow = (o: Row) => Object.fromEntries(Object.entries(o).map(([k, v]) => [toSnake(k), v ?? null]));
const fromRow = (r: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(r).filter(([, v]) => v !== null).map(([k, v]) => [toCamel(k), v]));

const rowsOf = (db: Db, t: TableName) => db[t] as unknown as Row[];

async function loadSb(): Promise<Db> {
  const res = await Promise.all(TABLES.map((t) => sb!.from(t).select("*")));
  const db = { members: [], kpis: [], entries: [], tasks: [], ticks: [] } as Db;
  res.forEach((r, i) => {
    if (r.error) throw new Error(`Supabase ${TABLES[i]}: ${r.error.message}`);
    (db as unknown as Record<string, unknown>)[TABLES[i]] = (r.data ?? []).map(fromRow);
  });
  if (db.members.length === 0) {
    const first = seed();
    const { error } = await sb!.from("members").upsert(first.members.map((m) => toRow(m as unknown as Row)), { onConflict: "id", ignoreDuplicates: true });
    if (error) throw new Error(`Supabase seed: ${error.message}`);
    db.members = first.members;
  }
  return db;
}

/** Bandingkan sebelum/sesudah, tulis hanya baris yang berubah. */
async function saveSb(before: Db, after: Db) {
  for (const t of TABLES) {
    const prev = new Map(rowsOf(before, t).map((r) => [r.id, JSON.stringify(r)]));
    const changed = rowsOf(after, t).filter((r) => prev.get(r.id) !== JSON.stringify(r));
    if (changed.length) {
      const { error } = await sb!.from(t).upsert(changed.map(toRow));
      if (error) throw new Error(`Supabase simpan ${t}: ${error.message}`);
    }
  }
  for (const t of [...TABLES].reverse()) {
    const keep = new Set(rowsOf(after, t).map((r) => r.id));
    const removed = rowsOf(before, t).map((r) => r.id).filter((id) => !keep.has(id));
    if (removed.length) {
      const { error } = await sb!.from(t).delete().in("id", removed);
      if (error) throw new Error(`Supabase hapus ${t}: ${error.message}`);
    }
  }
}

/* ----- API untuk app ----- */

export async function read(): Promise<Db> {
  await queue;
  return sb ? loadSb() : loadFile();
}

/** Mutasi berurutan supaya tidak saling menimpa. */
export function update<T>(fn: (db: Db) => T): Promise<T> {
  const run = queue.then(async () => {
    if (!sb) {
      const db = await loadFile();
      const out = fn(db);
      await fs.writeFile(FILE, JSON.stringify(db, null, 2));
      return out;
    }
    const db = await loadSb();
    const before = structuredClone(db);
    const out = fn(db);
    await saveSb(before, db);
    return out;
  });
  queue = run.catch(() => {});
  return run;
}

/* ---------- Query helpers ---------- */

export function hoursBetween(db: Db, memberId: string, from: string, to: string): number {
  return db.entries
    .filter((e) => e.memberId === memberId && e.date >= from && e.date <= to)
    .reduce((a, e) => a + entryMs(e.start, e.end), 0);
}

export function weekRange(today: string): [string, string] {
  return [weekStart(today), addDays(weekStart(today), 6)];
}

export function monthRange(today: string): [string, string] {
  return [monthStart(today), today.slice(0, 7) + "-31"];
}

export function kpiProgress(db: Db, k: Kpi, today: string): number {
  // Target berdeadline: akumulasi seluruh progres sejak dibuat.
  if (k.period === "deadline") return db.ticks.filter((t) => t.kpiId === k.id).reduce((s, t) => s + t.amount, 0);
  const [a, b] = k.period === "weekly" ? weekRange(today) : monthRange(today);
  return db.ticks.filter((t) => t.kpiId === k.id && t.date >= a && t.date <= b).reduce((s, t) => s + t.amount, 0);
}
