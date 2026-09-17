import { useEffect, useRef } from "react";
import { clearSessionKey } from "@/lib/crypto";

// Re-lock the app after a period of inactivity or as soon as the tab is
// backgrounded/hidden. Wipes the in-memory DEK via clearSessionKey() so
// attachments become undecryptable until the user re-unlocks.
const INACTIVITY_MS = 3 * 60 * 1000;

export function useAutoLock(isUnlocked, onLock) {
  const onLockRef = useRef(onLock);
  useEffect(() => {
    onLockRef.current = onLock;
  }, [onLock]);

  useEffect(() => {
    if (!isUnlocked) return;
    let timer = null;

    const lock = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      clearSessionKey();
      onLockRef.current?.();
    };

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(lock, INACTIVITY_MS);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") lock();
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach((e) =>
      window.addEventListener(e, resetTimer, { passive: true })
    );
    document.addEventListener("visibilitychange", onVisibility);
    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isUnlocked]);
}