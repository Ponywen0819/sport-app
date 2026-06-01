import SwiftUI
import SwiftData
import UniformTypeIdentifiers

// MARK: - Weight Unit

enum WeightUnit: String, CaseIterable {
    case pounds = "磅"
    case kg = "kg"
}

// MARK: - Main View

struct WorkoutsView: View {
    @State private var selectedDate = Date()
    @State private var displayUnit: WeightUnit = .pounds
    @Query private var allBlocks: [WorkoutBlock]

    private let calendar = Calendar.current

    private var trainedDates: Set<String> {
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        return Set(allBlocks.filter { !$0.sets.isEmpty }.map { fmt.string(from: $0.date) })
    }

    // Monday-indexed week containing today
    private var weekDates: [Date] {
        let today = calendar.startOfDay(for: Date())
        let weekday = calendar.component(.weekday, from: today) // 1=Sun, 2=Mon...7=Sat
        let daysFromMonday = (weekday - 2 + 7) % 7
        let monday = calendar.date(byAdding: .day, value: -daysFromMonday, to: today)!
        return (0..<7).compactMap { calendar.date(byAdding: .day, value: $0, to: monday) }
    }

    private var setsByDay: [Int?] {
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        return weekDates.map { day in
            let key = fmt.string(from: day)
            let count = allBlocks
                .filter { fmt.string(from: $0.date) == key }
                .reduce(0) { $0 + $1.sets.count }
            return count > 0 ? count : nil
        }
    }

    private var todayIndex: Int {
        let today = calendar.startOfDay(for: Date())
        return weekDates.firstIndex { calendar.isDate($0, inSameDayAs: today) } ?? -1
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                titleSection
                DateSelectorView(selectedDate: $selectedDate, trainedDates: trainedDates)
                    .padding(.horizontal, 16)
                WeeklyWorkoutSummaryCard(setsByDay: setsByDay, todayIndex: todayIndex)
                    .padding(.horizontal, 16)
                WorkoutDaySection(date: selectedDate, displayUnit: $displayUnit)
                    .padding(.horizontal, 16)
            }
            .padding(.bottom, 32)
        }
        .background(Color.appBackground)
        .scrollContentBackground(.hidden)
        .navigationBarHidden(true)
    }

    private var titleSection: some View {
        HStack {
            Text("運動紀錄")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.appText)
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.top, 16)
        .padding(.bottom, 4)
    }
}

// MARK: - Weekly Summary Card

struct WeeklyWorkoutSummaryCard: View {
    let setsByDay: [Int?]
    let todayIndex: Int

    private let dayLabels = ["一", "二", "三", "四", "五", "六", "日"]

