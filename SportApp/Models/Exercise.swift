import SwiftData
import Foundation

@Model
final class Exercise {
    var name: String
    var equipment: String
    var brand: String?
    var muscleGroups: [String]
    var createdAt: Date

    init(name: String, equipment: String, brand: String? = nil, muscleGroups: [String]) {
        self.name = name
        self.equipment = equipment
        self.brand = brand
        self.muscleGroups = muscleGroups
        self.createdAt = Date()
    }
}
