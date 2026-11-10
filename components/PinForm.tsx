"use client";
import { useActionState } from "react";
import { changePin } from "@/app/actions";

export default function PinForm() {
  const [msg, action, pending] = useActionState(changePin, null);
  return (
    <form action={action} className="row">
      <input name="old" type="password" inputMode="numeric" maxLength={4} placeholder="PIN lama" required />
      <input name="next" type="password" inputMode="numeric" maxLength={4} placeholder="PIN baru (4 angka)" required />
      <button className="btn small" disabled={pending}>Ganti PIN</button>
      {msg && <div className="muted" style={{ flexBasis: "100%" }}>{msg}</div>}
    </form>
  );
}
