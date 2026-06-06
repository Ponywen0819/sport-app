import SwiftUI
import SwiftData

struct HomeView: View {
    @Query private var allBlocks: [WorkoutBlock]
    @Query(sort: \BodyIndex.date, order: .reverse) private var bodyRecords: [BodyIndex]

    @AppStorage("nutritionGoalCalories") private var goalCalories: Int = 0
    @AppStorage("nutritionGoalProtein")  private var goalProtein:  Int = 0
    @AppStorage("nutritionGoalCarbs")    private var goalCarbs:    Int = 0
    @AppStorage("nutritionGoalFat")      private var goalFat:      Int = 0

    private let weekDayLabels = ["一", "二", "三", "四", "五", "六", "日"]
    private let calendar = Calendar.current

    // MARK: Computed

    private var weekDates: [Date] {
        let today = calendar.startOfDay(for: Date())
        let weekday = calendar.component(.weekday, from: today)
        let daysFromMonday = (weekday - 2 + 7) % 7
        let monday = calendar.date(byAdding: .day, value: -daysFromMonday, to: today)!
        return (0..<7).compactMap { calendar.date(byAdding: .day, value: $0, to: monday) }
    }

    private var todayIndex: Int {
        let today = calendar.startOfDay(for: Date())
        return weekDates.firstIndex { calendar.isDate($0, inSameDayAs: today) } ?? -1
    }

    private var trainedDateKeys: Set<String> {
        Set(allBlocks.filter { !$0.sets.isEmpty }.map { DateFormat.dayKey($0.date) })
    }

    private var weekTrainingStatus: [Bool] {
        weekDates.map { trainedDateKeys.contains(DateFormat.dayKey($0)) }
    }

    private var trainedDaysCount: Int { weekTrainingStatus.filter { $0 }.count }

    private var latestBody: BodyIndex? { bodyRecords.first }

