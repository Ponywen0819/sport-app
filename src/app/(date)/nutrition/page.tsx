import { cookies } from "next/headers";

import { CalendarDate, DateSelector } from "@/components/date-selector";

import { MealTracker } from "./components/meal-tracker";
import { NutritionOverview } from "./components/nutrition-overview";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
  useQuery,
} from "@tanstack/react-query";
import { getCurrentDate } from "@/utils/time";
import { getNutritionOverview } from "@/lib/api/nutrition";

const Page = async () => {
  const cookieStore = await cookies();
  const date = getCurrentDateByCookie(cookieStore);
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["nutrition-overview", date],
    queryFn: () =>
      getNutritionOverview(date, cookieStore.get("token")?.value || ""),
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <NutritionPage date={date} />
    </HydrationBoundary>
  );
};

type NutritionPageProps = {
  date: CalendarDate;
};

const NutritionPage = (props: NutritionPageProps) => {
  const { date } = props;

  return (
    <div className="p-3 text-stone-900 container mx-auto">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[20rem_minmax(0,_1fr)] relative">
        <div className="w-fit sticky top-4 h-fit">
          <div className="mb-4">
            <DateSelector />
          </div>
          <NutritionOverview date={date} />
        </div>
        <div className="flex flex-col items-start">
          <MealTracker />
        </div>
      </div>
    </div>
  );
};

const getCurrentDateByCookie = (
  cookieStore: Awaited<ReturnType<typeof cookies>>
) => {
  const storedDate = cookieStore.get("date");
  if (!storedDate) {
    const currentDate = getCurrentDate();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();

    return { year, month, day } as CalendarDate;
  } else {
    const [year, month, day] = storedDate.value.split("-").map(Number);

    return { year, month, day } as CalendarDate;
  }
};

export default Page;
