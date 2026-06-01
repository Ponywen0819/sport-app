import SwiftData
import Foundation
import Observation

@Observable
final class WorkoutRepository {
    private let context: ModelContext

    init(context: ModelContext) {
        self.context = context
    }

    func addBlock(_ block: WorkoutBlock) throws {
        context.insert(block)
        try context.save()
    }

    func deleteBlock(_ block: WorkoutBlock) throws {
        context.delete(block)
        try context.save()
    }

    func addSet(_ set: WorkoutSet, to block: WorkoutBlock) throws {
        set.block = block
        context.insert(set)
        try context.save()
    }

    func deleteSet(_ set: WorkoutSet) throws {
        context.delete(set)
        try context.save()
    }

    func reorderBlocks(_ ordered: [WorkoutBlock]) throws {
        for (idx, block) in ordered.enumerated() {
            block.orderIndex = idx
        }
        try context.save()
    }

    // MARK: - Per-block unit preference

    func preferredUnit(for block: WorkoutBlock) -> WeightUnit? {
        preferredUnitRecord(for: block)?.preferredUnit
    }

    func setPreferredUnit(_ unit: WeightUnit, for block: WorkoutBlock) throws {
        if let existing = preferredUnitRecord(for: block) {
            existing.unit = unit.rawValue
        } else {
            context.insert(BlockUnitPreference(block: block, unit: unit))
        }
        try context.save()
    }

    private func preferredUnitRecord(for block: WorkoutBlock) -> BlockUnitPreference? {
        let all = (try? context.fetch(FetchDescriptor<BlockUnitPreference>())) ?? []
        return all.first { $0.block?.persistentModelID == block.persistentModelID }
    }
}
