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

        // Single pre-fill: last normal set
        if let n = lastNormal {
            _singleWeightInput = State(initialValue: displayUnit.fieldValue(n.weightKg))
            _singleRepsInput   = State(initialValue: "\(n.reps)")
        } else {
            _singleWeightInput = State(initialValue: "")
            _singleRepsInput   = State(initialValue: "")
        }

        // Drop-set pre-fill: last (normal, drop) pair if any, otherwise derive from last normal
        if let n = lastNormal {
            _firstWeightInput = State(initialValue: displayUnit.fieldValue(n.weightKg))
            _firstRepsInput   = State(initialValue: "\(n.reps)")
            if let d = lastDrop {
                _dropWeightInput = State(initialValue: displayUnit.fieldValue(d.weightKg))
                _dropRepsInput   = State(initialValue: "\(d.reps)")
            } else {
                _dropWeightInput = State(initialValue: displayUnit.fieldValue(n.weightKg * 0.8))
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

    private var singleKg:   Double? { inputUnit.parseToKg(singleWeightInput) }
    private var singleReps: Int?    { parseReps(singleRepsInput) }
    private var firstKg:    Double? { inputUnit.parseToKg(firstWeightInput) }
    private var firstReps:  Int?    { parseReps(firstRepsInput) }
    private var dropKg:     Double? { inputUnit.parseToKg(dropWeightInput) }
    private var dropReps:   Int?    { parseReps(dropRepsInput) }

    private var canSave: Bool {
        switch mode {
        case .single:  return singleKg != nil && singleReps != nil
        case .dropSet: return firstKg  != nil && firstReps  != nil && dropKg != nil && dropReps != nil
        }
    }

    private func wStr(_ kg: Double?) -> String {
        guard let kg else { return "—" }
        return inputUnit.format(kg)
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

    private var roundNumber: Int { roundCount(for: block) + 1 }

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
                .font(.appHeading)
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
                        .font(.appControlLabel)
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
            AppUnitToggle(selected: inputUnit) { switchUnit(to: $0) }
        }
    }

    private var singleInputs: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                AppNumberField(label: "重量", text: $singleWeightInput, isDecimal: true)
                AppNumberField(label: "次數", text: $singleRepsInput)
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
                    AppNumberField(label: "重量", text: $firstWeightInput, isDecimal: true)
                    AppNumberField(label: "次數", text: $firstRepsInput)
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
                    AppNumberField(label: "重量", text: $dropWeightInput, isDecimal: true)
                    AppNumberField(label: "次數", text: $dropRepsInput)
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
                .font(.appControlLabel)
                .foregroundColor(color)
            content()
        }
        .padding(14)
        .background(Color.appCard)
        .cornerRadius(14)
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
        singleWeightInput = inputUnit.convert(singleWeightInput, to: unit)
        firstWeightInput  = inputUnit.convert(firstWeightInput,  to: unit)
        dropWeightInput   = inputUnit.convert(dropWeightInput,   to: unit)
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
