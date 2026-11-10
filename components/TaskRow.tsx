"use client";
import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { carryTask, deleteTask, updateTask } from "@/app/actions";
import type { Task } from "@/lib/store";

const OPTIONS = [
  ["todo", "Belum"],
  ["doing", "Proses"],
  ["done", "Beres"],
] as const;

/** Penanda kecil "Menyimpan…" selama form tugas diproses. */
function Saving() {
  const { pending } = useFormStatus();
  return pending ? <span className="muted">Menyimpan…</span> : null;
}

export default function TaskRow({ task, carry = false }: { task: Task; carry?: boolean }) {
  const form = useRef<HTMLFormElement>(null);
  const saved = useRef(task.result);
  return (
    <form ref={form} action={updateTask} className={`task ${task.status}`}>
      <input type="hidden" name="id" value={task.id} />
      <div className="task-text">{task.text} <Saving /></div>
      <div className="pills">
        {OPTIONS.map(([v, label]) => (
          <label key={v} className={`pill ${v}`}>
            <input type="radio" name="status" value={v} defaultChecked={task.status === v} onChange={() => form.current?.requestSubmit()} />
            {label}
          </label>
        ))}
      </div>
      <div className="row">
        <input
          key={task.result}
          name="result"
          defaultValue={task.result}
          placeholder="Hasil / link (opsional)"
          onBlur={(e) => { if (e.target.value.trim() !== saved.current) { saved.current = e.target.value.trim(); form.current?.requestSubmit(); } }}
        />
        {carry && <button className="btn teal small" formAction={carryTask} formNoValidate>Bawa ke hari ini</button>}
        <button className="btn ghost small" formAction={deleteTask} formNoValidate aria-label="Hapus tugas">✕</button>
      </div>
    </form>
  );
}
