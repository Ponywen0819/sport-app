import SwiftUI

// Renders one round entry inside a workout block, dispatching on the entry kind
// to the matching row layout. Single sets, drop-set rounds, and superset rounds
// each get their own presentation.
struct RoundRow: View {
    let entry: RoundEntry
    let block: WorkoutBlock
    let displayUnit: WeightUnit

    var body: some View {
        switch entry.kind {
        case .single(let set):
            SingleSetRow(set: set, number: entry.number, count: entry.count, block: block, displayUnit: displayUnit)
        case .drop(let normal, let drop):
            DropSetRoundRow(normal: normal, drop: drop, number: entry.number, count: entry.count, displayUnit: displayUnit)
        case .superset(let a, let b):
            SupersetRoundRow(setA: a, setB: b, number: entry.number, count: entry.count, block: block, displayUnit: displayUnit)
        }
    }
}

// MARK: - Shared pieces

// The "×N" badge shown when several identical consecutive rounds are merged.
private struct RoundCountBadge: View {
    let count: Int
    var body: some View {
        if count > 1 {
            AppPillBadge(text: "×\(count)", color: .appBlue, fontWeight: .semibold)
        }
    }
}

private extension View {
    // Common chrome for every round row: inset padding, translucent fill, radius.
    func roundRowBackground() -> some View {
        self
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(Color.appBackground.opacity(0.45))
            .cornerRadius(12)
    }
}

// MARK: - Single set

private struct SingleSetRow: View {
    let set: WorkoutSet
    let number: Int
    let count: Int
    let block: WorkoutBlock
    let displayUnit: WeightUnit

    // For a superset block's odd trailing set, label which exercise it belongs
    // to; otherwise fall back to the set's own type label (e.g. drop).
    private var exerciseLabel: String? {
        block.type == .superset
            ? (set.orderIndex % 2 == 0 ? block.exerciseName : block.exerciseName2)
            : nil
    }

    var body: some View {
        HStack {
            HStack(spacing: 6) {
                Text("第 \(number) 組")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.appTextTert)
                RoundCountBadge(count: count)
                if let exName = exerciseLabel {
                    AppPillBadge(text: exName, color: .appEmerald)
                } else if let label = set.type.label {
                    AppPillBadge(text: label, color: .appOrange)
                }
            }
            Spacer()
            Text("\(displayUnit.format(set.weightKg)) · \(set.reps) 下")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.appTextSub)
        }
        .roundRowBackground()
    }
}

// MARK: - Drop set round

private struct DropSetRoundRow: View {
    let normal: WorkoutSet
    let drop: WorkoutSet
    let number: Int
    let count: Int
    let displayUnit: WeightUnit

    var body: some View {
        HStack {
            HStack(spacing: 6) {
                Text("第 \(number) 回合")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.appTextTert)
                RoundCountBadge(count: count)
            }
            Spacer()
            HStack(spacing: 6) {
                Text("\(displayUnit.format(normal.weightKg)) \(normal.reps)下")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.appTextSub)
                Image(systemName: "arrow.right")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.appOrange)
                Text("\(displayUnit.format(drop.weightKg)) \(drop.reps)下")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.appOrange)
            }
        }
        .roundRowBackground()
    }
}

// MARK: - Superset round

private struct SupersetRoundRow: View {
    let setA: WorkoutSet
    let setB: WorkoutSet
    let number: Int
    let count: Int
    let block: WorkoutBlock
    let displayUnit: WeightUnit

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Text("第 \(number) 回合")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.appTextTert)
                RoundCountBadge(count: count)
            }
            HStack {
                Text(block.exerciseName)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.appEmerald)
                Spacer()
                Text("\(displayUnit.format(setA.weightKg)) · \(setA.reps) 下")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.appTextSub)
            }
            HStack {
                Text(block.exerciseName2 ?? "")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.appBlue)
                Spacer()
                Text("\(displayUnit.format(setB.weightKg)) · \(setB.reps) 下")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.appTextSub)
            }
        }
        .roundRowBackground()
    }
}
