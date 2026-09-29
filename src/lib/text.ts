/** 한국어 조사 처리 — "우유와 두부를", "당근과 시금치를" */

function hasBatchim(word: string): boolean {
  const last = word.trim().charCodeAt(word.trim().length - 1);
  if (last < 0xac00 || last > 0xd7a3) return false; // 한글이 아니면 받침 없음으로 처리
  return (last - 0xac00) % 28 !== 0;
}

/** josa("두부", "을/를") → "두부를" */
export function josa(word: string, pair: "을/를" | "이/가" | "은/는" | "과/와" | "으로/로"): string {
  const [withB, withoutB] = pair.split("/");
  return word + (hasBatchim(word) ? withB : withoutB);
}

/** ["우유","두부","시금치"] → "우유와 두부 외 1개를" */
export function joinNames(names: string[], objectJosa: "을/를" | "이/가" = "을/를"): string {
  if (names.length === 0) return "";
  if (names.length === 1) return josa(names[0], objectJosa);
  if (names.length === 2) return `${josa(names[0], "과/와")} ${josa(names[1], objectJosa)}`;
  const rest = names.length - 2;
  return `${josa(names[0], "과/와")} ${names[1]} 외 ${rest}개${objectJosa === "을/를" ? "를" : "가"}`;
}
