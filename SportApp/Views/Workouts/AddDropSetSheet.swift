import SwiftUI
import SwiftData

struct AddDropSetSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(WorkoutRepository.self) private var repo

    let block: WorkoutBlock
    let displayUnit: WeightUnit

    @State private var inputUnit: WeightUnit
    @State private var firstWeightInput: String
    @State private var firstRepsInput: String
    @State private var dropWeightInput: String
    @State private var dropRepsInput: String

    init(block: WorkoutBlock, displayUnit: WeightUnit) {
        self.block = block
        self.displayUnit = displayUnit
        _inputUnit = State(initialValue: displayUnit)

        let sets = block.sets.sorted { $0.orderIndex < $1.orderIndex }
        let lastNormal = sets.last { $0.type != .drop }
        let lastDrop   = sets.last { $0.type == .drop }

        func fmt(_ kg: Double, unit: WeightUnit) -> String {
            let v = unit == .pounds ? kg * 2.20462 : kg
            return String(format: "%.1f", v)
        }

        if let n = lastNormal {
            _firstWeightInput = State(initialValue: fmt(n.weightKg, unit: displayUnit))
            _firstRepsInput   = State(initialValue: "\(n.reps)")
            if let d = lastDrop {
                _dropWeightInput = State(initialValue: fmt(d.weightKg, unit: displayUnit))
                _dropRepsInput   = State(initialValue: "\(d.reps)")
            } else {
                _dropWeightInput = State(initialValue: fmt(n.weightKg * 0.8, unit: displayUnit))
                _dropRepsInput   = State(initialValue: "\(Int((Double(n.reps) * 1.25).rounded()))")
            }
        } else {
            _firstWeightInput = State(initialValue: "")
            _firstRepsInput   = State(initialValue: "")
            _dropWeightInput  = State(initialValue: "")
            _dropRepsInput    = State(initialValue: "")
        }
    }

    private func kg(_ input: String, type: SetType) -> Double? {
        guard let w = Double(input), w > 0 else { return nil }
        return inputUnit == .pounds ? w / 2.20462 : w
    }
    private var firstKg: Double? { kg(firstWeightInput, type: .normal) }
    private var dropKg: Double?  { kg(dropWeightInput,  type: .drop)   }
    private var firstReps: Int?  { guard let r = Int(firstRepsInput), r > 0 else { return nil }; return r }
    private var dropReps: Int?   { guard let r = Int(dropRepsInput),  r > 0 else { return nil }; return r }
    private var canSave: Bool    { firstKg != nil && dropKg != nil && firstReps != nil && dropReps != nil }

    private func wStr(_ kg: Double?) -> String {
        guard let kg else { return "—" }
        return inputUnit == .pounds
            ? "\(Int((kg * 2.20462).rounded())) 磅"
            : "\(Int(kg)) kg"
    }
    private var previewText: String {
        "\(wStr(firstKg)) × \(firstReps.map { "\($0)" } ?? "—") 下  →  \(wStr(dropKg)) × \(dropReps.map { "\($0)" } ?? "—") 下"
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(block.exerciseName)
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.appText)
                        Text("第 \(block.sets.filter { $0.type != .drop }.count + 1) 回合")
                            .font(.system(size: 13))
                            .foregroundColor(.appTextTert)
                    }
                    .padding(.top, 8)

                    Divider().background(Color.appBorder)

                    // Unit toggle (shared)
                    HStack {
                        Spacer()
                        HStack(spacing: 0) {
                            ForEach(WeightUnit.allCases, id: \.self) { unit in
                                Button { convertWeights(to: unit) } label: {
                                    Text(unit.rawValue)
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundColor(inputUnit == unit ? .appText : .appTextTert)
                                        .padding(.horizontal, 20)
                                        .padding(.vertical, 8)
                                        .background(inputUnit == unit ? Color.appBorder : Color.clear)
                                }
                            }
                        }
                        .background(Color.appBorder.opacity(0.6))
                        .cornerRadius(10)
                    }

                    // First segment
                    segmentSection(
                        title: "第一段",
                        titleColor: .appTextSub,
                        weightInput: $firstWeightInput,
                        repsInput: $firstRepsInput
                    )

                    // Arrow
                    HStack {
                        Spacer()
                        Image(systemName: "arrow.right")
                            .font(.system(size: 18, weight: .medium))
                            .foregroundColor(.appOrange)
                        Spacer()
                    }

                    // Drop segment
                    segmentSection(
                        title: "降重",
                        titleColor: .appOrange,
                        weightInput: $dropWeightInput,
                        repsInput: $dropRepsInput
                    )

                    // Preview
                    Text(previewText)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.appTextTert)
                        .frame(maxWidth: .infinity)
                        .multilineTextAlignment(.center)

                    Button { save() } label: {
                        Text("新增")
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
            }
            .background(Color.appBackground)
            .scrollContentBackground(.hidden)
            .navigationTitle("追加 Drop Set")
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

    private func segmentSection(
        title: String,
        titleColor: Color,
        weightInput: Binding<String>,
        repsInput: Binding<String>
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(titleColor)

            HStack(spacing: 12) {
                numberInput(placeholder: "重量", text: weightInput, isDecimal: true)
                numberInput(placeholder: "次數", text: repsInput, isDecimal: false)
            }
        }
        .padding(14)
        .background(Color.appCard)
        .cornerRadius(14)
    }

    private func numberInput(placeholder: String, text: Binding<String>, isDecimal: Bool) -> some View {
        VStack(spacing: 4) {
            Text(placeholder)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.appTextTert)
            TextField("0", text: text)
                .keyboardType(isDecimal ? .decimalPad : .numberPad)
                .font(.system(size: 22, weight: .semibold))
                .foregroundColor(.appText)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
                .frame(height: 52)
                .background(Color.appBackground)
                .cornerRadius(10)
        }
    }

    private func convertWeights(to unit: WeightUnit) {
        guard inputUnit != unit else { return }
        func convert(_ s: String) -> String {
            guard let w = Double(s) else { return s }
            return String(format: "%.1f", unit == .kg ? w / 2.20462 : w * 2.20462)
        }
        firstWeightInput = convert(firstWeightInput)
        dropWeightInput  = convert(dropWeightInput)
        inputUnit = unit
    }

    private func save() {
        guard let fKg = firstKg, let dKg = dropKg,
              let fReps = firstReps, let dReps = dropReps else { return }
        let base = block.sets.count
        try? repo.addSet(WorkoutSet(orderIndex: base,     weightKg: fKg, reps: fReps, setType: .normal), to: block)
        try? repo.addSet(WorkoutSet(orderIndex: base + 1, weightKg: dKg, reps: dReps, setType: .drop),   to: block)
        try? repo.setPreferredUnit(inputUnit, for: block)
        dismiss()
    }
}
