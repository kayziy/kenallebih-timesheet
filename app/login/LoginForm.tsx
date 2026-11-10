"use client";
import { useActionState } from "react";
import { login } from "@/app/actions";

export default function LoginForm({ members }: { members: { id: string; name: string }[] }) {
  const [err, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="row" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <select name="member" required defaultValue="">
        <option value="" disabled>Pilih namamu</option>
        {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <input name="pin" type="password" inputMode="numeric" pattern="\d{4}" maxLength={4} placeholder="PIN 4 angka" required />
      {err && <div className="err">{err}</div>}
      <button className="btn go" disabled={pending}>{pending ? "Masuk..." : "Masuk"}</button>
    </form>
  );
}