    private var totalDays: Int { setsByDay.compactMap { $0 }.count }
    private var totalSets: Int { setsByDay.compactMap { $0 }.reduce(0, +) }

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Text("本週訓練")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.appTextSub)
                Spacer()
                HStack(spacing: 12) {
                    HStack(spacing: 4) {
                        Text("\(totalDays)")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.appEmerald)
                        Text("天")
                            .font(.system(size: 12))
                            .foregroundColor(.appTextTert)
                    }
                    HStack(spacing: 4) {
                        Text("\(totalSets)")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.appBlue)
                        Text("組")
                            .font(.system(size: 12))
                            .foregroundColor(.appTextTert)
                    }
                }
            }

            HStack(spacing: 0) {
                ForEach(0..<7, id: \.self) { index in
                    VStack(spacing: 4) {
                        Text(dayLabels[index])
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(index == todayIndex ? .appTextSub : .appTextTert)

                        ZStack {
                            if index == todayIndex {
                                Circle()
                                    .stroke(Color.appBlue, lineWidth: 1.5)
                                    .frame(width: 30, height: 30)
                            }
                            Circle()
                                .fill(setsByDay[index] != nil ? Color.appEmeraldCTA : Color.clear)
                                .overlay(
                                    Circle().stroke(
                                        setsByDay[index] != nil ? Color.clear : Color.appBorder,
                                        lineWidth: 1
                                    )
                                )
                                .frame(width: 26, height: 26)
                        }
                        .frame(width: 30, height: 30)

                        Text(setsByDay[index].map { "\($0)" } ?? "")
                            .font(.system(size: 10))
                            .foregroundColor(.appTextTert)
                            .frame(height: 12)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .padding(16)
        .background(Color.appCard)
        .cornerRadius(16)
    }
}

// MARK: - Round Entry (RLE display)

private struct RoundEntry: Identifiable {
    enum Kind {
        case single(WorkoutSet)
        case drop(normal: WorkoutSet, drop: WorkoutSet)
        case superset(a: WorkoutSet, b: WorkoutSet)
    }
    let id: Int   // orderIndex of first set in group
    let kind: Kind
    let number: Int   // 1-based, of the first round in this group
    let count: Int    // how many consecutive identical rounds are merged
}

// MARK: - Day Section (dynamic @Query per date)

private enum DaySectionSheet: Identifiable {
    case addBlock
    case addSet(WorkoutBlock)
    var id: String {
        switch self {
        case .addBlock:       return "addBlock"
        case .addSet(let b):  return "addSet-\(ObjectIdentifier(b).hashValue)"
        }
    }
}

struct WorkoutDaySection: View {
    let date: Date
    @Binding var displayUnit: WeightUnit
    @Query private var blocks: [WorkoutBlock]
    @Environment(WorkoutRepository.self) private var repo
    @State private var activeSheet: DaySectionSheet? = nil
    @State private var draggedBlock: WorkoutBlock? = nil
    @State private var previewBlocks: [WorkoutBlock] = []

    private var renderedBlocks: [WorkoutBlock] {
        (draggedBlock != nil && !previewBlocks.isEmpty) ? previewBlocks : blocks
    }

    init(date: Date, displayUnit: Binding<WeightUnit>) {
        self.date = date
        self._displayUnit = displayUnit
        let start = Calendar.current.startOfDay(for: date)
        let end = Calendar.current.date(byAdding: .day, value: 1, to: start)!
        _blocks = Query(
            filter: #Predicate<WorkoutBlock> { block in
                block.date >= start && block.date < end
            },
            sort: \.orderIndex
        )
    }

    private var totalSets: Int { blocks.reduce(0) { $0 + $1.sets.count } }

    private var sectionTitle: String {
        if Calendar.current.isDateInToday(date) { return "今日訓練" }
        let fmt = DateFormatter()
        fmt.locale = Locale(identifier: "zh_TW")
        fmt.dateFormat = "M月d日訓練"
        return fmt.string(from: date)
    }

    var body: some View {
        VStack(spacing: 12) {
            if !blocks.isEmpty {
                HStack {
                    Text("共 \(blocks.count) 個動作 · \(totalSets) 組")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.appTextSub)
                    Spacer()
                    unitToggle
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .background(Color.appCard)
                .cornerRadius(16)
            }

            VStack(spacing: 0) {
                HStack {
                    Text(sectionTitle)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.appText)
                    Spacer()
                    Button { activeSheet = .addBlock } label: {
                        ZStack {
                            Circle().fill(Color.appBorder).frame(width: 40, height: 40)
                            Image(systemName: "plus")
                                .font(.system(size: 18))
                                .foregroundColor(.appTextSub)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)

                if blocks.isEmpty {
                    emptyState
                } else {
                    Divider().background(Color.appBorder.opacity(0.5))
                    ForEach(Array(renderedBlocks.enumerated()), id: \.element.id) { index, block in
                        workoutBlockRow(block: block, index: index)
                        if index < renderedBlocks.count - 1 {
                            Divider().background(Color.appBorder.opacity(0.5))
                        }
                    }
                }
            }
            .background(Color.appCard)
            .cornerRadius(16)
            .onDrop(of: [UTType.text], delegate: ResetReorderDropDelegate(
                draggedBlock: $draggedBlock,
                previewBlocks: $previewBlocks
            ))
        }
        .sheet(item: $activeSheet) { target in
            switch target {
            case .addBlock:
                AddBlockSheet(date: date, orderIndex: blocks.count, displayUnit: displayUnit)
            case .addSet(let block):
                switch block.type {
                case .dropSet:   AddDropSetSheet(block: block, displayUnit: displayUnit)
                case .superset:  AddSupersetSetSheet(block: block, displayUnit: displayUnit)
                default:         AddSetSheet(block: block, displayUnit: displayUnit)
                }
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "dumbbell")
                .font(.system(size: 36))
                .foregroundColor(.appTextTert)
            Text("尚無紀錄，點擊 + 新增動作")
                .font(.system(size: 14))
                .foregroundColor(.appTextTert)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 32)
    }

    private var unitToggle: some View {
        HStack(spacing: 0) {
            ForEach(WeightUnit.allCases, id: \.self) { unit in
                Button {
                    displayUnit = unit
                } label: {
                    Text(unit.rawValue)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(displayUnit == unit ? .appText : .appTextTert)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(displayUnit == unit ? Color.appBorder : Color.clear)
                }
            }
        }
        .background(Color.appBorder.opacity(0.6))
        .cornerRadius(12)
    }

    private func workoutBlockRow(block: WorkoutBlock, index: Int) -> some View {
        workoutBlockBody(block: block)
            .opacity(draggedBlock?.id == block.id ? 0 : 1)
            .contentShape(Rectangle())
            .onDrag {
                NSItemProvider(object: NSString(string: "\(block.persistentModelID.hashValue)"))
            } preview: {
                workoutBlockBody(block: block)
                    .frame(maxWidth: 360)
                    .background(Color.appCard)
                    .cornerRadius(12)
                    .onAppear {
                        draggedBlock  = block
                        previewBlocks = blocks
                    }
            }
            .onDrop(of: [UTType.text], delegate: BlockReorderDropDelegate(
                target: block,
                draggedBlock: $draggedBlock,
                previewBlocks: $previewBlocks,
                onCommit: { ordered in
                    try? repo.reorderBlocks(ordered)
                }
            ))
    }

    private func workoutBlockBody(block: WorkoutBlock) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        // Superset: show both exercise names stacked
                        if block.type == .superset, let name2 = block.exerciseName2 {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(block.exerciseName)
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(.appText)
                                Text(name2)
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(.appText)
                            }
                        } else {
                            Text(block.exerciseName)
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(.appText)
                        }

                        if block.type != .single {
                            let t = block.type
                            Text(t.label)
                                .font(.system(size: 11))
                                .foregroundColor(t.badgeColor)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(t.badgeColor.opacity(0.15))
                                .cornerRadius(100)
                        }
                    }

                    let roundCount = block.type == .superset
                        ? block.sets.count / 2
                        : (block.type == .dropSet ? block.sets.filter { $0.type != .drop }.count : block.sets.count)
                    Text("\(roundCount) 回合")
                        .font(.system(size: 12))
                        .foregroundColor(.appTextTert)
                }

                Spacer()

                HStack(spacing: 8) {
                    iconButton(systemName: "plus", color: .appTextTert) {
                        activeSheet = .addSet(block)
                    }
                    iconButton(systemName: "trash", color: .appTextTert) {
                        try? repo.deleteBlock(block)
                    }
                }
            }

            if !block.sets.isEmpty {
                let entries = roundEntries(for: block)
                VStack(spacing: 8) {
                    ForEach(entries) { entry in
                        roundRow(entry: entry, block: block)
                    }
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }

    private func setRow(set: WorkoutSet, number: Int, count: Int, block: WorkoutBlock) -> some View {
        let weightText = displayUnit == .pounds
            ? "\(Int((set.weightKg * 2.20462).rounded())) 磅"
            : "\(Int(set.weightKg)) kg"

        let exerciseLabel: String? = block.type == .superset
            ? (set.orderIndex % 2 == 0 ? block.exerciseName : block.exerciseName2)
            : nil

        return HStack {
            HStack(spacing: 6) {
                Text("第 \(number) 組")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.appTextTert)
                if count > 1 {
                    Text("×\(count)")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.appBlue)
                        .padding(.horizontal, 6).padding(.vertical, 2)
                        .background(Color.appBlue.opacity(0.15))
                        .cornerRadius(100)
                }
                if let exName = exerciseLabel {
                    Text(exName)
                        .font(.system(size: 11))
                        .foregroundColor(.appEmerald)
                        .padding(.horizontal, 6).padding(.vertical, 2)
                        .background(Color.appEmerald.opacity(0.15))
                        .cornerRadius(100)
                } else if let label = set.type.label {
                    Text(label)
                        .font(.system(size: 11))
                        .foregroundColor(.appOrange)
                        .padding(.horizontal, 6).padding(.vertical, 2)
                        .background(Color.appOrange.opacity(0.15))
                        .cornerRadius(100)
                }
            }
            Spacer()
            Text("\(weightText) · \(set.reps) 下")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.appTextSub)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Color.appBackground.opacity(0.45))
        .cornerRadius(12)
    }

    private func supersetRoundRow(setA: WorkoutSet, setB: WorkoutSet, number: Int, count: Int, block: WorkoutBlock) -> some View {
        func wStr(_ kg: Double) -> String {
            displayUnit == .pounds
                ? "\(Int((kg * 2.20462).rounded())) 磅"
                : "\(Int(kg)) kg"
        }
        return VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Text("第 \(number) 回合")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.appTextTert)
                if count > 1 {
                    Text("×\(count)")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.appBlue)
                        .padding(.horizontal, 6).padding(.vertical, 2)
                        .background(Color.appBlue.opacity(0.15))
                        .cornerRadius(100)
                }
            }
            HStack {
                Text(block.exerciseName)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.appEmerald)
                Spacer()
                Text("\(wStr(setA.weightKg)) · \(setA.reps) 下")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.appTextSub)
            }
            HStack {
                Text(block.exerciseName2 ?? "")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.appBlue)
                Spacer()
                Text("\(wStr(setB.weightKg)) · \(setB.reps) 下")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.appTextSub)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Color.appBackground.opacity(0.45))
        .cornerRadius(12)
    }

    private func dropSetRoundRow(normal: WorkoutSet, drop: WorkoutSet, number: Int, count: Int) -> some View {
        func wStr(_ kg: Double) -> String {
            displayUnit == .pounds
                ? "\(Int((kg * 2.20462).rounded())) 磅"
                : "\(Int(kg)) kg"
        }
        return HStack {
            HStack(spacing: 6) {
                Text("第 \(number) 回合")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.appTextTert)
                if count > 1 {
                    Text("×\(count)")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.appBlue)
                        .padding(.horizontal, 6).padding(.vertical, 2)
                        .background(Color.appBlue.opacity(0.15))
                        .cornerRadius(100)
                }
            }
            Spacer()
            HStack(spacing: 6) {
                Text("\(wStr(normal.weightKg)) \(normal.reps)下")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.appTextSub)
                Image(systemName: "arrow.right")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.appOrange)
                Text("\(wStr(drop.weightKg)) \(drop.reps)下")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.appOrange)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Color.appBackground.opacity(0.45))
        .cornerRadius(12)
    }

    // MARK: RLE helpers

    private func roundEntries(for block: WorkoutBlock) -> [RoundEntry] {
        let sorted = block.sets.sorted { $0.orderIndex < $1.orderIndex }
        var raw: [(kind: RoundEntry.Kind, id: Int)] = []

        switch block.type {
        case .single:
            raw = sorted.map { (.single($0), $0.orderIndex) }
        case .dropSet:
            let pairs = stride(from: 0, to: sorted.count - 1, by: 2)
                .map { (sorted[$0], sorted[$0 + 1]) }
            raw = pairs.map { (.drop(normal: $0.0, drop: $0.1), $0.0.orderIndex) }
            if sorted.count % 2 != 0, let last = sorted.last {
                raw.append((.single(last), last.orderIndex))
            }
        case .superset:
            let pairs = stride(from: 0, to: sorted.count - 1, by: 2)
                .map { (sorted[$0], sorted[$0 + 1]) }
            raw = pairs.map { (.superset(a: $0.0, b: $0.1), $0.0.orderIndex) }
            if sorted.count % 2 != 0, let last = sorted.last {
                raw.append((.single(last), last.orderIndex))
            }
        }

        var result: [RoundEntry] = []
        var i = 0
        var roundNum = 1
        while i < raw.count {
            var count = 1
            while i + count < raw.count && roundKindIdentical(raw[i].kind, raw[i + count].kind) {
                count += 1
            }
            result.append(RoundEntry(id: raw[i].id, kind: raw[i].kind, number: roundNum, count: count))
            roundNum += count
            i += count
        }
        return result
    }

    // Compare at display resolution (rounded pounds) so two rounds that look
    // identical on screen merge even if their stored kg values drift by ~%.1f
    // worth of unit-conversion rounding (e.g. user toggled display unit between
    // entries, leaving 45.359 kg vs 45.4 kg — both render as "100 磅").
    private func sameDisplayedWeight(_ a: Double, _ b: Double) -> Bool {
        Int((a * 2.20462).rounded()) == Int((b * 2.20462).rounded())
    }

    private func roundKindIdentical(_ a: RoundEntry.Kind, _ b: RoundEntry.Kind) -> Bool {
        switch (a, b) {
        case (.single(let s1), .single(let s2)):
            return sameDisplayedWeight(s1.weightKg, s2.weightKg) && s1.reps == s2.reps && s1.setType == s2.setType
        case (.drop(let n1, let d1), .drop(let n2, let d2)):
            return sameDisplayedWeight(n1.weightKg, n2.weightKg) && n1.reps == n2.reps
                && sameDisplayedWeight(d1.weightKg, d2.weightKg) && d1.reps == d2.reps
        case (.superset(let a1, let b1), .superset(let a2, let b2)):
            return sameDisplayedWeight(a1.weightKg, a2.weightKg) && a1.reps == a2.reps
                && sameDisplayedWeight(b1.weightKg, b2.weightKg) && b1.reps == b2.reps
        default:
            return false
        }
    }

    @ViewBuilder
    private func roundRow(entry: RoundEntry, block: WorkoutBlock) -> some View {
        switch entry.kind {
        case .single(let set):
            setRow(set: set, number: entry.number, count: entry.count, block: block)
        case .drop(let normal, let drop):
            dropSetRoundRow(normal: normal, drop: drop, number: entry.number, count: entry.count)
        case .superset(let a, let b):
            supersetRoundRow(setA: a, setB: b, number: entry.number, count: entry.count, block: block)
        }
    }

    private func iconButton(systemName: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            ZStack {
                Circle()
                    .fill(Color.appBackground.opacity(0.45))
                    .frame(width: 36, height: 36)
                Image(systemName: systemName)
                    .font(.system(size: 15))
                    .foregroundColor(color)
            }
        }
    }
}

