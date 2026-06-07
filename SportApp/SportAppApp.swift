import SwiftUI
import SwiftData

@main
struct SportAppApp: App {
    let container: ModelContainer

    init() {
        do {
            container = try ModelContainer(for: Exercise.self, WorkoutBlock.self, WorkoutSet.self, BodyIndex.self, Food.self, MealRecord.self, BlockUnitPreference.self, FoodMemory.self)
            let repo = ExerciseRepository(context: container.mainContext)
            try? repo.seedIfNeeded()
        } catch {
            fatalError("ModelContainer init failed: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .modelContainer(container)
                .environment(ExerciseRepository(context: container.mainContext))
                .environment(WorkoutRepository(context: container.mainContext))
                .environment(BodyIndexRepository(context: container.mainContext))
                .environment(FoodRepository(context: container.mainContext))
                .environment(MealRepository(context: container.mainContext))
                .environment(FoodMemoryRepository(context: container.mainContext))
        }
    }
}
