import SwiftUI

struct NutritionGoalsView: View {
    @Environment(\.dismiss) private var dismiss

    @AppStorage("nutritionGoalCalories") private var goalCalories: Int = 0
    @AppStorage("nutritionGoalProtein")  private var goalProtein:  Int = 0
    @AppStorage("nutritionGoalCarbs")    private var goalCarbs:    Int = 0
    @AppStorage("nutritionGoalFat")      private var goalFat:      Int = 0

    @State private var caloriesStr = ""
    @State private var proteinStr  = ""
    @State private var carbsStr    = ""
    @State private var fatStr      = ""

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                navHeader

                VStack(spacing: 16) {
                    inputField(label: "每日熱量", unit: "kcal", value: $caloriesStr)
                    inputField(label: "蛋白質",   unit: "g",    value: $proteinStr)
                    inputField(label: "碳水化合物", unit: "g",  value: $carbsStr)
                    inputField(label: "脂肪",     unit: "g",    value: $fatStr)

                    Button {
                        goalCalories = Int(caloriesStr) ?? 0
                        goalProtein  = Int(proteinStr)  ?? 0
                        goalCarbs    = Int(carbsStr)    ?? 0
                        goalFat      = Int(fatStr)      ?? 0
                        dismiss()
                    } label: {
                        Text("儲存")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                            .background(Color.appBlueCTA)
                            .cornerRadius(12)
                    }
                }
                .padding(16)
                .background(Color.appCard)
                .cornerRadius(16)
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
            .padding(.bottom, 32)
        }
        .background(Color.appBackground)
        .scrollContentBackground(.hidden)
        .navigationBarHidden(true)
        .onAppear {
            caloriesStr = goalCalories > 0 ? "\(goalCalories)" : ""
            proteinStr  = goalProtein  > 0 ? "\(goalProtein)"  : ""
            carbsStr    = goalCarbs    > 0 ? "\(goalCarbs)"    : ""
            fatStr      = goalFat      > 0 ? "\(goalFat)"      : ""
        }
    }

    private var navHeader: some View {
        HStack {
            Button { dismiss() } label: {
                ZStack {
                    Circle().fill(Color.appCard).frame(width: 32, height: 32)
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.appTextSub)
                }
            }
            Text("飲食目標")
                .font(.appPageTitle)
                .foregroundColor(.appText)
                .padding(.leading, 4)
            Spacer()
        }
    }

    private func inputField(label: String, unit: String, value: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 4) {
                Text(label)
                    .font(.appLabel)
                    .foregroundColor(.appTextTert)
                Text("(\(unit))")
                    .font(.appCaption)
                    .foregroundColor(.appTextMuted)
            }
            TextField("0", text: value)
                .keyboardType(.numberPad)
                .font(.system(size: 15))
                .foregroundColor(.appText)
                .padding(.horizontal, 16)
                .frame(height: 48)
                .background(Color.appBackground)
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.appBorder, lineWidth: 1)
                )
        }
    }
}

#Preview {
    NavigationStack {
        NutritionGoalsView()
    }
}
