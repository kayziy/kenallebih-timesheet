import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { read, type Member } from "./store";

const SECRET = process.env.SESSION_SECRET ?? "dev-secret-ganti-di-produksi";
const sign = (v: string) => crypto.createHmac("sha256", SECRET).update(v).digest("hex");

export async function setSession(memberId: string) {
  (await cookies()).set("kl_session", `${memberId}.${sign(memberId)}`, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90,
  });
}

export async function clearSession() {
  (await cookies()).delete("kl_session");
}

export async function requireMember(): Promise<Member> {
  const raw = (await cookies()).get("kl_session")?.value;
  const [id, sig] = (raw ?? "").split(".");
  if (id && sig && sig === sign(id)) {
    const m = (await read()).members.find((x) => x.id === id);
    if (m) return m;
  }
  redirect("/login");
}
