"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const noopSubscribe = () => () => {};

/**
 * 모달·시트를 document.body 로 올려 렌더링한다.
 * 페이지 컨테이너에 transform(등장 애니메이션)이 걸려 있으면 position: fixed 가
 * 화면이 아니라 그 컨테이너 기준으로 잡히기 때문에, 오버레이는 항상 포털로 띄운다.
 *
 * 서버 렌더에서는 아무것도 그리지 않고, 브라우저에서는 첫 렌더부터 바로 그린다
 * (마운트 후 한 번 더 렌더하는 방식보다 한 박자 빠르고, 열리자마자 포커스를 옮길 수 있다).
 */
export default function Portal({ children }: { children: ReactNode }) {
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
  return isClient ? createPortal(children, document.body) : null;
}
