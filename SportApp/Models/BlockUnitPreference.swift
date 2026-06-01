import SwiftData
import Foundation

@Model
final class BlockUnitPreference {
    var block: WorkoutBlock?
    var unit: String  // WeightUnit.rawValue

    init(block: WorkoutBlock, unit: WeightUnit) {
        self.block = block
        self.unit  = unit.rawValue
    }

    var preferredUnit: WeightUnit { WeightUnit(rawValue: unit) ?? .pounds }
}
