import SwiftData
import Foundation
import Observation

@Observable
final class FoodRepository {
    private let context: ModelContext

    init(context: ModelContext) {
        self.context = context
    }

    func allFoods() throws -> [Food] {
        let descriptor = FetchDescriptor<Food>(sortBy: [SortDescriptor(\.name)])
        return try context.fetch(descriptor)
    }

    func search(query: String) throws -> [Food] {
        let all = try allFoods()
        guard !query.isEmpty else { return all }
        let lower = query.lowercased()
        return all.filter { $0.name.lowercased().contains(lower) }
    }

    // Exact (case-insensitive, trimmed) name match — used to dedupe before
    // auto-inserting a recognized food.
    func food(named name: String) throws -> Food? {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return nil }
        return try allFoods().first { $0.name.caseInsensitiveCompare(trimmed) == .orderedSame }
    }

    func recentFoods(limit: Int = 8) throws -> [Food] {
        var descriptor = FetchDescriptor<Food>(
            predicate: #Predicate { $0.lastUsed != nil },
            sortBy: [SortDescriptor(\.lastUsed, order: .reverse)]
        )
        descriptor.fetchLimit = limit
        return try context.fetch(descriptor)
    }

    func add(_ food: Food) throws {
        context.insert(food)
        try context.save()
    }

    func delete(_ food: Food) throws {
        context.delete(food)
        try context.save()
    }

    func markUsed(_ food: Food) {
        food.lastUsed = Date()
        try? context.save()
    }
}
