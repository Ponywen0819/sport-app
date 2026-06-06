import SwiftUI

// MARK: - Main View

struct NutritionView: View {
    @State private var selectedDate = Date()

    @AppStorage("nutritionGoalCalories") private var goalCalories: Int = 0
    @AppStorage("nutritionGoalProtein")  private var goalProtein:  Int = 0
    @AppStorage("nutritionGoalCarbs")    private var goalCarbs:    Int = 0
    @AppStorage("nutritionGoalFat")      private var goalFat:      Int = 0

    private let calendar = Calendar.current

    private var weekDates: [Date] {
        let today = calendar.startOfDay(for: Date())
        let weekday = calendar.component(.weekday, from: today)
        let daysFromMonday = (weekday - 2 + 7) % 7
        let monday = calendar.date(byAdding: .day, value: -daysFromMonday, to: today)!
        return (0..<7).compactMap { calendar.date(byAdding: .day, value: $0, to: monday) }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                PageTitle("今日飲食")
                    .padding(.horizontal, 16)
                    .padding(.top, 16)
                    .padding(.bottom, 4)
                DateSelectorView(selectedDate: $selectedDate)
                    .padding(.horizontal, 16)
                WeeklyNutritionCard(weekDates: weekDates, goalCalories: goalCalories)
                    .padding(.horizontal, 16)
                NutritionDaySection(
                    date: selectedDate,
                    goalCalories: goalCalories,
                    goalProtein: goalProtein,
                    goalCarbs: goalCarbs,
                    goalFat: goalFat
                )
            }
            .padding(.bottom, 32)
        }
        .background(Color.appBackground)
        .scrollContentBackground(.hidden)
        .navigationBarHidden(true)
    }
}

#Preview {
    NavigationStack {
        NutritionView()
    }
}
