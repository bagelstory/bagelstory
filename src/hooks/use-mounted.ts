"use client";
import { useEffect, useState } from "react";

/** true après le premier rendu côté navigateur. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
