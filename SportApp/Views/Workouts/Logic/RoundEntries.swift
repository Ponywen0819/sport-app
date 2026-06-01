import Foundation

// Display-layer grouping of WorkoutSets into rounds for the workout block UI.
// Each entry represents one rendered row in a block; identical adjacent entries
// are merged via RLE so e.g. four identical drop rounds collapse into one row
// with a ×4 badge instead of four separate rows.

struct RoundEntry: Identifiable {
    enum Kind {
        case single(WorkoutSet)
        case drop(normal: WorkoutSet, drop: WorkoutSet)
        case superset(a: WorkoutSet, b: WorkoutSet)
    }
    let id: Int        // orderIndex of the first set in this entry
    let kind: Kind
    let number: Int    // 1-based round number across the whole block
    let count: Int     // RLE: number of consecutive identical rounds merged
}

func roundEntries(for block: WorkoutBlock) -> [RoundEntry] {
    let sorted = block.sets.sorted { $0.orderIndex < $1.orderIndex }
    var raw: [(kind: RoundEntry.Kind, id: Int)] = []

    switch block.type {
    case .single, .dropSet:
        // Mixed-aware: a normal followed by a drop is a drop round; otherwise single.
        // Lets a block hold any sequence like [n, n, n, n, d] = 3 singles + 1 drop round.
        var i = 0
        while i < sorted.count {
            let cur = sorted[i]
            if cur.type == .normal,
               i + 1 < sorted.count,
               sorted[i + 1].type == .drop {
                raw.append((.drop(normal: cur, drop: sorted[i + 1]), cur.orderIndex))
                i += 2
            } else {
                raw.append((.single(cur), cur.orderIndex))
                i += 1
            }
        }
    case .superset:
        let pairs = stride(from: 0, to: sorted.count - 1, by: 2)
            .map { (sorted[$0], sorted[$0 + 1]) }
        raw = pairs.map { (.superset(a: $0.0, b: $0.1), $0.0.orderIndex) }
        if sorted.count % 2 != 0, let last = sorted.last {
            raw.append((.single(last), last.orderIndex))
        }
    }

    // RLE merge consecutive identical rounds
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

// Total number of rounds in a block before RLE merging — what the "X 回合"
// label should show. Use this instead of `roundEntries(for:).count`, which is
// the merged entry count and undercounts identical consecutive rounds.
func roundCount(for block: WorkoutBlock) -> Int {
    roundEntries(for: block).reduce(0) { $0 + $1.count }
}

// MARK: - Internal helpers

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
