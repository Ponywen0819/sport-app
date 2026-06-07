import SwiftData
import Foundation

@Model
final class Food {
    var name: String
    var weightBasis: Double   // base serving size in grams (usually 100g)
    var calories: Double      // kcal per weightBasis grams
    var protein: Double       // g per weightBasis grams
    var fat: Double           // g per weightBasis grams
    var carbs: Double         // g per weightBasis grams
    var lastUsed: Date?

    // Photo sightings of this food — the RAG index. Cascade so deleting a food
    // drops its memories.
    @Relationship(deleteRule: .cascade, inverse: \FoodMemory.food)
    var memories: [FoodMemory] = []

    init(name: String, weightBasis: Double = 100,
         calories: Double, protein: Double, fat: Double, carbs: Double) {
        self.name = name
        self.weightBasis = weightBasis
        self.calories = calories
        self.protein = protein
        self.fat = fat
        self.carbs = carbs
    }
}
