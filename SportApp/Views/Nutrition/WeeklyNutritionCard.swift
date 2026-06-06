import SwiftUI
import SwiftData

// Collapsible "本週摘要" card: a seven-day calorie bar chart plus average /
// goal-day stat boxes. Owns its own week-scoped @Query so the chart and stats
// stay in sync with logged meals across the week.
struct WeeklyNutritionCard: View {
    let weekDates: [Date]
    let goalCalories: Int

    @Query private var weekRecords: [MealRecord]
    @State private var expanded = true

    private let calendar = Calendar.current
    private let dayLabels = DateFormat.weekdayInitialsMondayFirst

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
                            .font(.appCardLabel)
                            .foregroundColor(.appTextSub)
                        Text(weekRange)
                            .font(.appCaption)
                            .foregroundColor(.appTextTert)
                    }
                    Spacer()
                    HStack(spacing: 6) {
                        Text("\(recordedDays)/7 天")
                            .font(.appCaption)
                            .foregroundColor(.appTextTert)
                        Image(systemName: expanded ? "chevron.up" : "chevron.down")
                            .font(.appCaption)
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
                                    .font(.appMicro)
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
        .appCard()
    }

    private func statBox(label: String, value: String, subLabel: String, valueColor: Color = .appText) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.appMicro).foregroundColor(.appTextTert)
            Text(value).font(.appCardLabel).foregroundColor(valueColor)
            Text(subLabel).font(.appMicro).foregroundColor(.appTextMuted)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.appBorder.opacity(0.5))
        .cornerRadius(12)
    }
}
