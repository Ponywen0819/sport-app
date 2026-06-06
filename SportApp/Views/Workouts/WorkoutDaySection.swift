import SwiftUI
import SwiftData
import UniformTypeIdentifiers

// Which add-sheet (if any) is currently presented from the day section.
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

// The selected day's training card: header with set tally + unit toggle, the
// add-block button, and the list of blocks (each a draggable WorkoutBlockRow).
// Owns a date-scoped @Query so it re-fetches when the user picks another day.
struct WorkoutDaySection: View {
    let date: Date
    @Binding var displayUnit: WeightUnit
    @Query private var blocks: [WorkoutBlock]
    @Environment(WorkoutRepository.self) private var repo
    @State private var activeSheet: DaySectionSheet? = nil
    @State private var reorder = BlockReorderCoordinator()

    private var renderedBlocks: [WorkoutBlock] {
        reorder.isReordering ? reorder.previewBlocks : blocks
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
                    AppUnitToggle(selected: displayUnit) { displayUnit = $0 }
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
                    AppIconButton(
                        systemName: "plus",
                        fill: Color.appBorder,
                        diameter: 40,
                        iconSize: 18,
                        iconColor: .appTextSub
                    ) { activeSheet = .addBlock }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)

                if blocks.isEmpty {
                    emptyState
                } else {
                    Divider().background(Color.appBorder.opacity(0.5))
                    ForEach(Array(renderedBlocks.enumerated()), id: \.element.id) { index, block in
                        blockRow(block)
                        if index < renderedBlocks.count - 1 {
                            Divider().background(Color.appBorder.opacity(0.5))
                        }
                    }
                }
            }
            .background(Color.appCard)
            .cornerRadius(16)
            .onDrop(of: [UTType.text], delegate: BlockReorderCancelDropDelegate(coordinator: reorder))
        }
        .sheet(item: $activeSheet) { target in
            switch target {
            case .addBlock:
                AddBlockSheet(date: date, orderIndex: blocks.count, displayUnit: displayUnit)
            case .addSet(let block):
                let unit = repo.preferredUnit(for: block) ?? displayUnit
                switch block.type {
                case .superset:  AddSupersetSetSheet(block: block, displayUnit: unit)
                default:         AddStandardSetSheet(block: block, displayUnit: unit)
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

    // A block row plus its drag-to-reorder wrapping. The drag preview reuses the
    // same WorkoutBlockRow and seeds the coordinator's snapshot on appear.
    private func blockRow(_ block: WorkoutBlock) -> some View {
        WorkoutBlockRow(
            block: block,
            displayUnit: displayUnit,
            onAddSet: { activeSheet = .addSet(block) },
            onDelete: { try? repo.deleteBlock(block) }
        )
        .opacity(reorder.draggedBlock?.id == block.id ? 0 : 1)
        .contentShape(Rectangle())
        .onDrag {
            NSItemProvider(object: NSString(string: "\(block.persistentModelID.hashValue)"))
        } preview: {
            WorkoutBlockRow(
                block: block,
                displayUnit: displayUnit,
                onAddSet: {},
                onDelete: {}
            )
            .frame(maxWidth: 360)
            .background(Color.appCard)
            .cornerRadius(12)
            .onAppear {
                reorder.begin(dragging: block, snapshot: blocks)
            }
        }
        .onDrop(of: [UTType.text], delegate: BlockReorderDropDelegate(
            target: block,
            coordinator: reorder,
            onCommit: { ordered in
                try? repo.reorderBlocks(ordered)
            }
        ))
    }
}
