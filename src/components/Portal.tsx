"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * 모달·시트를 document.body 로 올려 렌더링한다.
 * 페이지 컨테이너에 transform(등장 애니메이션)이 걸려 있으면 position: fixed 가
 * 화면이 아니라 그 컨테이너 기준으로 잡히기 때문에, 오버레이는 항상 포털로 띄운다.
 */
export default function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}
