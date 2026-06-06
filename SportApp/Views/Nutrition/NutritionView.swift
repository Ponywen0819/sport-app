import SwiftUI
import SwiftData

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
                titleSection
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

    private var titleSection: some View {
        HStack {
            Text("今日飲食")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.appText)
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.top, 16)
        .padding(.bottom, 4)
    }
}

// MARK: - Day Section (owns @Query for the selected date)

private struct NutritionDaySection: View {
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

// MARK: - Nutrition Overview (with goals)

private struct NutritionOverviewCard: View {
    let calories: Double;  let goalCalories: Int
    let protein:  Double;  let goalProtein:  Int
    let carbs:    Double;  let goalCarbs:    Int
    let fat:      Double;  let goalFat:      Int

    var body: some View {
        VStack(spacing: 12) {
            if goalCalories > 0 {
                goalRow(label: "熱量",   value: calories, goal: Double(goalCalories), unit: "kcal", barColor: .appRed,    textColor: .appRed)
            }
            if goalProtein > 0 {
                goalRow(label: "蛋白質", value: protein,  goal: Double(goalProtein),  unit: "g",    barColor: .appBlue,   textColor: .appBlue)
            }
            if goalCarbs > 0 {
                goalRow(label: "碳水",   value: carbs,    goal: Double(goalCarbs),    unit: "g",    barColor: .appGreen,  textColor: .appGreen)
            }
            if goalFat > 0 {
                goalRow(label: "脂肪",   value: fat,      goal: Double(goalFat),      unit: "g",    barColor: .appYellow, textColor: .appYellow)
            }
        }
        .padding(16)
        .background(Color.appCard)
        .cornerRadius(16)
    }

    private func goalRow(label: String, value: Double, goal: Double, unit: String, barColor: Color, textColor: Color) -> some View {
        let pct = min(value / goal, 1.0)
        let isOver = value > goal
        let remaining = Int(goal - value)

        return VStack(spacing: 4) {
            HStack {
                Text(label)
                    .font(.system(size: 12))
                    .foregroundColor(.appTextTert)
                Spacer()
                HStack(alignment: .lastTextBaseline, spacing: 2) {
                    Text(fmt(value))
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(textColor)
                    Text("/ \(Int(goal)) \(unit)")
                        .font(.system(size: 12))
                        .foregroundColor(.appTextMuted)
                }
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3).fill(Color.appBorder).frame(height: 6)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(isOver ? Color.appRed : barColor)
                        .frame(width: geo.size.width * pct, height: 6)
                }
            }
            .frame(height: 6)
            HStack {
                Text(isOver
                     ? "超出 \(abs(remaining)) \(unit)"
                     : "還差 \(remaining) \(unit)")
                    .font(.system(size: 11))
                    .foregroundColor(isOver ? .appRed : .appTextTert)
                Spacer()
            }
        }
    }

    private func fmt(_ v: Double) -> String {
        v.truncatingRemainder(dividingBy: 1) == 0 ? "\(Int(v))" : String(format: "%.1f", v)
    }
}

// MARK: - Summary Tiles (no goals)

private struct NutritionSummaryTiles: View {
    let calories: Double
    let protein:  Double
    let carbs:    Double
    let fat:      Double

    var body: some View {
        HStack(spacing: 0) {
            tile(label: "蛋白質", value: protein,  unit: "g",    color: .appBlue)
            tile(label: "脂肪",   value: fat,      unit: "g",    color: .appYellow)
            tile(label: "碳水",   value: carbs,    unit: "g",    color: .appGreen)
            tile(label: "熱量",   value: calories, unit: "kcal", color: .appRed)
        }
        .padding(16)
        .background(Color.appCard)
        .cornerRadius(16)
    }

