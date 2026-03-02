import { cookies } from "next/headers";
import { WorkoutsClient } from "./components/workouts-client";
import { NotConfigured } from "@/components/not-configured";

const Page = async () => {
  const cookieStore = await cookies();

  const isConfigured =
    !!cookieStore.get("notion_token")?.value &&
    !!cookieStore.get("notion_exercise_records_db_id")?.value;

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-stone-100">運動紀錄</h1>
      </div>
      {isConfigured ? <WorkoutsClient /> : <NotConfigured />}
    </div>
  );
};

export default Page;
