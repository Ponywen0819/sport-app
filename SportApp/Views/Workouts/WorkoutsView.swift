import SwiftUI
import SwiftData

// MARK: - Main View

struct WorkoutsView: View {
    @State private var selectedDate = Date()
    @State private var displayUnit: WeightUnit = .pounds
    @Query private var allBlocks: [WorkoutBlock]

    private let calendar = Calendar.current

    private var trainedDates: Set<String> {
        Set(allBlocks.filter { !$0.sets.isEmpty }.map { DateFormat.dayKey($0.date) })
    }

    // Monday-indexed week containing today
    private var weekDates: [Date] {
        let today = calendar.startOfDay(for: Date())
        let weekday = calendar.component(.weekday, from: today) // 1=Sun, 2=Mon...7=Sat
        let daysFromMonday = (weekday - 2 + 7) % 7
        let monday = calendar.date(byAdding: .day, value: -daysFromMonday, to: today)!
        return (0..<7).compactMap { calendar.date(byAdding: .day, value: $0, to: monday) }
    }

    private var setsByDay: [Int?] {
        weekDates.map { day in
            let key = DateFormat.dayKey(day)
            let count = allBlocks
                .filter { DateFormat.dayKey($0.date) == key }
                .reduce(0) { $0 + $1.sets.count }
            return count > 0 ? count : nil
        }
    }

    private var todayIndex: Int {
        let today = calendar.startOfDay(for: Date())
        return weekDates.firstIndex { calendar.isDate($0, inSameDayAs: today) } ?? -1
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                titleSection
                DateSelectorView(selectedDate: $selectedDate, trainedDates: trainedDates)
                    .padding(.horizontal, 16)
                WeeklyWorkoutSummaryCard(setsByDay: setsByDay, todayIndex: todayIndex)
                    .padding(.horizontal, 16)
                WorkoutDaySection(date: selectedDate, displayUnit: $displayUnit)
                    .padding(.horizontal, 16)
            }
            .padding(.bottom, 32)
        }
        .background(Color.appBackground)
        .scrollContentBackground(.hidden)
        .navigationBarHidden(true)
    }

    private var titleSection: some View {
        HStack {
            Text("運動紀錄")
                .font(.appPageTitle)
                .foregroundColor(.appText)
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.top, 16)
        .padding(.bottom, 4)
    }
}

#Preview {
    NavigationStack {
        WorkoutsView()
    }
    .modelContainer(for: [WorkoutBlock.self, WorkoutSet.self], inMemory: true)
}
