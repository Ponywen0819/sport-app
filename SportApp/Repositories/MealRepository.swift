import SwiftData
import Foundation
import Observation

@Observable
final class MealRepository {
    private let context: ModelContext

    init(context: ModelContext) {
        self.context = context
    }

    func add(_ record: MealRecord) throws {
        context.insert(record)
        try context.save()
    }

    func delete(_ record: MealRecord) throws {
        context.delete(record)
        try context.save()
    }

    func update(_ record: MealRecord, newIntake: Double) throws {
        guard record.intake > 0, newIntake > 0 else { return }
        let ratio = newIntake / record.intake
        record.intake   = newIntake
        record.calories *= ratio
        record.protein  *= ratio
        record.fat      *= ratio
        record.carbs    *= ratio
        try context.save()
    }
}
