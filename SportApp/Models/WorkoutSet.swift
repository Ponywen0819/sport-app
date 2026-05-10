import SwiftData
import Foundation

enum SetType: String, Codable, CaseIterable {
    case normal
    case warmup
    case failure
    case drop

    var label: String? {
        switch self {
        case .normal:  return nil
        case .warmup:  return "暖身"
        case .failure: return "力竭"
        case .drop:    return "降重"
        }
    }
}

@Model
final class WorkoutSet {
    var block: WorkoutBlock?
    var orderIndex: Int
    var weightKg: Double
    var reps: Int
    var setType: String

    init(orderIndex: Int, weightKg: Double, reps: Int, setType: SetType = .normal) {
        self.orderIndex = orderIndex
        self.weightKg = weightKg
        self.reps = reps
        self.setType = setType.rawValue
    }

    var type: SetType { SetType(rawValue: setType) ?? .normal }
}
