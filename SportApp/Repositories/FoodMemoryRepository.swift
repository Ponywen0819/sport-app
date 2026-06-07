import SwiftData
import Foundation
import Observation

// Stores past user-confirmed foods (with their photo embedding) and retrieves the
// most similar ones for RAG. Conforms to FoodMemoryStore so FoodVisionService can
// use it without touching SwiftData. Vectors are L2-normalized upstream, so cosine
// similarity == dot product; the table is small, so a full in-memory scan is fine.
@Observable
final class FoodMemoryRepository: FoodMemoryStore {
    private let context: ModelContext

    init(context: ModelContext) {
        self.context = context
    }

    func similarFoods(to embedding: [Float], topK: Int, minScore: Float) -> [FoodAnchor] {
        guard !embedding.isEmpty,
              let all = try? context.fetch(FetchDescriptor<FoodMemory>()) else { return [] }

        let scored: [(anchor: FoodAnchor, score: Float)] = all.compactMap { m in
            guard m.embedding.count == embedding.count else { return nil }
            let score = Self.dot(embedding, m.embedding)
            guard score >= minScore else { return nil }
            return (
                FoodAnchor(
                    name:           m.name,
                    per100Calories: m.per100Calories,
                    per100Protein:  m.per100Protein,
                    per100Fat:      m.per100Fat,
                    per100Carbs:    m.per100Carbs,
                    userEdited:     m.userEdited,
                    score:          score
                ),
                score
            )
        }

        return scored
            .sorted { $0.score > $1.score }
            .prefix(topK)
            .map(\.anchor)
    }

    func remember(
        name: String, grams: Double,
        calories: Double, protein: Double, fat: Double, carbs: Double,
        embedding: [Float], userEdited: Bool
    ) {
        let factor = grams > 0 ? 100.0 / grams : 0
        let memory = FoodMemory(
            name:           name,
            grams:          grams,
            per100Calories: calories * factor,
            per100Protein:  protein  * factor,
            per100Fat:      fat      * factor,
            per100Carbs:    carbs    * factor,
            embedding:      embedding,
            userEdited:     userEdited,
            createdAt:      Date()
        )
        context.insert(memory)
        try? context.save()
    }

    // Both vectors are unit-length, so dot product is the cosine similarity.
    private static func dot(_ a: [Float], _ b: [Float]) -> Float {
        var sum: Float = 0
        for i in a.indices { sum += a[i] * b[i] }
        return sum
    }
}
