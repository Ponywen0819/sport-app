import SwiftData
import Foundation

enum MealType: String, CaseIterable {
    case breakfast = "早餐"
    case lunch     = "午餐"
    case dinner    = "晚餐"
    case snack     = "點心"
}

@Model
final class MealRecord {
    var date: Date       // Calendar.current.startOfDay
    var mealType: String // MealType.rawValue
    var foodName: String // denormalized at add time
    var intake: Double   // grams actually consumed
    var calories: Double // at intake amount
    var protein: Double  // at intake amount
    var fat: Double      // at intake amount
    var carbs: Double    // at intake amount

    init(date: Date, mealType: MealType, foodName: String,
         intake: Double, calories: Double, protein: Double, fat: Double, carbs: Double) {
        self.date     = Calendar.current.startOfDay(for: date)
        self.mealType = mealType.rawValue
        self.foodName = foodName
        self.intake   = intake
        self.calories = calories
        self.protein  = protein
        self.fat      = fat
        self.carbs    = carbs
    }
}
