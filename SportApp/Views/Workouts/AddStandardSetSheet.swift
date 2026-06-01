import SwiftUI
import SwiftData

// Unified sheet for adding either a single set or a drop-set round to a
// non-superset block. The segmented control at the top toggles input mode;
// each mode keeps its own pre-filled values so toggling back and forth
// doesn't wipe what the user already typed.
struct AddStandardSetSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(WorkoutRepository.self) private var repo

    let block: WorkoutBlock
    let displayUnit: WeightUnit

    enum Mode: String, CaseIterable, Identifiable {
        case single  = "單一組"
        case dropSet = "Drop Set"
        var id: Self { self }
    }

    @State private var mode: Mode
    @State private var inputUnit: WeightUnit

    // Single inputs
    @State private var singleWeightInput: String
    @State private var singleRepsInput:   String

    // Drop set inputs
    @State private var firstWeightInput: String
    @State private var firstRepsInput:   String
    @State private var dropWeightInput:  String
    @State private var dropRepsInput:    String

    init(block: WorkoutBlock, displayUnit: WeightUnit) {
        self.block       = block
        self.displayUnit = displayUnit
        _inputUnit       = State(initialValue: displayUnit)

        let sorted     = block.sets.sorted { $0.orderIndex < $1.orderIndex }
        let lastNormal = sorted.last(where: { $0.type != .drop })
        let lastDrop   = sorted.last(where: { $0.type == .drop })

        // Default mode follows the last round in this block — if it ended on
        // a drop, the user probably wants another drop round.
        _mode = State(initialValue: sorted.last?.type == .drop ? .dropSet : .single)

        func fmt(_ kg: Double, unit: WeightUnit) -> String {
            String(format: "%.1f", unit == .pounds ? kg * 2.20462 : kg)
        }

        // Single pre-fill: last normal set
        if let n = lastNormal {
            _singleWeightInput = State(initialValue: fmt(n.weightKg, unit: displayUnit))
            _singleRepsInput   = State(initialValue: "\(n.reps)")
        } else {
            _singleWeightInput = State(initialValue: "")
            _singleRepsInput   = State(initialValue: "")
        }

        // Drop-set pre-fill: last (normal, drop) pair if any, otherwise derive from last normal
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

    // MARK: - Parsing

    private func parseKg(_ s: String) -> Double? {
        guard let w = Double(s), w > 0 else { return nil }
        return inputUnit == .pounds ? w / 2.20462 : w
    }
    private func parseReps(_ s: String) -> Int? {
        guard let r = Int(s), r > 0 else { return nil }
        return r
    }

    private var singleKg:   Double? { parseKg(singleWeightInput) }
    private var singleReps: Int?    { parseReps(singleRepsInput) }
    private var firstKg:    Double? { parseKg(firstWeightInput) }
    private var firstReps:  Int?    { parseReps(firstRepsInput) }
    private var dropKg:     Double? { parseKg(dropWeightInput) }
    private var dropReps:   Int?    { parseReps(dropRepsInput) }

    private var canSave: Bool {
        switch mode {
        case .single:  return singleKg != nil && singleReps != nil
        case .dropSet: return firstKg  != nil && firstReps  != nil && dropKg != nil && dropReps != nil
        }
    }

    private func wStr(_ kg: Double?) -> String {
        guard let kg else { return "—" }
        return inputUnit == .pounds
            ? "\(Int((kg * 2.20462).rounded())) 磅"
            : "\(Int(kg)) kg"
    }

    private var previewText: String {
        switch mode {
        case .single:
            guard let kg = singleKg, let r = singleReps else { return "—" }
            return "\(wStr(kg)) · \(r) 下"
        case .dropSet:
            return "\(wStr(firstKg)) × \(firstReps.map { "\($0)" } ?? "—") 下  →  \(wStr(dropKg)) × \(dropReps.map { "\($0)" } ?? "—") 下"
        }
    }

    private var roundNumber: Int {
        // Count distinct rounds already in this block (mixed-aware)
        let sorted = block.sets.sorted { $0.orderIndex < $1.orderIndex }
        var rounds = 0
        var i = 0
        while i < sorted.count {
            if sorted[i].type == .normal,
               i + 1 < sorted.count,
               sorted[i + 1].type == .drop {
                i += 2
            } else {
                i += 1
            }
            rounds += 1
        }
        return rounds + 1
    }

    // MARK: - Body

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    header

                    Divider().background(Color.appBorder)

                    modeSegment

                    unitToggleRow

                    Group {
                        switch mode {
                        case .single:  singleInputs
                        case .dropSet: dropSetInputs
                        }
                    }

                    previewLabel

                    saveButton
                }
                .padding(16)
            }
            .background(Color.appBackground)
            .scrollContentBackground(.hidden)
            .navigationTitle("追加")
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

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(block.exerciseName)
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(.appText)
            Text("第 \(roundNumber) 回合")
                .font(.system(size: 13))
                .foregroundColor(.appTextTert)
        }
        .padding(.top, 8)
    }

    private var modeSegment: some View {
        HStack(spacing: 0) {
            ForEach(Mode.allCases) { m in
                Button { mode = m } label: {
                    Text(m.rawValue)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(mode == m ? .appText : .appTextTert)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(mode == m ? Color.appBorder : Color.clear)
                }
            }
        }
        .background(Color.appBorder.opacity(0.6))
        .cornerRadius(10)
    }

    private var unitToggleRow: some View {
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
    }

    private var singleInputs: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                numberInput(placeholder: "重量", text: $singleWeightInput, isDecimal: true)
                numberInput(placeholder: "次數", text: $singleRepsInput,   isDecimal: false)
            }
        }
        .padding(14)
        .background(Color.appCard)
        .cornerRadius(14)
    }

    private var dropSetInputs: some View {
        VStack(alignment: .leading, spacing: 12) {
            segmentCard(title: "第一段", color: .appTextSub) {
                HStack(spacing: 12) {
                    numberInput(placeholder: "重量", text: $firstWeightInput, isDecimal: true)
                    numberInput(placeholder: "次數", text: $firstRepsInput,   isDecimal: false)
                }
            }
            HStack {
                Spacer()
                Image(systemName: "arrow.right")
                    .font(.system(size: 18, weight: .medium))
                    .foregroundColor(.appOrange)
                Spacer()
            }
            segmentCard(title: "降重", color: .appOrange) {
                HStack(spacing: 12) {
                    numberInput(placeholder: "重量", text: $dropWeightInput, isDecimal: true)
                    numberInput(placeholder: "次數", text: $dropRepsInput,   isDecimal: false)
                }
            }
        }
    }

    private func segmentCard<Content: View>(
        title: String,
        color: Color,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(color)
            content()
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

    private var previewLabel: some View {
        Text(previewText)
            .font(.system(size: 13, weight: .medium))
            .foregroundColor(.appTextTert)
            .frame(maxWidth: .infinity)
            .multilineTextAlignment(.center)
    }

    private var saveButton: some View {
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

    private func switchUnit(to unit: WeightUnit) {
        guard inputUnit != unit else { return }
        func conv(_ s: String) -> String {
            guard let w = Double(s) else { return s }
            return String(format: "%.1f", unit == .kg ? w / 2.20462 : w * 2.20462)
        }
        singleWeightInput = conv(singleWeightInput)
        firstWeightInput  = conv(firstWeightInput)
        dropWeightInput   = conv(dropWeightInput)
        inputUnit = unit
    }

    private func save() {
        let base = block.sets.count
        switch mode {
        case .single:
            guard let kg = singleKg, let r = singleReps else { return }
            try? repo.addSet(WorkoutSet(orderIndex: base, weightKg: kg, reps: r, setType: .normal), to: block)
        case .dropSet:
            guard let fKg = firstKg, let fR = firstReps,
                  let dKg = dropKg,  let dR = dropReps else { return }
            try? repo.addSet(WorkoutSet(orderIndex: base,     weightKg: fKg, reps: fR, setType: .normal), to: block)
            try? repo.addSet(WorkoutSet(orderIndex: base + 1, weightKg: dKg, reps: dR, setType: .drop),   to: block)
        }
        try? repo.setPreferredUnit(inputUnit, for: block)
        dismiss()
    }
}
