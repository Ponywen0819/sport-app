import Link from "next/link";
import { IoChevronForward, IoBody } from "react-icons/io5";
import { IoNutrition } from "react-icons/io5";
import { SiNotion } from "react-icons/si";

type SettingsRowProps = {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
};

const SettingsRow = ({ href, icon, iconBg, title, description }: SettingsRowProps) => (
  <Link
    href={href}
    className="bg-stone-800 rounded-2xl px-4 py-4 flex items-center justify-between active:bg-stone-700 transition-colors"
  >
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-stone-100 text-sm font-medium">{title}</p>
        <p className="text-stone-500 text-xs">{description}</p>
      </div>
    </div>
    <IoChevronForward size={16} className="text-stone-600" />
  </Link>
);

export default function ProfilePage() {
  return (
    <div className="flex flex-col px-4 py-6 gap-6">
      <h1 className="text-xl font-bold text-stone-100">個人設定</h1>

      <div className="flex flex-col gap-3">
        <h2 className="text-stone-400 text-xs font-medium uppercase tracking-wider">健康數據</h2>
        <SettingsRow
          href="/profile/body-index"
          icon={<IoBody size={18} className="text-emerald-400" />}
          iconBg="bg-emerald-500/15"
          title="身體指標"
          description="體重、體脂率、骨骼肌等數據"
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-stone-400 text-xs font-medium uppercase tracking-wider">飲食設定</h2>
        <SettingsRow
          href="/profile/nutrition-goals"
          icon={<IoNutrition size={18} className="text-orange-400" />}
          iconBg="bg-orange-500/15"
          title="飲食目標"
          description="每日卡路里與三大營養素目標"
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-stone-400 text-xs font-medium uppercase tracking-wider">應用程式</h2>
        <SettingsRow
          href="/profile/notion-settings"
          icon={<SiNotion size={16} className="text-stone-300" />}
          iconBg="bg-stone-700"
          title="Notion 連接設定"
          description="API Token 與資料庫 ID"
        />
      </div>

      <div className="bg-stone-800 rounded-2xl p-4 flex flex-col gap-2">
        <h2 className="text-stone-300 text-sm font-semibold">關於</h2>
        <p className="text-stone-500 text-xs">運動紀錄 v1.0</p>
        <p className="text-stone-600 text-xs">資料存儲於你的 Notion workspace</p>
      </div>
    </div>
  );
}
