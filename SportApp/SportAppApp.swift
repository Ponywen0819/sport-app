import SwiftUI
import SwiftData

@main
struct SportAppApp: App {
    let container: ModelContainer

    init() {
        do {
            container = try ModelContainer(for: Exercise.self)
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
        }
    }
}
