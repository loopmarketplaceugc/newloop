"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Types out one string, optionally calls onDone. */
export function TypeOnce({
  text,
  speed = 28,
  className,
  caret = true,
  onDone,
}: {
  text: string;
  speed?: number;
  className?: string;
  caret?: boolean;
  onDone?: () => void;
}) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(reduced ? text.length : 0);

  useEffect(() => {
    if (reduced) {
      setN(text.length);
      onDone?.();
      return;
    }
    setN(0);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setN(i);
      if (i >= text.length) {
        clearInterval(id);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed, reduced]);

  return (
    <span className={`${className ?? ""} ${caret && n < text.length ? "caret" : ""}`}>
      {text.slice(0, n)}
    </span>
  );
}

/** Cycles through words: type → hold → delete → next. */
export function TypeCycle({
  words,
  className,
  typeSpeed = 70,
  deleteSpeed = 40,
  holdMs = 1400,
}: {
  words: string[];
  className?: string;
  typeSpeed?: number;
  deleteSpeed?: number;
  holdMs?: number;
}) {
  const reduced = useReducedMotion();
  const [wordIdx, setWordIdx] = useState(0);
  const [n, setN] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const word = words[wordIdx % words.length];

  useEffect(() => {
    if (reduced) return;
    let id: ReturnType<typeof setTimeout>;
    if (!deleting && n < word.length) {
      id = setTimeout(() => setN(n + 1), typeSpeed);
    } else if (!deleting && n === word.length) {
      id = setTimeout(() => setDeleting(true), holdMs);
    } else if (deleting && n > 0) {
      id = setTimeout(() => setN(n - 1), deleteSpeed);
    } else {
      id = setTimeout(() => {
        setDeleting(false);
        setWordIdx((w) => (w + 1) % words.length);
      }, 200);
    }
    return () => clearTimeout(id);
  }, [n, deleting, word, words.length, typeSpeed, deleteSpeed, holdMs, reduced]);

  if (reduced) return <span className={className}>{words[0]}</span>;
  return <span className={`caret ${className ?? ""}`}>{word.slice(0, n)}</span>;
}
