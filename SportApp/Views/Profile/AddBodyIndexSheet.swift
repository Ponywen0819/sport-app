import SwiftUI

struct AddBodyIndexSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(BodyIndexRepository.self) private var repo

    @State private var date = Date()
    @State private var weightStr = ""
    @State private var bodyFatStr = ""
    @State private var muscleStr = ""
    @State private var fatWeightStr = ""
    @State private var visceralStr = ""
    @State private var bmrStr = ""
    @State private var heightStr = ""
    @State private var waterStr = ""
    @State private var proteinStr = ""
    @State private var mineralStr = ""

    private var weight: Double? {
        guard let w = Double(weightStr), w > 0 else { return nil }
        return w
    }
    private var canSave: Bool { weight != nil }

    private func opt(_ s: String) -> Double? {
        let trimmed = s.trimmingCharacters(in: .whitespaces)
        return trimmed.isEmpty ? nil : Double(trimmed)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Date
                    HStack {
                        Text("量測日期")
                            .font(.system(size: 14))
                            .foregroundColor(.appTextSub)
                        Spacer()
                        DatePicker("", selection: $date, displayedComponents: .date)
                            .labelsHidden()
                            .colorScheme(.dark)
                    }
                    .padding(16)
                    .background(Color.appCard)
                    .cornerRadius(16)

                    // Inputs grid
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        inputField("體重 (kg)", text: $weightStr, required: true)
                        inputField("體脂率 (%)", text: $bodyFatStr)
                        inputField("骨骼肌重 (kg)", text: $muscleStr)
                        inputField("體脂重 (kg)", text: $fatWeightStr)
                        inputField("內臟脂肪指數", text: $visceralStr)
                        inputField("基礎代謝 (kcal)", text: $bmrStr)
                        inputField("身高 (cm)", text: $heightStr)
                        inputField("體內水分 (kg)", text: $waterStr)
                        inputField("蛋白質重 (kg)", text: $proteinStr)
                        inputField("礦物質重 (kg)", text: $mineralStr)
                    }

                    Button { save() } label: {
                        Text("儲存")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                            .background(canSave ? Color.appEmeraldCTA : Color.appBorder)
                            .cornerRadius(12)
                    }
                    .disabled(!canSave)
                }
                .padding(16)
            }
            .background(Color.appBackground)
            .scrollContentBackground(.hidden)
            .navigationTitle("新增量測")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.appCard, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("取消") { dismiss() }.foregroundColor(.appTextSub)
                }
            }
        }
    }

    private func inputField(_ label: String, text: Binding<String>, required: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 3) {
                Text(label)
                    .font(.system(size: 11))
                    .foregroundColor(.appTextTert)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                if required {
                    Text("*").font(.system(size: 11)).foregroundColor(.appRed)
                }
            }
            TextField("—", text: text)
                .keyboardType(.decimalPad)
                .font(.system(size: 20, weight: .semibold))
                .foregroundColor(.appText)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
                .frame(height: 44)
                .background(Color.appBackground)
                .cornerRadius(10)
        }
        .padding(12)
        .background(Color.appCard)
        .cornerRadius(14)
    }

    private func save() {
        guard let w = weight else { return }
        let record = BodyIndex(
            date: date,
            weight: w,
            bodyFatPercentage: opt(bodyFatStr),
            skeletalMuscleWeight: opt(muscleStr),
            bodyFatWeight: opt(fatWeightStr),
            visceralFatIndex: opt(visceralStr),
            basalMetabolicRate: opt(bmrStr),
            height: opt(heightStr),
            totalWater: opt(waterStr),
            proteinWeight: opt(proteinStr),
            mineralWeight: opt(mineralStr)
        )
        try? repo.save(record)
        dismiss()
    }
}
