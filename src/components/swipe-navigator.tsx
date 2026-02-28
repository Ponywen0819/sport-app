"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

const TAB_ROUTES = ["/", "/workouts", "/nutrition", "/profile"] as const;

const SWIPE_THRESHOLD = 72;  // 最小水平位移（px）才算滑動
const VERTICAL_LIMIT = 50;   // 垂直位移超過此值視為滾動，忽略

function getCurrentTabIndex(pathname: string): number {
  if (pathname === "/") return 0;
  const idx = TAB_ROUTES.slice(1).findIndex((r) => pathname.startsWith(r));
  return idx === -1 ? -1 : idx + 1;
}

export const SwipeNavigator = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  // 用 ref 儲存最新 pathname，避免 closure 捕捉舊值
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = Math.abs(e.changedTouches[0].clientY - startY);

      // 垂直移動過多 → 視為滾動，忽略
      if (dy > VERTICAL_LIMIT) return;
      // 水平移動不夠 → 忽略
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;

      const currentIndex = getCurrentTabIndex(pathnameRef.current);
      if (currentIndex === -1) return;

      if (dx < 0) {
        // 向左滑 → 下一頁
        const next = TAB_ROUTES[Math.min(currentIndex + 1, TAB_ROUTES.length - 1)];
        if (next !== pathnameRef.current) router.push(next);
      } else {
        // 向右滑 → 上一頁
        const prev = TAB_ROUTES[Math.max(currentIndex - 1, 0)];
        if (prev !== pathnameRef.current) router.push(prev);
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [router]);

  return <>{children}</>;
};