    private func tile(label: String, value: Double, unit: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(label).font(.system(size: 11)).foregroundColor(.appTextTert)
            Text(fmt(value)).font(.system(size: 18, weight: .bold)).foregroundColor(color)
            Text(unit).font(.system(size: 10)).foregroundColor(.appTextMuted)
        }
        .frame(maxWidth: .infinity)
    }

    private func fmt(_ v: Double) -> String {
        v.truncatingRemainder(dividingBy: 1) == 0 ? "\(Int(v))" : String(format: "%.1f", v)
    }
}

// MARK: - Meal Tracker Card

private struct MealTrackerCard: View {
    let mealType: MealType
    let items: [MealRecord]
    let onAdd: () -> Void
    let onEdit: (MealRecord) -> Void
    let onDelete: (MealRecord) -> Void

    private var totalCalories: Double { items.reduce(0) { $0 + $1.calories } }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                HStack(spacing: 8) {
                    Text(mealType.rawValue)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.appText)
                    if totalCalories > 0 {
                        Text("\(Int(totalCalories)) kcal")
                            .font(.system(size: 12))
                            .foregroundColor(.appTextTert)
                    }
                }
                Spacer()
                Button(action: onAdd) {
                    ZStack {
                        Circle().fill(Color.appBorder).frame(width: 28, height: 28)
                        Image(systemName: "plus")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.appTextSub)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)

            if items.isEmpty {
                HStack {
                    Text("尚無紀錄，點擊 + 新增")
                        .font(.system(size: 12))
                        .foregroundColor(.appTextMuted)
                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 12)
            } else {
                ForEach(items) { item in
                    Divider().background(Color.appBorder.opacity(0.5))
                    HStack(alignment: .center) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.foodName)
                                .font(.system(size: 14))
                                .foregroundColor(.appTextSub)
                            Text("\(fmt(item.intake))g · \(fmt(item.calories)) kcal · P \(fmt(item.protein))g · F \(fmt(item.fat))g · C \(fmt(item.carbs))g")
                                .font(.system(size: 11))
                                .foregroundColor(.appTextTert)
                        }
                        Spacer()
                        HStack(spacing: 2) {
                            Button { onEdit(item) } label: {
                                Image(systemName: "pencil")
                                    .font(.system(size: 13))
                                    .foregroundColor(.appTextMuted)
                                    .frame(width: 28, height: 28)
                            }
                            Button { onDelete(item) } label: {
                                Image(systemName: "trash")
                                    .font(.system(size: 13))
                                    .foregroundColor(.appTextMuted)
                                    .frame(width: 28, height: 28)
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                }
            }
        }
        .background(Color.appCard)
        .cornerRadius(16)
    }

    private func fmt(_ v: Double) -> String {
        v.truncatingRemainder(dividingBy: 1) == 0 ? "\(Int(v))" : String(format: "%.1f", v)
    }
}

// MARK: - Weekly Nutrition Card

private struct WeeklyNutritionCard: View {
    let weekDates: [Date]
    let goalCalories: Int

    @Query private var weekRecords: [MealRecord]
    @State private var expanded = true

    private let calendar = Calendar.current
    private let dayLabels = ["一", "二", "三", "四", "五", "六", "日"]

