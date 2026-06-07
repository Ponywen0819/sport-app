import SwiftData
import Foundation
import Observation

// The RAG index over food photos plus the writer that keeps the canonical Food
// library in sync. Conforms to FoodMemoryStore so FoodVisionService stays free of
// SwiftData. Embeddings are L2-normalized upstream, so cosine == dot product; the
// table is small, so a full in-memory scan is fine. Nutrition always comes from
// the parent Food (single source of truth).
@Observable
final class FoodMemoryRepository: FoodMemoryStore {
    private let context: ModelContext

    init(context: ModelContext) {
        self.context = context
    }

    // MARK: Retrieval

    func similarFoods(to embedding: [Float], topK: Int, minScore: Float) -> [FoodAnchor] {
        guard !embedding.isEmpty,
              let memories = try? context.fetch(FetchDescriptor<FoodMemory>()) else { return [] }

        // Best similarity per parent food (a food has many sightings).
        var best: [PersistentIdentifier: (food: Food, score: Float)] = [:]
        for memory in memories {
            guard let food = memory.food, memory.embedding.count == embedding.count else { continue }
            let score = Self.dot(embedding, memory.embedding)
            guard score >= minScore else { continue }
            let id = food.persistentModelID
            if let current = best[id], current.score >= score { continue }
            best[id] = (food, score)
        }

        return best.values
            .sorted { $0.score > $1.score }
            .prefix(topK)
            .map { entry in
                let food   = entry.food
                let factor = food.weightBasis > 0 ? 100.0 / food.weightBasis : 0
                return FoodAnchor(
                    name:           food.name,
                    per100Calories: food.calories * factor,
                    per100Protein:  food.protein  * factor,
                    per100Fat:      food.fat      * factor,
                    per100Carbs:    food.carbs    * factor,
                    score:          entry.score
                )
            }
    }

    // MARK: Write-back

    func record(
        name: String, grams: Double,
        calories: Double, protein: Double, fat: Double, carbs: Double,
        embedding: [Float]?, imagePath: String?, userEdited: Bool
    ) {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }

        let factor = grams > 0 ? 100.0 / grams : 0
        let food = upsertFood(
            name: trimmed,
            per100: (calories * factor, protein * factor, fat * factor, carbs * factor),
            userEdited: userEdited
        )

        if let embedding, !embedding.isEmpty {
            context.insert(FoodMemory(
                imagePath: imagePath, embedding: embedding, grams: grams,
                createdAt: Date(), food: food
            ))
        }

        try? context.save()
    }

    // Finds the food by name (case-insensitive). Creates it if missing; updates
    // its canonical per-100g when the user edited the values (corrections
    // propagate). Always bumps lastUsed.
    private func upsertFood(
        name: String,
        per100: (Double, Double, Double, Double),
        userEdited: Bool
    ) -> Food {
        let existing = (try? context.fetch(FetchDescriptor<Food>()))?
            .first { $0.name.caseInsensitiveCompare(name) == .orderedSame }

        if let food = existing {
            if userEdited {
                food.weightBasis = 100
                food.calories    = per100.0
                food.protein     = per100.1
                food.fat         = per100.2
                food.carbs       = per100.3
            }
            food.lastUsed = Date()
            return food
        }

        let food = Food(
            name: name, weightBasis: 100,
            calories: per100.0, protein: per100.1, fat: per100.2, carbs: per100.3
        )
        food.lastUsed = Date()
        context.insert(food)
        return food
    }

    // Both vectors are unit-length, so dot product is the cosine similarity.
    private static func dot(_ a: [Float], _ b: [Float]) -> Float {
        var sum: Float = 0
        for i in a.indices { sum += a[i] * b[i] }
        return sum
    }
}
