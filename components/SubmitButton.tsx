"use client";
import { useFormStatus } from "react-dom";

/** Tombol submit yang menonaktifkan dirinya saat form diproses, supaya tidak terklik berkali-kali. */
export default function SubmitButton({
  children,
  pending: pendingText = "Menyimpan…",
  className = "btn",
  label,
}: {
  children: React.ReactNode;
  pending?: React.ReactNode;
  className?: string;
  label?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending} aria-busy={pending} aria-label={label}>
      {pending ? pendingText : children}
    </button>
  );
}
