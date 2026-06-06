import SwiftUI

// One meal's tracker card (早餐 / 午餐 / 晚餐 / 點心): header with the meal name,
// running calorie total, and an add button, followed by the logged food rows
// (each with edit / delete) or an empty hint.
struct MealTrackerCard: View {
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
                        .font(.appCardLabel)
                        .foregroundColor(.appText)
                    if totalCalories > 0 {
                        Text("\(Int(totalCalories)) kcal")
                            .font(.appCaption)
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
                        .font(.appCaption)
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
                                .font(.appBody)
                                .foregroundColor(.appTextSub)
                            Text("\(fmt(item.intake))g · \(fmt(item.calories)) kcal · P \(fmt(item.protein))g · F \(fmt(item.fat))g · C \(fmt(item.carbs))g")
                                .font(.appMicro)
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
        .appCard()
    }

    private func fmt(_ v: Double) -> String {
        v.truncatingRemainder(dividingBy: 1) == 0 ? "\(Int(v))" : String(format: "%.1f", v)
    }
}
