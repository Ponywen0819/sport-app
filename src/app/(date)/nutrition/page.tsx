import { cookies } from "next/headers";
import { NutritionClient } from "./components/nutrition-client";
import { NotConfigured } from "@/components/not-configured";

const Page = async () => {
  const cookieStore = await cookies();

  const isConfigured =
    !!cookieStore.get("notion_token")?.value &&
    !!cookieStore.get("notion_meal_items_db_id")?.value &&
    !!cookieStore.get("notion_foods_db_id")?.value;

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-stone-100">今日飲食</h1>
      </div>
      {isConfigured ? <NutritionClient /> : <NotConfigured />}
    </div>
  );
};

export default Page;
