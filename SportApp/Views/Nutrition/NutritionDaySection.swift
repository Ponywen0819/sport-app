import SwiftUI
import SwiftData

// The selected day's nutrition section: the overview card (goal progress or
// summary tiles) plus a MealTrackerCard per meal type. Owns a date-scoped
// @Query so it re-fetches when the user picks another day, and presents the
// add-food / edit-intake sheets.
struct NutritionDaySection: View {
    let date: Date
    let goalCalories: Int
    let goalProtein: Int
    let goalCarbs: Int
    let goalFat: Int

    @Query private var records: [MealRecord]

    @Environment(MealRepository.self) private var mealRepo

    @State private var addingMealType: MealType? = nil
    @State private var editingRecord: MealRecord? = nil

    init(date: Date, goalCalories: Int, goalProtein: Int, goalCarbs: Int, goalFat: Int) {
        self.date         = date
        self.goalCalories = goalCalories
        self.goalProtein  = goalProtein
        self.goalCarbs    = goalCarbs
        self.goalFat      = goalFat
        let start = Calendar.current.startOfDay(for: date)
        let end   = Calendar.current.date(byAdding: .day, value: 1, to: start)!
        _records  = Query(filter: #Predicate<MealRecord> { $0.date >= start && $0.date < end })
    }

    var body: some View {
        let totalCal  = records.reduce(0) { $0 + $1.calories }
        let totalPro  = records.reduce(0) { $0 + $1.protein }
        let totalCarb = records.reduce(0) { $0 + $1.carbs }
        let totalFat  = records.reduce(0) { $0 + $1.fat }

        VStack(spacing: 12) {
            if goalCalories > 0 {
                NutritionOverviewCard(
                    calories: totalCal,  goalCalories: goalCalories,
                    protein:  totalPro,  goalProtein:  goalProtein,
                    carbs:    totalCarb, goalCarbs:    goalCarbs,
                    fat:      totalFat,  goalFat:      goalFat
                )
                .padding(.horizontal, 16)
            } else {
                NutritionSummaryTiles(
                    calories: totalCal,
                    protein: totalPro,
                    carbs: totalCarb,
                    fat: totalFat
                )
                .padding(.horizontal, 16)
            }

            ForEach(MealType.allCases, id: \.self) { type in
                MealTrackerCard(
                    mealType: type,
                    items: records.filter { $0.mealType == type.rawValue },
                    onAdd: { addingMealType = type },
                    onEdit: { editingRecord = $0 },
                    onDelete: { try? mealRepo.delete($0) }
                )
                .padding(.horizontal, 16)
            }
        }
        .sheet(item: $addingMealType) { type in
            AddFoodSheet(date: date, mealType: type)
        }
        .sheet(item: $editingRecord) { record in
            EditIntakeSheet(record: record)
        }
    }
}

// MARK: - MealType Identifiable (for sheet binding)

extension MealType: Identifiable {
    var id: String { rawValue }
}
