import { WorkoutsClient } from "./components/workouts-client";

const Page = () => {
  return (
    <div className="flex flex-col">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-stone-100">運動紀錄</h1>
      </div>
      <WorkoutsClient />
    </div>
  );
};

export default Page;
