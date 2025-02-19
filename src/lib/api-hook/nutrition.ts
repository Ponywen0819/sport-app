import { useQuery, queryOptions, isServer } from "@tanstack/react-query";
import { getNutritionOverview } from "../api/nutrition";
import { CalendarDate } from "@/components/date-selector";
import { useAuthStore } from "@/providers/auth-store-provider";

export const useNutritionOverview = (
  date: CalendarDate,
  enabled: boolean = true
) => {
  const token = useAuthStore((store) => store.token);

  return useQuery({
    queryKey: ["nutrition-overview", date],
    queryFn: () => getNutritionOverview(date, token || ""),
    enabled: enabled && !!token,
  });
};
