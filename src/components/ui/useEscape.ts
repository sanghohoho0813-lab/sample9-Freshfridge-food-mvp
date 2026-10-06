"use client";

import { useEffect, useRef } from "react";

/**
 * 열린 시트·대화상자를 Esc 키로 닫고, 열려 있는 동안 뒤 화면 스크롤을 막는다.
 * 떠 있는 공용 뒤로·앞으로 버튼이 시트의 버튼을 가리지 않도록 그동안 숨긴다(globals.css).
 */
export function useEscape(onClose: () => void) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("modal-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.documentElement.classList.remove("modal-open");
    };
  }, []);
}
