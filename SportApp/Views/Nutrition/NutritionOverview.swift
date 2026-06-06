import SwiftUI

// The day's macro overview, shown above the meal trackers. Two variants:
// NutritionOverviewCard renders goal-progress bars when targets are set, while
// NutritionSummaryTiles shows a plain four-up macro readout when they aren't.

// MARK: - Nutrition Overview (with goals)

struct NutritionOverviewCard: View {
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
        .appCard()
    }

    private func goalRow(label: String, value: Double, goal: Double, unit: String, barColor: Color, textColor: Color) -> some View {
        let pct = min(value / goal, 1.0)
        let isOver = value > goal
        let remaining = Int(goal - value)

        return VStack(spacing: 4) {
            HStack {
                Text(label)
                    .font(.appCaption)
                    .foregroundColor(.appTextTert)
                Spacer()
                HStack(alignment: .lastTextBaseline, spacing: 2) {
                    Text(fmt(value))
                        .font(.appCardLabel)
                        .foregroundColor(textColor)
                    Text("/ \(Int(goal)) \(unit)")
                        .font(.appCaption)
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
                    .font(.appMicro)
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

struct NutritionSummaryTiles: View {
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
        .appCard()
    }

    private func tile(label: String, value: Double, unit: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(label).font(.appMicro).foregroundColor(.appTextTert)
            Text(fmt(value)).font(.appStatValue).foregroundColor(color)
            Text(unit).font(.appMicro).foregroundColor(.appTextMuted)
        }
        .frame(maxWidth: .infinity)
    }

    private func fmt(_ v: Double) -> String {
        v.truncatingRemainder(dividingBy: 1) == 0 ? "\(Int(v))" : String(format: "%.1f", v)
    }
}
