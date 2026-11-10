/** Ubah URL http(s) di dalam teks jadi link yang bisa diklik. */
export default function Linkify({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer">{p.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)}{p.length > 50 ? "…" : ""}</a>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}
