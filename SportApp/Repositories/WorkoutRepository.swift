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
}
