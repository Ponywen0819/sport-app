import SwiftUI

// One workout block's visual content: header (exercise name(s), superset badge,
// round count, add/delete buttons) plus its list of round rows. Pure
// presentation — the drag-to-reorder wrapping lives in WorkoutDaySection, which
// reuses this same view for the drag preview.
struct WorkoutBlockRow: View {
    let block: WorkoutBlock
    let displayUnit: WeightUnit
    let onAddSet: () -> Void
    let onDelete: () -> Void

    private var roundCountText: Int {
        block.type == .superset ? block.sets.count / 2 : roundCount(for: block)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        names
                        if block.type == .superset {
                            typeBadge
                        }
                    }
                    Text("\(roundCountText) 回合")
                        .font(.appCaption)
                        .foregroundColor(.appTextTert)
                }

                Spacer()

                HStack(spacing: 8) {
                    AppIconButton(systemName: "plus", action: onAddSet)
                    AppIconButton(systemName: "trash", action: onDelete)
                }
            }

            if !block.sets.isEmpty {
                VStack(spacing: 8) {
                    ForEach(roundEntries(for: block)) { entry in
                        RoundRow(entry: entry, block: block, displayUnit: displayUnit)
                    }
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }

    // Superset blocks stack both exercise names; everything else shows one.
    @ViewBuilder private var names: some View {
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
                .font(.appItemTitle)
                .foregroundColor(.appText)
        }
    }

    private var typeBadge: some View {
        let t = block.type
        return AppPillBadge(text: t.label, color: t.badgeColor, horizontalPadding: 8)
    }
}
