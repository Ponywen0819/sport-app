import SwiftData
import Foundation

@Model
final class BodyIndex {
    var date: Date
    var weight: Double
    var bodyFatPercentage: Double?
    var skeletalMuscleWeight: Double?
    var bodyFatWeight: Double?
    var visceralFatIndex: Double?
    var basalMetabolicRate: Double?
    var height: Double?
    var totalWater: Double?
    var proteinWeight: Double?
    var mineralWeight: Double?

    init(
        date: Date,
        weight: Double,
        bodyFatPercentage: Double? = nil,
        skeletalMuscleWeight: Double? = nil,
        bodyFatWeight: Double? = nil,
        visceralFatIndex: Double? = nil,
        basalMetabolicRate: Double? = nil,
        height: Double? = nil,
        totalWater: Double? = nil,
        proteinWeight: Double? = nil,
        mineralWeight: Double? = nil
    ) {
        self.date = Calendar.current.startOfDay(for: date)
        self.weight = weight
        self.bodyFatPercentage = bodyFatPercentage
        self.skeletalMuscleWeight = skeletalMuscleWeight
        self.bodyFatWeight = bodyFatWeight
        self.visceralFatIndex = visceralFatIndex
        self.basalMetabolicRate = basalMetabolicRate
        self.height = height
        self.totalWater = totalWater
        self.proteinWeight = proteinWeight
        self.mineralWeight = mineralWeight
    }
}
