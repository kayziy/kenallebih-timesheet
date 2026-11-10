import Link from "next/link";
import { logout } from "@/app/actions";
import type { Member } from "@/lib/store";

export default function Top({ me, active }: { me: Member; active: "today" | "overview" }) {
  return (
    <header className="top">
      <Link href="/" className="brand">kenal<b>lebih</b></Link>
      <nav>
        <Link href="/" className={active === "today" ? "tab on" : "tab"}>Hari ini</Link>
        <Link href="/overview" className={active === "overview" ? "tab on" : "tab"}>Overview</Link>
        <form action={logout}><button className="btn ghost small">Keluar ({me.name})</button></form>
      </nav>
    </header>
  );
}
