"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IoHome, IoHomeOutline } from "react-icons/io5";
import { MdFitnessCenter, MdOutlineFitnessCenter } from "react-icons/md";
import { IoNutrition, IoNutritionOutline } from "react-icons/io5";
import { RiUser3Fill, RiUser3Line } from "react-icons/ri";

const NAV_ITEMS = [
  {
    href: "/",
    label: "首頁",
    icon: IoHomeOutline,
    activeIcon: IoHome,
    exact: true,
  },
  {
    href: "/workouts",
    label: "運動",
    icon: MdOutlineFitnessCenter,
    activeIcon: MdFitnessCenter,
    exact: false,
  },
  {
    href: "/nutrition",
    label: "營養",
    icon: IoNutritionOutline,
    activeIcon: IoNutrition,
    exact: false,
  },
  {
    href: "/profile",
    label: "我的",
    icon: RiUser3Line,
    activeIcon: RiUser3Fill,
    exact: false,
  },
];

export const BottomNav = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-stone-900 border-t border-stone-700 safe-area-bottom">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {NAV_ITEMS.map(({ href, label, icon: Icon, activeIcon: ActiveIcon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          const DisplayIcon = isActive ? ActiveIcon : Icon;

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? "text-blue-400" : "text-stone-500 hover:text-stone-300"
              }`}
            >
              <DisplayIcon size={22} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
