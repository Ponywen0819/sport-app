import SwiftData
import Foundation

// A past, user-confirmed food used as a RAG anchor for future nutrition
// prediction. Macros are stored per-100g so they're portion-independent (an
// anchor can calibrate a different portion). `embedding` is the L2-normalized
// image embedding of the photo the food came from — whole-photo for now, so all
// foods from one photo share the same vector.
@Model
final class FoodMemory {
    var name: String
    var grams: Double
    var per100Calories: Double
    var per100Protein: Double
    var per100Fat: Double
    var per100Carbs: Double
    var embedding: [Float]
    var userEdited: Bool      // the user changed the AI's values → stronger anchor
    var createdAt: Date

    init(
        name: String,
        grams: Double,
        per100Calories: Double,
        per100Protein: Double,
        per100Fat: Double,
        per100Carbs: Double,
        embedding: [Float],
        userEdited: Bool,
        createdAt: Date
    ) {
        self.name           = name
        self.grams          = grams
        self.per100Calories = per100Calories
        self.per100Protein  = per100Protein
        self.per100Fat      = per100Fat
        self.per100Carbs    = per100Carbs
        self.embedding      = embedding
        self.userEdited     = userEdited
        self.createdAt      = createdAt
    }
}
