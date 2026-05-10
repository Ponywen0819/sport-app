import SwiftUI
import SwiftData

struct AddSetSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(WorkoutRepository.self) private var repo

    let block: WorkoutBlock
    let displayUnit: WeightUnit

    @State private var inputUnit: WeightUnit
    @State private var weightInput: String
    @State private var repsInput: String

    init(block: WorkoutBlock, displayUnit: WeightUnit) {
        self.block = block
        self.displayUnit = displayUnit
        _inputUnit = State(initialValue: displayUnit)

        if let last = block.sets.max(by: { $0.orderIndex < $1.orderIndex }) {
            let w = displayUnit == .pounds ? last.weightKg * 2.20462 : last.weightKg
            _weightInput = State(initialValue: String(format: "%.1f", w))
            _repsInput = State(initialValue: "\(last.reps)")
        } else {
            _weightInput = State(initialValue: "")
            _repsInput = State(initialValue: "")
        }
    }

    private var weightKg: Double? {
        guard let w = Double(weightInput), w > 0 else { return nil }
        return inputUnit == .pounds ? w / 2.20462 : w
    }
    private var reps: Int? {
        guard let r = Int(repsInput), r > 0 else { return nil }
        return r
    }
    private var canSave: Bool { weightKg != nil && reps != nil }

    private var previewText: String {
        guard let kg = weightKg, let r = reps else { return "—" }
        let wStr = inputUnit == .pounds
            ? "\(Int((kg * 2.20462).rounded())) 磅"
            : "\(Int(kg)) kg"
        return "\(wStr) · \(r) 下"
    }

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(block.exerciseName)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.appText)
                    Text("第 \(block.sets.count + 1) 組")
                        .font(.system(size: 13))
                        .foregroundColor(.appTextTert)
                }
                .padding(.top, 8)

                Divider().background(Color.appBorder)

                // Weight
                VStack(alignment: .leading, spacing: 8) {
                    Text("重量")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.appTextTert)
                    HStack(spacing: 12) {
                        TextField("0", text: $weightInput)
                            .keyboardType(.decimalPad)
                            .font(.system(size: 26, weight: .semibold))
                            .foregroundColor(.appText)
                            .multilineTextAlignment(.center)
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .background(Color.appCard)
                            .cornerRadius(12)

                        VStack(spacing: 0) {
                            ForEach(WeightUnit.allCases, id: \.self) { unit in
                                Button { convertWeight(to: unit) } label: {
                                    Text(unit.rawValue)
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundColor(inputUnit == unit ? .appText : .appTextTert)
                                        .frame(width: 56, height: 28)
                                        .background(inputUnit == unit ? Color.appBorder : Color.clear)
                                }
                            }
                        }
                        .background(Color.appBorder.opacity(0.6))
                        .cornerRadius(10)
                    }
                }

                // Reps
                VStack(alignment: .leading, spacing: 8) {
                    Text("次數")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.appTextTert)
                    TextField("0", text: $repsInput)
                        .keyboardType(.numberPad)
                        .font(.system(size: 26, weight: .semibold))
                        .foregroundColor(.appText)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(Color.appCard)
                        .cornerRadius(12)
                }

                Text(previewText)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.appTextTert)
                    .frame(maxWidth: .infinity)
                    .multilineTextAlignment(.center)

                Spacer()

                Button { save() } label: {
                    Text("加入此區塊")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(canSave ? Color.appBlueCTA : Color.appBorder)
                        .cornerRadius(12)
                }
                .disabled(!canSave)
            }
            .padding(16)
            .background(Color.appBackground)
            .navigationTitle("追加一組")
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

    private func convertWeight(to unit: WeightUnit) {
        guard inputUnit != unit, let w = Double(weightInput) else { inputUnit = unit; return }
        weightInput = String(format: "%.1f", unit == .kg ? w / 2.20462 : w * 2.20462)
        inputUnit = unit
    }

    private func save() {
        guard let kg = weightKg, let r = reps else { return }
        try? repo.addSet(WorkoutSet(orderIndex: block.sets.count, weightKg: kg, reps: r), to: block)
        dismiss()
    }
}
