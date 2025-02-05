import { DateSelector } from "@/components/date-selector";

import { PlanOverview } from "./components/plan-overview";
import { WorkoutSchedule } from "./components/workout-schedule";

const Page = () => {
  return (
    <div className="p-3 text-stone-900 container mx-auto">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[20rem_minmax(0,_1fr)] relative">
        <div className="w-fit sticky top-4 h-fit">
          <div className="mb-4">
            <DateSelector />
          </div>
        </div>
        <div className="flex flex-col items-start">
          <PlanOverview />
          <WorkoutSchedule />
        </div>
      </div>
    </div>
  );
};

export default Page;