    init(weekDates: [Date], goalCalories: Int) {
        self.weekDates    = weekDates
        self.goalCalories = goalCalories
        let start = weekDates.first!
        let end   = Calendar.current.date(byAdding: .day, value: 1, to: weekDates.last!)!
        _weekRecords = Query(filter: #Predicate<MealRecord> { $0.date >= start && $0.date < end })
    }

    private var dayCalories: [Double] {
        weekDates.map { date in
            let start = calendar.startOfDay(for: date)
            let end   = calendar.date(byAdding: .day, value: 1, to: start)!
            return weekRecords
                .filter { $0.date >= start && $0.date < end }
                .reduce(0) { $0 + $1.calories }
        }
    }

    private var recordedDays: Int { dayCalories.filter { $0 > 0 }.count }

    private var weekRange: String {
        guard let first = weekDates.first, let last = weekDates.last else { return "" }
        return "\(DateFormat.shortDate(first)) – \(DateFormat.shortDate(last))"
    }

    private var avgCalories: Double {
        let days = dayCalories.filter { $0 > 0 }
        guard !days.isEmpty else { return 0 }
        return days.reduce(0, +) / Double(days.count)
    }

    private var avgProtein: Double {
        let days = weekDates.enumerated().compactMap { i, date -> Double? in
            let start = calendar.startOfDay(for: date)
            let end   = calendar.date(byAdding: .day, value: 1, to: start)!
            let p = weekRecords.filter { $0.date >= start && $0.date < end }.reduce(0) { $0 + $1.protein }
            return p > 0 ? p : nil
        }
        guard !days.isEmpty else { return 0 }
        return days.reduce(0, +) / Double(days.count)
    }

    private var goalDays: Int {
        guard goalCalories > 0 else { return 0 }
        return dayCalories.filter { $0 >= Double(goalCalories) * 0.9 }.count
    }

    var body: some View {
        VStack(spacing: 0) {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) { expanded.toggle() }
            } label: {
                HStack {
                    HStack(spacing: 8) {
                        Text("本週摘要")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.appTextSub)
                        Text(weekRange)
                            .font(.system(size: 12))
                            .foregroundColor(.appTextTert)
                    }
                    Spacer()
                    HStack(spacing: 6) {
                        Text("\(recordedDays)/7 天")
                            .font(.system(size: 12))
                            .foregroundColor(.appTextTert)
                        Image(systemName: expanded ? "chevron.up" : "chevron.down")
                            .font(.system(size: 12))
                            .foregroundColor(.appTextTert)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }
            .buttonStyle(.plain)

            if expanded {
                VStack(spacing: 12) {
                    // Bar chart
                    HStack(alignment: .bottom, spacing: 4) {
                        ForEach(0..<7, id: \.self) { i in
                            let cal = dayCalories[i]
                            let ratio: Double? = cal > 0
                                ? (goalCalories > 0 ? min(cal / Double(goalCalories), 1.0) : 0.5)
                                : nil
                            VStack(spacing: 4) {
                                ZStack(alignment: .bottom) {
                                    RoundedRectangle(cornerRadius: 3)
                                        .fill(Color.appBorder)
                                        .frame(height: 32)
                                    if let r = ratio {
                                        RoundedRectangle(cornerRadius: 3)
                                            .fill(r >= 0.9 ? Color.appEmeraldCTA : Color.appBlueCTA)
                                            .frame(height: max(CGFloat(r) * 32, 6))
                                    }
                                }
                                Text(dayLabels[i])
                                    .font(.system(size: 10))
                                    .foregroundColor(.appTextMuted)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                    .frame(height: 48)

                    HStack(spacing: 8) {
                        statBox(label: "均卡路里",
                                value: avgCalories > 0 ? "\(Int(avgCalories))" : "—",
                                subLabel: goalCalories > 0 ? "目標 \(goalCalories)" : "未設定目標")
                        statBox(label: "均蛋白質",
                                value: avgProtein > 0 ? "\(Int(avgProtein))g" : "—",
                                subLabel: "過去 \(recordedDays) 天平均",
                                valueColor: .appEmerald)
                        if goalCalories > 0 {
                            statBox(label: "達標天數",
                                    value: "\(goalDays)/7",
                                    subLabel: "≥90% 目標",
                                    valueColor: .appBlue)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
            }
        }
        .background(Color.appCard)
        .cornerRadius(16)
    }

    private func statBox(label: String, value: String, subLabel: String, valueColor: Color = .appText) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.system(size: 10)).foregroundColor(.appTextTert)
            Text(value).font(.system(size: 14, weight: .semibold)).foregroundColor(valueColor)
            Text(subLabel).font(.system(size: 10)).foregroundColor(.appTextMuted)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.appBorder.opacity(0.5))
        .cornerRadius(12)
    }
}

// MARK: - MealType Identifiable (for sheet binding)

extension MealType: Identifiable {
    var id: String { rawValue }
}

#Preview {
    NavigationStack {
        NutritionView()
    }
}
