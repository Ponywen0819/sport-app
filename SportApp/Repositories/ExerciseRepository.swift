import SwiftData
import Foundation
import Observation

@Observable
final class ExerciseRepository {
    private let context: ModelContext

    init(context: ModelContext) {
        self.context = context
    }

    func fetchAll() throws -> [Exercise] {
        let descriptor = FetchDescriptor<Exercise>(sortBy: [SortDescriptor(\.name)])
        return try context.fetch(descriptor)
    }

    func add(_ exercise: Exercise) throws {
        context.insert(exercise)
        try context.save()
    }

    func delete(_ exercise: Exercise) throws {
        context.delete(exercise)
        try context.save()
    }

    // 首次啟動預載常見動作
    func seedIfNeeded() throws {
        let count = try context.fetchCount(FetchDescriptor<Exercise>())
        guard count == 0 else { return }

        let seeds: [(String, String, [String])] = [
            ("臥推",     "槓鈴", ["胸", "三頭"]),
            ("深蹲",     "槓鈴", ["腿", "臀"]),
            ("硬舉",     "槓鈴", ["背", "腿"]),
            ("肩推",     "槓鈴", ["肩", "三頭"]),
            ("引體向上", "徒手", ["背", "二頭"]),
            ("啞鈴飛鳥", "啞鈴", ["胸"]),
            ("槓鈴彎舉", "槓鈴", ["二頭"]),
            ("滑輪下拉", "機械", ["背", "二頭"]),
            ("腿推機",   "機械", ["腿"]),
            ("繩索夾胸", "繩索", ["胸"]),
        ]

        for (name, equipment, muscles) in seeds {
            context.insert(Exercise(name: name, equipment: equipment, muscleGroups: muscles))
        }
        try context.save()
    }
}
