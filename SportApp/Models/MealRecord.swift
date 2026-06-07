import SwiftData
import Foundation

enum MealType: String, CaseIterable {
    case breakfast = "早餐"
    case lunch     = "午餐"
    case dinner    = "晚餐"
    case snack     = "點心"

    // Maps a clock time to a meal slot, used to auto-assign scanned meals by
    // upload time: 早餐 05–10, 午餐 11–16, otherwise 晚餐.
    static func forTime(_ date: Date = Date(), calendar: Calendar = .current) -> MealType {
        switch calendar.component(.hour, from: date) {
        case 5...10:  return .breakfast
        case 11...16: return .lunch
        default:      return .dinner
        }
    }
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