// MARK: - Drag-to-reorder Drop Delegates

private struct BlockReorderDropDelegate: DropDelegate {
    let target: WorkoutBlock
    @Binding var draggedBlock: WorkoutBlock?
    @Binding var previewBlocks: [WorkoutBlock]
    let onCommit: ([WorkoutBlock]) -> Void

    func dropEntered(info: DropInfo) {
        guard let dragged = draggedBlock,
              dragged.id != target.id,
              let from = previewBlocks.firstIndex(where: { $0.id == dragged.id }),
              let to   = previewBlocks.firstIndex(where: { $0.id == target.id }),
              previewBlocks[to].id != dragged.id
        else { return }

        withAnimation(.spring(response: 0.25, dampingFraction: 0.85)) {
            let item = previewBlocks.remove(at: from)
            previewBlocks.insert(item, at: to)
        }
    }

    func dropUpdated(info: DropInfo) -> DropProposal? {
        DropProposal(operation: .move)
    }

    func performDrop(info: DropInfo) -> Bool {
        onCommit(previewBlocks)
        withAnimation(.spring(response: 0.25, dampingFraction: 0.85)) {
            draggedBlock  = nil
            previewBlocks = []
        }
        return true
    }
}

// Catch-all on the day-section container. Fires when the user drops on
// whitespace inside the card (between rows, on the header, etc.) — resets
// the preview state so the UI snaps back to the on-disk order.
private struct ResetReorderDropDelegate: DropDelegate {
    @Binding var draggedBlock: WorkoutBlock?
    @Binding var previewBlocks: [WorkoutBlock]

    func dropUpdated(info: DropInfo) -> DropProposal? {
        DropProposal(operation: .move)
    }

    func performDrop(info: DropInfo) -> Bool {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
            draggedBlock  = nil
            previewBlocks = []
        }
        return false
    }
}

#Preview {
    NavigationStack {
        WorkoutsView()
    }
    .modelContainer(for: [WorkoutBlock.self, WorkoutSet.self], inMemory: true)
}
