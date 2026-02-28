import Link from "next/link";
import { MdOutlineSettings } from "react-icons/md";

export const NotConfigured = () => (
  <div className="flex flex-col items-center justify-center gap-6 px-8 py-20 text-center">
    <div className="w-16 h-16 rounded-2xl bg-stone-800 flex items-center justify-center">
      <MdOutlineSettings size={32} className="text-stone-500" />
    </div>
    <div className="flex flex-col gap-2">
      <p className="text-stone-300 font-semibold">尚未設定 Notion 連接</p>
      <p className="text-stone-500 text-sm leading-relaxed">
        請先前往設定頁面，輸入你的 Notion API Token 與資料庫 ID
      </p>
    </div>
    <Link
      href="/profile"
      className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
    >
      前往設定
    </Link>
  </div>
);
