import SwiftData
import Foundation

@Observable
final class BodyIndexRepository {
    private let context: ModelContext

    init(context: ModelContext) {
        self.context = context
    }

    // Last-wins per day: replace any existing record for the same calendar day.
    func save(_ record: BodyIndex) throws {
        let start = record.date   // already normalized to startOfDay
        let end = Calendar.current.date(byAdding: .day, value: 1, to: start)!
        let descriptor = FetchDescriptor<BodyIndex>(
            predicate: #Predicate { $0.date >= start && $0.date < end }
        )
        if let existing = try? context.fetch(descriptor).first {
            context.delete(existing)
        }
        context.insert(record)
        try context.save()
    }

    func delete(_ record: BodyIndex) throws {
        context.delete(record)
        try context.save()
    }
}
