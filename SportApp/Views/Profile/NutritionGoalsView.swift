import SwiftUI

struct NutritionGoalsView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var calories = "2000"
    @State private var protein = "150"
    @State private var carbs = "250"
    @State private var fat = "65"

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                navHeader

                VStack(spacing: 16) {
                    inputField(label: "每日熱量", unit: "kcal", value: $calories)
                    inputField(label: "蛋白質",   unit: "g",    value: $protein)
                    inputField(label: "碳水化合物", unit: "g",  value: $carbs)
                    inputField(label: "脂肪",     unit: "g",    value: $fat)

                    Button {
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
    }

    private var navHeader: some View {
        HStack {
            Button { dismiss() } label: {
                ZStack {
                    Circle()
                        .fill(Color.appCard)
                        .frame(width: 32, height: 32)
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.appTextSub)
                }
            }
            Text("飲食目標")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.appText)
                .padding(.leading, 4)
            Spacer()
        }
    }

    private func inputField(label: String, unit: String, value: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 4) {
                Text(label)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.appTextTert)
                Text("(\(unit))")
                    .font(.system(size: 12))
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