    // MARK: Body

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                titleSection
                weeklyTrainingCard
                if let body = latestBody {
                    bodyMetricsCard(record: body)
                }
                if goalCalories > 0 {
                    HomeDayNutritionCard(
                        goalCalories: goalCalories,
                        goalProtein: goalProtein,
                        goalCarbs: goalCarbs,
                        goalFat: goalFat
                    )
                }
                quickNavSection
            }
            .padding(.horizontal, 16)
            .padding(.top, 24)
            .padding(.bottom, 32)
        }
        .background(Color.appBackground)
        .scrollContentBackground(.hidden)
        .navigationBarHidden(true)
    }

    // MARK: Title

    private var titleSection: some View {
        HStack {
            Text("運動紀錄")
                .font(.appTitle)
                .foregroundColor(.appText)
            Spacer()
        }
    }

    // MARK: Weekly Training Card

    private var weeklyTrainingCard: some View {
        VStack(spacing: 12) {
            HStack {
                Text("本週訓練")
                    .font(.appCardLabel)
                    .foregroundColor(.appTextSub)
                Spacer()
                HStack(spacing: 2) {
                    Text("\(trainedDaysCount)")
                        .font(.appControlLabel)
                        .foregroundColor(.appEmerald)
                    Text("/ 7 天")
                        .font(.appCaption)
                        .foregroundColor(.appTextTert)
                }
            }

            HStack(spacing: 0) {
                ForEach(0..<7, id: \.self) { index in
                    dayColumn(index: index, trained: weekTrainingStatus[index])
                }
            }
        }
        .padding(16)
        .background(Color.appCard)
        .cornerRadius(16)
    }

    private func dayColumn(index: Int, trained: Bool) -> some View {
        let isToday = index == todayIndex
        return VStack(spacing: 6) {
            Text(weekDayLabels[index])
                .font(.appLabel)
                .foregroundColor(isToday ? .appTextSub : .appTextTert)

            ZStack {
                if isToday {
                    Circle()
                        .stroke(Color.appBlue, lineWidth: 2)
                        .frame(width: 36, height: 36)
                }
                Circle()
                    .fill(trained ? Color.appEmerald.opacity(0.2) : Color.clear)
                    .overlay(
                        Circle().stroke(
                            trained ? Color.appEmerald.opacity(0.5) : Color.appBorder,
                            lineWidth: 1
                        )
                    )
                    .frame(width: 30, height: 30)
                if trained {
                    Circle()
                        .fill(Color.appEmerald)
                        .frame(width: 10, height: 10)
                }
            }
            .frame(width: 36, height: 36)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: Body Metrics Card

    private func resolveBody(_ keyPath: KeyPath<BodyIndex, Double?>) -> (value: Double, isFilled: Bool)? {
        for (i, record) in bodyRecords.enumerated() {
            if let v = record[keyPath: keyPath] {
                return (v, i > 0)
            }
        }
        return nil
    }

    private func bodyMetricsCard(record: BodyIndex) -> some View {
        let bodyFat = resolveBody(\.bodyFatPercentage)
        let muscle  = resolveBody(\.skeletalMuscleWeight)

        return NavigationLink(destination: BodyIndexView()) {
            VStack(spacing: 12) {
                HStack {
                    Text("身體指標")
                        .font(.appCardLabel)
                        .foregroundColor(.appTextSub)
                    Spacer()
                    Text(DateFormat.dayKey(record.date))
                        .font(.appCaption)
                        .foregroundColor(.appTextMuted)
                }
                HStack {
                    bodyMetricItem(label: "體重",
                                   value: fmtVal(record.weight),
                                   unit: "kg",
                                   color: .appBlue,
                                   filled: false)
                    bodyMetricItem(label: "體脂率",
                                   value: bodyFat.map { fmtVal($0.value) } ?? "—",
                                   unit: bodyFat != nil ? "%" : "",
                                   color: .appOrange,
                                   filled: bodyFat?.isFilled ?? false)
                    bodyMetricItem(label: "骨骼肌",
                                   value: muscle.map { fmtVal($0.value) } ?? "—",
                                   unit: muscle != nil ? "kg" : "",
                                   color: .appEmerald,
                                   filled: muscle?.isFilled ?? false)
                }
            }
            .padding(16)
            .background(Color.appCard)
            .cornerRadius(16)
        }
        .buttonStyle(.plain)
    }

    private func bodyMetricItem(label: String, value: String, unit: String, color: Color, filled: Bool) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 3) {
                Text(label)
                    .font(.appCaption)
                    .foregroundColor(.appTextTert)
                if filled {
                    Image(systemName: "clock.arrow.circlepath")
                        .font(.system(size: 9))
                        .foregroundColor(.appTextMuted)
                }
            }
            HStack(alignment: .lastTextBaseline, spacing: 2) {
                Text(value)
                    .font(.appStatValue)
                    .foregroundColor(value == "—" ? .appTextTert : (filled ? color.opacity(0.6) : color))
                if !unit.isEmpty && value != "—" {
                    Text(unit)
                        .font(.appMicro)
                        .foregroundColor(.appTextTert)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: Quick Nav

    private var quickNavSection: some View {
        VStack(spacing: 12) {
            SectionLabel(text: "快速導航")
            HStack(spacing: 12) {
                NavigationLink(destination: BodyIndexView()) {
                    quickNavCard(
                        icon: "person.fill",
                        iconColor: .appOrange,
                        iconBg: Color.appOrange.opacity(0.15),
                        title: "身體指標",
                        subtitle: "體重、體脂率紀錄"
                    )
                }
                .buttonStyle(.plain)

                NavigationLink(destination: WorkoutsView()) {
                    quickNavCard(
                        icon: "dumbbell.fill",
                        iconColor: .appEmerald,
                        iconBg: Color.appEmerald.opacity(0.15),
                        title: "運動紀錄",
                        subtitle: "追蹤訓練進度"
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func quickNavCard(icon: String, iconColor: Color, iconBg: Color, title: String, subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(iconBg)
                    .frame(width: 40, height: 40)
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(iconColor)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.appCardLabel)
                    .foregroundColor(.appText)
                Text(subtitle)
                    .font(.appCaption)
                    .foregroundColor(.appTextTert)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.appCard)
        .cornerRadius(16)
    }

    // MARK: Helpers

    private func fmtVal(_ v: Double) -> String {
        v.truncatingRemainder(dividingBy: 1) == 0
            ? "\(Int(v))"
            : String(format: "%.1f", v)
    }

    private func fmtOpt(_ v: Double?) -> String {
        guard let v else { return "—" }
        return fmtVal(v)
    }
}

// MARK: - Today's Nutrition Card (child view owns @Query)

private struct HomeDayNutritionCard: View {
    let goalCalories: Int
    let goalProtein:  Int
    let goalCarbs:    Int
    let goalFat:      Int

    @Query private var todayRecords: [MealRecord]

    init(goalCalories: Int, goalProtein: Int, goalCarbs: Int, goalFat: Int) {
        self.goalCalories = goalCalories
        self.goalProtein  = goalProtein
        self.goalCarbs    = goalCarbs
        self.goalFat      = goalFat
        let start = Calendar.current.startOfDay(for: Date())
        let end   = Calendar.current.date(byAdding: .day, value: 1, to: start)!
        _todayRecords = Query(filter: #Predicate<MealRecord> { $0.date >= start && $0.date < end })
    }

    private var totalCalories: Double { todayRecords.reduce(0) { $0 + $1.calories } }
    private var totalProtein:  Double { todayRecords.reduce(0) { $0 + $1.protein  } }

    var body: some View {
        NavigationLink(destination: NutritionView()) {
            VStack(spacing: 12) {
                HStack {
                    Text("今日營養")
                        .font(.appCardLabel)
                        .foregroundColor(.appTextSub)
                    Spacer()
                    Text("\(Int(totalCalories)) / \(goalCalories) kcal")
                        .font(.appCaption)
                        .foregroundColor(.appTextMuted)
                }

                nutritionBar(value: totalCalories, goal: Double(goalCalories), color: .appRed, label: "熱量")
                if goalProtein > 0 {
                    nutritionBar(value: totalProtein, goal: Double(goalProtein), color: .appBlue, label: "蛋白質")
                }
            }
            .padding(16)
            .background(Color.appCard)
            .cornerRadius(16)
        }
        .buttonStyle(.plain)
    }

    private func nutritionBar(value: Double, goal: Double, color: Color, label: String) -> some View {
        let pct = min(value / max(goal, 1), 1.0)
        return VStack(spacing: 4) {
            HStack {
                Text(label)
                    .font(.appMicro)
                    .foregroundColor(.appTextTert)
                Spacer()
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3).fill(Color.appBorder).frame(height: 6)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(value > goal ? Color.appRed : color)
                        .frame(width: geo.size.width * pct, height: 6)
                }
            }
            .frame(height: 6)
        }
    }
}

#Preview {
    let config = ModelConfiguration(isStoredInMemoryOnly: true)
    let container = try! ModelContainer(for: WorkoutBlock.self, WorkoutSet.self, BodyIndex.self, Food.self, MealRecord.self, configurations: config)
    return NavigationStack {
        HomeView()
    }
    .modelContainer(container)
    .environment(WorkoutRepository(context: container.mainContext))
    .environment(BodyIndexRepository(context: container.mainContext))
    .environment(FoodRepository(context: container.mainContext))
    .environment(MealRepository(context: container.mainContext))
}
