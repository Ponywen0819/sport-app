import SwiftUI

struct NutritionView: View {
    @State private var selectedDate = Date()

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                titleSection
                DateSelectorView(selectedDate: $selectedDate)
                    .padding(.horizontal, 16)
                WeeklySummaryCard()
                    .padding(.horizontal, 16)
                NutritionOverviewCard(hasGoals: true)
                    .padding(.horizontal, 16)
                MealTrackerCard(mealType: "早餐", items: MealItem.breakfast)
                    .padding(.horizontal, 16)
                MealTrackerCard(mealType: "午餐", items: [])
                    .padding(.horizontal, 16)
                MealTrackerCard(mealType: "晚餐", items: [])
                    .padding(.horizontal, 16)
                MealTrackerCard(mealType: "點心", items: [])
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

// MARK: - Mock Data

struct MealItem: Identifiable {
    let id = UUID()
    let name: String
    let intake: Int
    let calories: Int
    let protein: Int
    let fat: Int
    let carbs: Int

    static let breakfast = [
        MealItem(name: "雞胸肉", intake: 150, calories: 248, protein: 46, fat: 5, carbs: 0),
        MealItem(name: "白飯", intake: 200, calories: 260, protein: 5, fat: 1, carbs: 57),
    ]
}

// MARK: - Weekly Summary

struct WeeklySummaryCard: View {
    @State private var expanded = true

    private let dayLabels = ["一", "二", "三", "四", "五", "六", "日"]
    private let calorieRatios: [Double?] = [0.85, 0.95, 0.7, nil, 0.9, nil, nil]

    var body: some View {
        VStack(spacing: 0) {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    expanded.toggle()
                }
            } label: {
                HStack {
                    HStack(spacing: 8) {
                        Text("本週摘要")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.appTextSub)
                        Text("05/05 – 05/11")
                            .font(.system(size: 12))
                            .foregroundColor(.appTextTert)
                    }
                    Spacer()
                    HStack(spacing: 6) {
                        Text("4/7 天")
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
                            VStack(spacing: 4) {
                                ZStack(alignment: .bottom) {
                                    RoundedRectangle(cornerRadius: 3)
                                        .fill(Color.appBorder)
                                        .frame(height: 32)

                                    if let ratio = calorieRatios[i] {
                                        RoundedRectangle(cornerRadius: 3)
                                            .fill(ratio >= 0.9 ? Color.appEmeraldCTA : Color.appBlueCTA)
                                            .frame(height: max(CGFloat(ratio) * 32, 6))
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

                    // Stats
                    HStack(spacing: 8) {
                        summaryStatBox(label: "均卡路里", value: "1820", subLabel: "目標 2000")
                        summaryStatBox(label: "均蛋白質", value: "130g", subLabel: "目標 150g", valueColor: .appEmerald)
                        summaryStatBox(label: "達標天數", value: "3/7", subLabel: "≥90% 目標", valueColor: .appBlue)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
            }
        }
        .background(Color.appCard)
        .cornerRadius(16)
    }

    private func summaryStatBox(label: String, value: String, subLabel: String, valueColor: Color = .appText) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.system(size: 10))
                .foregroundColor(.appTextTert)
            Text(value)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(valueColor)
            Text(subLabel)
                .font(.system(size: 10))
                .foregroundColor(.appTextMuted)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.appBorder.opacity(0.5))
        .cornerRadius(12)
    }
}

// MARK: - Nutrition Overview

struct NutritionOverviewCard: View {
    let hasGoals: Bool

    var body: some View {
        if hasGoals {
            VStack(spacing: 12) {
                goalRow(label: "熱量", value: 1650, goal: 2000, unit: "kcal", barColor: .appRed, textColor: .appRed)
                goalRow(label: "蛋白質", value: 120, goal: 150, unit: "g", barColor: .appBlue, textColor: .appBlue)
                goalRow(label: "碳水", value: 200, goal: 250, unit: "g", barColor: .appGreen, textColor: .appGreen)
                goalRow(label: "脂肪", value: 55, goal: 65, unit: "g", barColor: .appYellow, textColor: .appYellow)
            }
            .padding(16)
            .background(Color.appCard)
            .cornerRadius(16)
        } else {
            HStack {
                statTile(label: "蛋白質", value: "120", unit: "g", color: .appBlue)
                statTile(label: "脂肪", value: "55", unit: "g", color: .appYellow)
                statTile(label: "碳水", value: "200", unit: "g", color: .appGreen)
                statTile(label: "熱量", value: "1650", unit: "kcal", color: .appRed)
            }
            .padding(16)
            .background(Color.appCard)
            .cornerRadius(16)
        }
    }

    private func goalRow(label: String, value: Int, goal: Int, unit: String, barColor: Color, textColor: Color) -> some View {
        let pct = min(Double(value) / Double(goal), 1.0)
        let isOver = value > goal
        let remaining = goal - value

        return VStack(spacing: 4) {
            HStack {
                Text(label)
                    .font(.system(size: 12))
                    .foregroundColor(.appTextTert)
                Spacer()
                HStack(alignment: .lastTextBaseline, spacing: 2) {
                    Text("\(value)")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(textColor)
                    Text("/ \(goal) \(unit)")
                        .font(.system(size: 12))
                        .foregroundColor(.appTextMuted)
                }
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color.appBorder)
                        .frame(height: 6)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(isOver ? Color.appRed : barColor)
                        .frame(width: geo.size.width * pct, height: 6)
                }
            }
            .frame(height: 6)

            HStack {
                Text(isOver ? "超出 \(abs(remaining)) \(unit)" : "還差 \(remaining) \(unit)")
                    .font(.system(size: 11))
                    .foregroundColor(isOver ? .appRed : .appTextTert)
                Spacer()
            }
        }
    }

    private func statTile(label: String, value: String, unit: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(label)
                .font(.system(size: 11))
                .foregroundColor(.appTextTert)
            Text(value)
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(color)
            Text(unit)
                .font(.system(size: 10))
                .foregroundColor(.appTextMuted)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Meal Tracker

struct MealTrackerCard: View {
    let mealType: String
    let items: [MealItem]

    private var totalCalories: Int { items.reduce(0) { $0 + $1.calories } }

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                HStack(spacing: 8) {
                    Text(mealType)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.appText)
                    if totalCalories > 0 {
                        Text("\(totalCalories) kcal")
                            .font(.system(size: 12))
                            .foregroundColor(.appTextTert)
                    }
                }
                Spacer()
                Button {
                    // Add food
                } label: {
                    ZStack {
                        Circle()
                            .fill(Color.appBorder)
                            .frame(width: 28, height: 28)
                        Image(systemName: "plus")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.appTextSub)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)

            // Items
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
                    Divider()
                        .background(Color.appBorder.opacity(0.5))

                    HStack(alignment: .center) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.name)
                                .font(.system(size: 14))
                                .foregroundColor(.appTextSub)
                            Text("\(item.intake)g · \(item.calories) kcal · P \(item.protein)g · F \(item.fat)g · C \(item.carbs)g")
                                .font(.system(size: 11))
                                .foregroundColor(.appTextTert)
                        }
                        Spacer()
                        HStack(spacing: 2) {
                            Button {
                                // Edit
                            } label: {
                                Image(systemName: "pencil")
                                    .font(.system(size: 13))
                                    .foregroundColor(.appTextMuted)
                                    .frame(width: 28, height: 28)
                            }
                            Button {
                                // Delete
                            } label: {
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
}

#Preview {
    NavigationStack {
        NutritionView()
    }
}
