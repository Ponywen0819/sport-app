import SwiftData
import Foundation
import SwiftUI

enum BlockType: String, Codable, CaseIterable {
    case single
    case dropSet = "drop_set"
    case superset

    var label: String {
        switch self {
        case .single:   return "單一動作"
        case .dropSet:  return "Drop Set"
        case .superset: return "Superset"
        }
    }

    var badgeColor: Color {
        switch self {
        case .single:   return .appBlue
        case .dropSet:  return .appOrange
        case .superset: return .appEmerald
        }
    }
}

@Model
final class WorkoutBlock {
    var date: Date
    var exerciseName: String
    var exerciseName2: String?
    var blockType: String
    var orderIndex: Int
    @Relationship(deleteRule: .cascade, inverse: \WorkoutSet.block)
    var sets: [WorkoutSet]

    init(date: Date, exerciseName: String, exerciseName2: String? = nil, blockType: BlockType = .single, orderIndex: Int) {
        self.date = Calendar.current.startOfDay(for: date)
        self.exerciseName = exerciseName
        self.exerciseName2 = exerciseName2
        self.blockType = blockType.rawValue
        self.orderIndex = orderIndex
        self.sets = []
    }

    var type: BlockType { BlockType(rawValue: blockType) ?? .single }
}
