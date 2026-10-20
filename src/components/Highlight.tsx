/**
 * 검색어와 맞는 부분을 표시한다. 띄어쓰기는 무시한다 ("김치 볶음밥" ↔ "김치볶음밥").
 * 맞는 곳이 없으면 글자 그대로.
 */
export default function Highlight({ text, query }: { text: string; query?: string }) {
  const chars = [...(query ?? "").replace(/\s+/g, "")];
  if (chars.length === 0) return <>{text}</>;
  const pattern = new RegExp(chars.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s*"), "i");
  const m = pattern.exec(text);
  if (!m) return <>{text}</>;
  return (
    <>
      {text.slice(0, m.index)}
      <mark className="rounded-[4px] bg-fresh-100 px-0.5 text-inherit">{m[0]}</mark>
      {text.slice(m.index + m[0].length)}
    </>
  );
}
