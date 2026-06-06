import SwiftUI
import SwiftData

struct AddSupersetSetSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(WorkoutRepository.self) private var repo

    let block: WorkoutBlock
    let displayUnit: WeightUnit

    @State private var inputUnit: WeightUnit
    @State private var weightAInput: String
    @State private var repsAInput: String
    @State private var weightBInput: String
    @State private var repsBInput: String

    init(block: WorkoutBlock, displayUnit: WeightUnit) {
        self.block = block
        self.displayUnit = displayUnit
        _inputUnit = State(initialValue: displayUnit)

        // Pre-fill from last round (last pair of sets)
        let sorted = block.sets.sorted { $0.orderIndex < $1.orderIndex }
        let lastA = sorted.filter { $0.orderIndex % 2 == 0 }.last
        let lastB = sorted.filter { $0.orderIndex % 2 == 1 }.last

        _weightAInput = State(initialValue: lastA.map { displayUnit.fieldValue($0.weightKg) } ?? "")
        _repsAInput   = State(initialValue: lastA.map { "\($0.reps)" } ?? "")
        _weightBInput = State(initialValue: lastB.map { displayUnit.fieldValue($0.weightKg) } ?? "")
        _repsBInput   = State(initialValue: lastB.map { "\($0.reps)" } ?? "")
    }

    private var aKg: Double?   { inputUnit.parseToKg(weightAInput) }
    private var aReps: Int?    { parseReps(repsAInput) }
    private var bKg: Double?   { inputUnit.parseToKg(weightBInput) }
    private var bReps: Int?    { parseReps(repsBInput) }
    private var canSave: Bool  { aKg != nil && aReps != nil && bKg != nil && bReps != nil }

    private var roundNumber: Int { block.sets.count / 2 + 1 }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Round label
                    VStack(alignment: .leading, spacing: 4) {
                        Text("超級組")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.appText)
                        Text("第 \(roundNumber) 回合")
                            .font(.system(size: 13))
                            .foregroundColor(.appTextTert)
                    }
                    .padding(.top, 8)

                    Divider().background(Color.appBorder)

                    // Shared unit toggle
                    HStack {
                        Spacer()
                        HStack(spacing: 0) {
                            ForEach(WeightUnit.allCases, id: \.self) { unit in
                                Button { switchUnit(to: unit) } label: {
                                    Text(unit.rawValue)
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundColor(inputUnit == unit ? .appText : .appTextTert)
                                        .padding(.horizontal, 20).padding(.vertical, 8)
                                        .background(inputUnit == unit ? Color.appBorder : Color.clear)
                                }
                            }
                        }
                        .background(Color.appBorder.opacity(0.6))
                        .cornerRadius(10)
                    }

                    // Exercise A
                    exerciseSegment(
                        name: block.exerciseName,
                        color: .appEmerald,
                        weightInput: $weightAInput,
                        repsInput: $repsAInput
                    )

                    // Exercise B
                    exerciseSegment(
                        name: block.exerciseName2 ?? "",
                        color: .appBlue,
                        weightInput: $weightBInput,
                        repsInput: $repsBInput
                    )

                    Spacer()

                    Button { save() } label: {
                        Text("加入此回合")
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
            .navigationTitle("追加一回合")
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

    private func exerciseSegment(
        name: String,
        color: Color,
        weightInput: Binding<String>,
        repsInput: Binding<String>
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(name)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(color)
            HStack(spacing: 12) {
                inputField(label: "重量", text: weightInput, isDecimal: true)
                inputField(label: "次數", text: repsInput, isDecimal: false)
            }
        }
        .padding(14)
        .background(Color.appCard)
        .cornerRadius(14)
    }

    private func inputField(label: String, text: Binding<String>, isDecimal: Bool) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label).font(.system(size: 12, weight: .medium)).foregroundColor(.appTextTert)
            TextField("0", text: text)
                .keyboardType(isDecimal ? .decimalPad : .numberPad)
                .font(.system(size: 26, weight: .semibold))
                .foregroundColor(.appText)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity).frame(height: 56)
                .background(Color.appBackground)
                .cornerRadius(12)
        }
    }

    private func switchUnit(to unit: WeightUnit) {
        guard inputUnit != unit else { return }
        weightAInput = inputUnit.convert(weightAInput, to: unit)
        weightBInput = inputUnit.convert(weightBInput, to: unit)
        inputUnit = unit
    }

    private func save() {
        guard let aKg, let aReps, let bKg, let bReps else { return }
        let base = block.sets.count
        try? repo.addSet(WorkoutSet(orderIndex: base,     weightKg: aKg, reps: aReps), to: block)
        try? repo.addSet(WorkoutSet(orderIndex: base + 1, weightKg: bKg, reps: bReps), to: block)
        try? repo.setPreferredUnit(inputUnit, for: block)
        dismiss()
    }
}
