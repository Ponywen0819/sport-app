import SwiftUI
import SwiftData

// Navigation destinations for the configure step
private enum NavDest: Hashable {
    case configure(Exercise)
    case supersetConfigure([Exercise])
}

struct AddBlockSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(WorkoutRepository.self) private var repo
    @Query(sort: \Exercise.name) private var exercises: [Exercise]

    let date: Date
    let orderIndex: Int

    @State private var path: [NavDest] = []
    @State private var blockType: BlockType = .single
    @State private var inputUnit: WeightUnit

    // Step 1 filters
    @State private var searchText = ""
    @State private var selectedEquipment: String? = nil
    @State private var selectedMuscle: String? = nil

    // Superset multi-select
    @State private var selectedExercises: [Exercise] = []

    // Single inputs
    @State private var weightInput = ""
    @State private var repsInput = ""
    @State private var setsInput = "1"

    // Drop Set inputs
    @State private var firstWeightInput = ""
    @State private var firstRepsInput = ""
    @State private var dropWeightInput = ""
    @State private var dropRepsInput = ""

    // Superset inputs
    @State private var weightAInput = ""
    @State private var repsAInput = ""
    @State private var weightBInput = ""
    @State private var repsBInput = ""

    private let equipment = ["徒手", "啞鈴", "槓鈴", "機械", "繩索", "壺鈴"]
    private let muscles   = ["胸", "背", "肩", "二頭", "三頭", "腿", "臀", "核心"]

    init(date: Date, orderIndex: Int, displayUnit: WeightUnit) {
        self.date = date
        self.orderIndex = orderIndex
        _inputUnit = State(initialValue: displayUnit)
    }

    // MARK: - Filtered list

    private var filtered: [Exercise] {
        exercises.filter {
            (searchText.isEmpty || $0.name.localizedStandardContains(searchText)) &&
            (selectedEquipment == nil || $0.equipment == selectedEquipment) &&
            (selectedMuscle == nil || $0.muscleGroups.contains(selectedMuscle!))
        }
    }

    // MARK: - Parse helpers

    private func wStr(_ kg: Double?) -> String {
        guard let kg else { return "—" }
        return inputUnit.format(kg)
    }

    // Single
    private var singleKg: Double?   { inputUnit.parseToKg(weightInput) }
    private var singleReps: Int?    { parseReps(repsInput) }
    private var singleSets: Int     { max(1, Int(setsInput) ?? 1) }
    private var singleOK: Bool      { singleKg != nil && singleReps != nil }
    private var singlePreview: String {
        guard let kg = singleKg, let r = singleReps else { return "—" }
        return singleSets > 1 ? "\(wStr(kg)) · \(singleSets) 組 × \(r) 下" : "\(wStr(kg)) · \(r) 下"
    }

    // Drop Set
    private var dropFirstKg: Double?   { inputUnit.parseToKg(firstWeightInput) }
    private var dropFirstReps: Int?    { parseReps(firstRepsInput) }
    private var dropDropKg: Double?    { inputUnit.parseToKg(dropWeightInput) }
    private var dropDropReps: Int?     { parseReps(dropRepsInput) }
    private var dropOK: Bool           { dropFirstKg != nil && dropFirstReps != nil && dropDropKg != nil && dropDropReps != nil }
    private var dropPreview: String    { "\(wStr(dropFirstKg)) × \(dropFirstReps.map{"\($0)"} ?? "—") 下  →  \(wStr(dropDropKg)) × \(dropDropReps.map{"\($0)"} ?? "—") 下" }

    // Superset
    private var superAKg: Double?  { inputUnit.parseToKg(weightAInput) }
    private var superAReps: Int?   { parseReps(repsAInput) }
    private var superBKg: Double?  { inputUnit.parseToKg(weightBInput) }
    private var superBReps: Int?   { parseReps(repsBInput) }
    private var superOK: Bool      { superAKg != nil && superAReps != nil && superBKg != nil && superBReps != nil }

    // MARK: - Body

    var body: some View {
        NavigationStack(path: $path) {
            pickerView
                .navigationDestination(for: NavDest.self) { dest in
                    switch dest {
                    case .configure(let ex):        configureView(exerciseA: ex)
                    case .supersetConfigure(let exs): supersetConfigureView(exercises: exs)
                    }
                }
        }
    }

    // MARK: - Step 1: Exercise Picker

    private var pickerView: some View {
        VStack(spacing: 0) {
            blockTypeSelector
                .padding(.horizontal, 16).padding(.top, 12).padding(.bottom, 10)
            searchBarView
                .padding(.horizontal, 16).padding(.bottom, 8)
            chipRow(items: equipment, selected: $selectedEquipment, color: .appBlue).padding(.bottom, 6)
            chipRow(items: muscles,   selected: $selectedMuscle,    color: .appEmerald).padding(.bottom, 8)
            Divider().background(Color.appBorder)

            List {
                ForEach(filtered) { ex in
                    Button { handleExerciseTap(ex) } label: { pickerRow(ex) }
                        .listRowBackground(Color.clear)
                        .listRowInsets(EdgeInsets(top: 0, leading: 16, bottom: 0, trailing: 16))
                        .listRowSeparator(.hidden)
                }
                Color.clear.frame(height: 32)
                    .listRowBackground(Color.clear).listRowSeparator(.hidden).listRowInsets(EdgeInsets())
            }
            .listStyle(.plain).listRowSpacing(6).scrollContentBackground(.hidden)
            .safeAreaInset(edge: .bottom) {
                if blockType == .superset { supersetContinueBar }
            }
        }
        .background(Color.appBackground)
        .navigationTitle("選擇動作")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Color.appCard, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("取消") { dismiss() }.foregroundColor(.appTextSub)
            }
        }
        .onChange(of: blockType) { selectedExercises = [] }
    }

    // Row in the picker list — shows checkmark+order for superset, equipment tag otherwise
    private func pickerRow(_ ex: Exercise) -> some View {
        let selIdx = selectedExercises.firstIndex { $0.persistentModelID == ex.persistentModelID }
        let isSelected = selIdx != nil

        return HStack {
            VStack(alignment: .leading, spacing: 3) {
                Text(ex.name).font(.system(size: 15, weight: .medium)).foregroundColor(.appText)
                Text(ex.muscleGroups.joined(separator: " · ")).font(.system(size: 12)).foregroundColor(.appTextTert)
            }
            Spacer()
            if blockType == .superset {
                ZStack {
                    Circle()
                        .fill(isSelected ? Color.appBlueCTA : Color.clear)
                        .overlay(Circle().stroke(isSelected ? Color.clear : Color.appBorder, lineWidth: 1.5))
                        .frame(width: 26, height: 26)
                    if let idx = selIdx {
                        Text("\(idx + 1)")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                    }
                }
            } else {
                AppPillBadge(
                    text: ex.equipment,
                    color: .appTextTert,
                    fontWeight: .semibold,
                    horizontalPadding: 10,
                    verticalPadding: 4,
                    background: Color.appBorder.opacity(0.5)
                )
            }
        }
        .padding(.horizontal, 14).padding(.vertical, 12)
        .background(isSelected ? Color.appBlue.opacity(0.08) : Color.appCard)
        .cornerRadius(14)
    }

    // Bottom bar shown in superset mode
    private var supersetContinueBar: some View {
        HStack {
            Text(selectedExercises.isEmpty
                 ? "請選擇 2 個動作"
                 : selectedExercises.count == 1 ? "已選 1/2" : "已選 2/2")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(selectedExercises.count == 2 ? .appText : .appTextTert)
            Spacer()
            Button {
                path.append(.supersetConfigure(selectedExercises))
            } label: {
                Text("繼續")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 28).padding(.vertical, 10)
                    .background(selectedExercises.count == 2 ? Color.appBlueCTA : Color.appBorder)
                    .cornerRadius(10)
            }
            .disabled(selectedExercises.count < 2)
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(Color.appCard)
        .overlay(alignment: .top) { Divider().background(Color.appBorder) }
    }

    // Tap handler
    private func handleExerciseTap(_ ex: Exercise) {
        if blockType == .superset {
            if let idx = selectedExercises.firstIndex(where: { $0.persistentModelID == ex.persistentModelID }) {
                selectedExercises.remove(at: idx)
            } else {
                if selectedExercises.count >= 2 { selectedExercises.removeFirst() }
                selectedExercises.append(ex)
            }
        } else {
            selectedExercises = []
            path.append(.configure(ex))
        }
    }

    // MARK: - Step 2: Configure (Single / Drop Set)

    @ViewBuilder
    private func configureView(exerciseA: Exercise) -> some View {
        switch blockType {
        case .single:   singleConfigure(exerciseA: exerciseA)
        case .dropSet:  dropSetConfigure(exerciseA: exerciseA)
        case .superset: EmptyView() // handled via NavDest.supersetConfigure
        }
    }

    private func singleConfigure(exerciseA: Exercise) -> some View {
        configureScroll(title: exerciseA.name, onBack: { path.removeLast() }) {
            blockTypeSelector
            Divider().background(Color.appBorder)
            unitToggleRow
            VStack(spacing: 12) {
                AppNumberField(label: "重量", text: $weightInput, isDecimal: true)
                HStack(spacing: 12) {
                    AppNumberField(label: "次數", text: $repsInput)
                    AppNumberField(label: "組數（選填）", text: $setsInput)
                }
            }
            .padding(14).background(Color.appCard).cornerRadius(14)
            previewText(singlePreview)
            addButton(enabled: singleOK) { saveSingle(exerciseA) }
        }
    }

    private func dropSetConfigure(exerciseA: Exercise) -> some View {
        configureScroll(title: exerciseA.name, onBack: { path.removeLast() }) {
            blockTypeSelector
            Divider().background(Color.appBorder)
            unitToggleRow
            segmentCard(title: "第一段", color: .appTextSub) {
                HStack(spacing: 12) {
                    AppNumberField(label: "重量", text: $firstWeightInput, isDecimal: true)
                    AppNumberField(label: "次數", text: $firstRepsInput)
                }
            }
            HStack {
                Spacer()
                Image(systemName: "arrow.right")
                    .font(.system(size: 18, weight: .medium)).foregroundColor(.appOrange)
                Spacer()
            }
            segmentCard(title: "降重", color: .appOrange) {
                HStack(spacing: 12) {
                    AppNumberField(label: "重量", text: $dropWeightInput, isDecimal: true)
                    AppNumberField(label: "次數", text: $dropRepsInput)
                }
            }
            previewText(dropPreview)
            addButton(enabled: dropOK) { saveDropSet(exerciseA) }
        }
    }

    // MARK: - Step 2: Superset Configure

    private func supersetConfigureView(exercises: [Exercise]) -> some View {
        let exA = exercises[0], exB = exercises[1]
        return configureScroll(title: "超級組", onBack: { path.removeLast() }) {
            // Show exercise names as read-only chips
            HStack(spacing: 8) {
                exerciseChip(exA.name, color: .appEmerald)
                Image(systemName: "plus").font(.system(size: 12)).foregroundColor(.appTextTert)
                exerciseChip(exB.name, color: .appBlue)
            }

            Divider().background(Color.appBorder)
            unitToggleRow

            segmentCard(title: exA.name, color: .appEmerald) {
                HStack(spacing: 12) {
                    AppNumberField(label: "重量", text: $weightAInput, isDecimal: true)
                    AppNumberField(label: "次數", text: $repsAInput)
                }
            }
            segmentCard(title: exB.name, color: .appBlue) {
                HStack(spacing: 12) {
                    AppNumberField(label: "重量", text: $weightBInput, isDecimal: true)
                    AppNumberField(label: "次數", text: $repsBInput)
                }
            }
            addButton(enabled: superOK) { saveSuperset(exA: exA, exB: exB) }
        }
    }

    // MARK: - Shared subview builders

    private var blockTypeSelector: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
            ForEach(BlockType.allCases, id: \.self) { type in
                Button { blockType = type } label: {
                    Text(type.label)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(blockType == type ? type.badgeColor : .appTextTert)
                        .frame(maxWidth: .infinity).padding(.vertical, 10)
                        .background(blockType == type ? type.badgeColor.opacity(0.15) : Color.appCard)
                        .cornerRadius(10)
                        .overlay(RoundedRectangle(cornerRadius: 10)
                            .stroke(blockType == type ? type.badgeColor.opacity(0.4) : Color.clear, lineWidth: 1))
                }
            }
        }
    }

    private var searchBarView: some View {
        HStack {
            Image(systemName: "magnifyingglass").font(.system(size: 15)).foregroundColor(.appTextTert)
            TextField("搜尋動作...", text: $searchText).font(.system(size: 15)).foregroundColor(.appText)
        }
        .padding(.horizontal, 16).frame(height: 44).background(Color.appCard).cornerRadius(12)
    }

    private func chipRow(items: [String], selected: Binding<String?>, color: Color) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(items, id: \.self) { item in
                    Button { selected.wrappedValue = selected.wrappedValue == item ? nil : item } label: {
                        Text(item)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(selected.wrappedValue == item ? color : .appTextTert)
                            .padding(.horizontal, 14).padding(.vertical, 8)
                            .background(selected.wrappedValue == item ? color.opacity(0.15) : Color.appCard)
                            .cornerRadius(100)
                    }
                }
            }
            .padding(.horizontal, 16)
        }
    }

    private func exerciseChip(_ name: String, color: Color) -> some View {
        AppPillBadge(
            text: name,
            color: color,
            fontSize: 12,
            fontWeight: .semibold,
            horizontalPadding: 12,
            verticalPadding: 6
        )
    }

    private var unitToggleRow: some View {
        HStack {
            Spacer()
            AppUnitToggle(selected: inputUnit) { switchUnit(to: $0) }
        }
    }

    @ViewBuilder
    private func segmentCard(title: String, color: Color, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title).font(.system(size: 13, weight: .semibold)).foregroundColor(color)
            content()
        }
        .padding(14).background(Color.appCard).cornerRadius(14)
    }

    private func previewText(_ text: String) -> some View {
        Text(text).font(.system(size: 14, weight: .medium)).foregroundColor(.appTextTert)
            .frame(maxWidth: .infinity).multilineTextAlignment(.center)
    }

    private func addButton(enabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text("新增")
                .font(.system(size: 15, weight: .semibold)).foregroundColor(.white)
                .frame(maxWidth: .infinity).frame(height: 48)
                .background(enabled ? Color.appBlueCTA : Color.appBorder).cornerRadius(12)
        }
        .disabled(!enabled)
    }

    private func configureScroll(
        title: String,
        onBack: @escaping () -> Void,
        @ViewBuilder content: () -> some View
    ) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) { content() }.padding(16)
        }
        .background(Color.appBackground).scrollContentBackground(.hidden)
        .navigationTitle(title).navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(true)
        .toolbarBackground(Color.appCard, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button {
                    onBack(); resetConfigInputs()
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left").font(.system(size: 14, weight: .semibold))
                        Text("返回")
                    }
                    .foregroundColor(.appTextSub)
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button("取消") { dismiss() }.foregroundColor(.appTextSub)
            }
        }
    }

    // MARK: - Unit switching

    private func switchUnit(to unit: WeightUnit) {
        guard inputUnit != unit else { return }
        weightInput      = inputUnit.convert(weightInput, to: unit)
        firstWeightInput = inputUnit.convert(firstWeightInput, to: unit)
        dropWeightInput  = inputUnit.convert(dropWeightInput, to: unit)
        weightAInput     = inputUnit.convert(weightAInput, to: unit)
        weightBInput     = inputUnit.convert(weightBInput, to: unit)
        inputUnit = unit
    }

    private func resetConfigInputs() {
        weightInput = ""; repsInput = ""; setsInput = "1"
        firstWeightInput = ""; firstRepsInput = ""; dropWeightInput = ""; dropRepsInput = ""
        weightAInput = ""; repsAInput = ""; weightBInput = ""; repsBInput = ""
    }

    // MARK: - Save

    private func saveSingle(_ exA: Exercise) {
        guard let kg = singleKg, let r = singleReps else { return }
        let block = WorkoutBlock(date: date, exerciseName: exA.name, blockType: .single, orderIndex: orderIndex)
        try? repo.addBlock(block)
        for i in 0..<singleSets {
            try? repo.addSet(WorkoutSet(orderIndex: i, weightKg: kg, reps: r), to: block)
        }
        try? repo.setPreferredUnit(inputUnit, for: block)
        dismiss()
    }

    private func saveDropSet(_ exA: Exercise) {
        guard let fKg = dropFirstKg, let fR = dropFirstReps,
              let dKg = dropDropKg,  let dR = dropDropReps else { return }
        let block = WorkoutBlock(date: date, exerciseName: exA.name, blockType: .dropSet, orderIndex: orderIndex)
        try? repo.addBlock(block)
        try? repo.addSet(WorkoutSet(orderIndex: 0, weightKg: fKg, reps: fR, setType: .normal), to: block)
        try? repo.addSet(WorkoutSet(orderIndex: 1, weightKg: dKg, reps: dR, setType: .drop),   to: block)
        try? repo.setPreferredUnit(inputUnit, for: block)
        dismiss()
    }

    private func saveSuperset(exA: Exercise, exB: Exercise) {
        guard let aKg = superAKg, let aR = superAReps,
              let bKg = superBKg, let bR = superBReps else { return }
        let block = WorkoutBlock(
            date: date, exerciseName: exA.name, exerciseName2: exB.name,
            blockType: .superset, orderIndex: orderIndex
        )
        try? repo.addBlock(block)
        try? repo.addSet(WorkoutSet(orderIndex: 0, weightKg: aKg, reps: aR), to: block)
        try? repo.addSet(WorkoutSet(orderIndex: 1, weightKg: bKg, reps: bR), to: block)
        try? repo.setPreferredUnit(inputUnit, for: block)
        dismiss()
    }
}
