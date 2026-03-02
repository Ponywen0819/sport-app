import Link from "next/link";
import { IoChevronBack } from "react-icons/io5";
import { NotionSettingsForm } from "../components/notion-settings-form";

export default function NotionSettingsPage() {
  return (
    <div className="flex flex-col px-4 py-6 gap-6">
      <div className="flex items-center gap-2">
        <Link
          href="/profile"
          className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center active:bg-stone-700 transition-colors"
        >
          <IoChevronBack size={18} className="text-stone-300" />
        </Link>
        <h1 className="text-xl font-bold text-stone-100">Notion 連接設定</h1>
      </div>

      <div className="bg-stone-800 rounded-2xl p-4">
        <NotionSettingsForm />
      </div>
    </div>
  );
}
