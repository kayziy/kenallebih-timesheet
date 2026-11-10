import { read } from "@/lib/store";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const db = await read();
  const members = db.members.map((m) => ({ id: m.id, name: m.name }));
  return (
    <main className="wrap" style={{ maxWidth: 420, paddingTop: 48 }}>
      <h1 className="brand" style={{ fontSize: "2rem", textAlign: "center", marginBottom: 20 }}>kenal<b>lebih</b></h1>
      <div className="card">
        <h2>Masuk</h2>
        <LoginForm members={members} />
      </div>
    </main>
  );
}
