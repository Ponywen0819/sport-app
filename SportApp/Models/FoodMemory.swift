import SwiftData
import Foundation

// One photo "sighting" of a food — the RAG index entry. Holds only what's unique
// to the observation: the photo, its embedding, and the observed portion. The
// nutrition lives on the parent `Food` (single source of truth), so it's always
// derivable and never inconsistent. A `Food` has many of these.
@Model
final class FoodMemory {
    var imagePath: String?
    var embedding: [Float]
    var grams: Double
    var createdAt: Date
    var food: Food?

    init(imagePath: String?, embedding: [Float], grams: Double, createdAt: Date, food: Food? = nil) {
        self.imagePath = imagePath
        self.embedding = embedding
        self.grams     = grams
        self.createdAt = createdAt
        self.food      = food
    }
}
