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
    var imagePath: String?    // link to a stored photo (relative path under Documents)

    init(name: String, weightBasis: Double = 100,
         calories: Double, protein: Double, fat: Double, carbs: Double,
         imagePath: String? = nil) {
        self.name = name
        self.weightBasis = weightBasis
        self.calories = calories
        self.protein = protein
        self.fat = fat
        self.carbs = carbs
        self.imagePath = imagePath
    }
}
