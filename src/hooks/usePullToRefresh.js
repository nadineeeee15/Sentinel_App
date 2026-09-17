import { useEffect, useRef, useState } from "react";

// Lightweight pull-to-refresh for a window-scrolling page. Returns the current
// pull distance (px) and a refreshing flag. Pass the page's load() function.
// No-op on non-touch / desktop browsers, so existing web behavior is unchanged.
export function usePullToRefresh(onRefresh, { threshold = 70 } = {}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const active = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => { onRefreshRef.current = onRefresh; });

  useEffect(() => {
    function onTouchStart(e) {
      if (window.scrollY <= 0 && !refreshingRef.current) {
        startY.current = e.touches[0].clientY;
        active.current = true;
      } else {
        startY.current = null;
        active.current = false;
      }
    }
    function onTouchMove(e) {
      if (!active.current || startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        const p = Math.min(dy * 0.5, threshold * 1.5);
        pullRef.current = p;
        setPull(p);
      }
    }
    function onTouchEnd() {
      if (!active.current) return;
      active.current = false;
      startY.current = null;
      if (pullRef.current >= threshold) {
        setRefreshing(true);
        refreshingRef.current = true;
        setPull(threshold);
        Promise.resolve(onRefreshRef.current && onRefreshRef.current())
          .finally(() => {
            setRefreshing(false);
            refreshingRef.current = false;
            setPull(0);
            pullRef.current = 0;
          });
      } else {
        setPull(0);
        pullRef.current = 0;
      }
    }
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [threshold]);

  return { pull, refreshing };
}