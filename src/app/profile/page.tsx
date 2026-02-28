import { NotionSettingsForm } from "./components/notion-settings-form";

export default function ProfilePage() {
  return (
    <div className="flex flex-col px-4 py-6 gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-stone-100">個人設定</h1>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-stone-400 text-xs font-medium uppercase tracking-wider">
          Notion 連接設定
        </h2>
        <div className="bg-stone-800 rounded-2xl p-4">
          <NotionSettingsForm />
        </div>
      </div>

      <div className="bg-stone-800 rounded-2xl p-4 flex flex-col gap-2">
        <h2 className="text-stone-300 text-sm font-semibold">關於</h2>
        <p className="text-stone-500 text-xs">運動紀錄 v1.0</p>
        <p className="text-stone-600 text-xs">資料存儲於你的 Notion workspace</p>
      </div>
    </div>
  );
}
