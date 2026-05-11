import Foundation
import SwiftData

// MARK: - Result

struct ImportResult {
    var exercisesImported:     Int = 0
    var exercisesSkipped:      Int = 0
    var exerciseStubsCreated:  Int = 0
    var foodsImported:         Int = 0
    var foodsSkipped:          Int = 0
    var mealsImported:         Int = 0
    var mealsSkipped:          Int = 0
    var bodyIndexesImported:   Int = 0
    var bodyIndexesSkipped:    Int = 0
    var blocksImported:        Int = 0
    var blocksSkipped:         Int = 0
    var errors:                [String] = []

    var totalImported: Int { exercisesImported + foodsImported + mealsImported + bodyIndexesImported + blocksImported }
}

// MARK: - Errors

enum NotionImportError: LocalizedError {
    case httpError(Int)
    case decodingError(String)
    case invalidDate(String)

    var errorDescription: String? {
        switch self {
        case .httpError(let code):     return "Notion API 回傳 HTTP \(code)"
        case .decodingError(let msg):  return "解析失敗：\(msg)"
        case .invalidDate(let s):      return "無效日期：\(s)"
        }
    }
}

// MARK: - Notion API Codable Models

private struct NotionQueryResponse: Decodable {
    let results: [NotionPage]
    let nextCursor: String?
    let hasMore: Bool
    enum CodingKeys: String, CodingKey {
        case results
        case nextCursor = "next_cursor"
        case hasMore    = "has_more"
    }
}

private struct NotionPage: Decodable {
    let id: String
    let properties: [String: NotionProp]
}

private enum NotionProp: Decodable {
    case title([RichText])
    case richText([RichText])
    case number(Double?)
    case date(String?)
    case select(String?)
    case multiSelect([String])
    case other

    struct RichText: Decodable {
        let plainText: String
        enum CodingKeys: String, CodingKey { case plainText = "plain_text" }
    }
    private struct DateWrapper:        Decodable { let start: String }
    private struct SelectWrapper:      Decodable { let name: String }
    private struct MultiSelectItem:    Decodable { let name: String }

    private enum TypeKey: String, CodingKey {
        case type, title, number, date, select
        case richText    = "rich_text"
        case multiSelect = "multi_select"
    }

    init(from decoder: Decoder) throws {
        let c    = try decoder.container(keyedBy: TypeKey.self)
        let type = try c.decode(String.self, forKey: .type)
        switch type {
        case "title":
            self = .title((try? c.decode([RichText].self, forKey: .title)) ?? [])
        case "rich_text":
            self = .richText((try? c.decode([RichText].self, forKey: .richText)) ?? [])
        case "number":
            let n = try? c.decodeIfPresent(Double.self, forKey: .number)
            self = .number(n ?? nil)
        case "date":
            let w = try? c.decodeIfPresent(DateWrapper.self, forKey: .date)
            self = .date(w?.start)
        case "select":
            let w = try? c.decodeIfPresent(SelectWrapper.self, forKey: .select)
            self = .select(w?.name)
        case "multi_select":
            let items = (try? c.decode([MultiSelectItem].self, forKey: .multiSelect)) ?? []
            self = .multiSelect(items.map(\.name))
        default:
            self = .other
        }
    }

    // MARK: Accessors
    var text: String {
        switch self {
        case .title(let items):    return items.first?.plainText ?? ""
        case .richText(let items): return items.first?.plainText ?? ""
        default:                   return ""
        }
    }
    var num: Double? {
        if case .number(let n) = self { return n }
        return nil
    }
    var dateStart: String? {
        if case .date(let d) = self { return d }
        return nil
    }
    var selectName: String? {
        if case .select(let s) = self { return s }
        return nil
    }
    var multiSelectNames: [String] {
        if case .multiSelect(let names) = self { return names }
        return []
    }
}

// MARK: - Service

struct NotionImportService {
    private let context: ModelContext

    init(context: ModelContext) {
        self.context = context
    }

    private let dateFmt: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat    = "yyyy-MM-dd"
        f.locale        = Locale(identifier: "en_US_POSIX")
        f.timeZone      = .current
        return f
    }()

    // MARK: Entry Point

    func importAll(
        token:        String,
        exercisesDbId: String,
        foodsDbId:    String,
        mealsDbId:    String,
        workoutsDbId: String,
        bodyDbId:     String
    ) async -> ImportResult {
        var result = ImportResult()

        // Import exercises first so workout import finds proper entries instead of creating stubs
        if !exercisesDbId.isEmpty {
            do    { try await importExercises(token: token, dbId: exercisesDbId, result: &result) }
            catch { result.errors.append("Exercises: \(error.localizedDescription)") }
        }
        if !foodsDbId.isEmpty {
            do    { try await importFoods(token: token, dbId: foodsDbId, result: &result) }
            catch { result.errors.append("Foods: \(error.localizedDescription)") }
        }
        if !mealsDbId.isEmpty {
            do    { try await importMeals(token: token, dbId: mealsDbId, result: &result) }
            catch { result.errors.append("Meals: \(error.localizedDescription)") }
        }
        if !workoutsDbId.isEmpty {
            do    { try await importWorkouts(token: token, dbId: workoutsDbId, result: &result) }
            catch { result.errors.append("Workouts: \(error.localizedDescription)") }
        }
        if !bodyDbId.isEmpty {
            do    { try await importBodyIndexes(token: token, dbId: bodyDbId, result: &result) }
            catch { result.errors.append("Body Indexes: \(error.localizedDescription)") }
        }

        return result
    }

    // MARK: - Exercises

    private func importExercises(token: String, dbId: String, result: inout ImportResult) async throws {
        let pages = try await fetchAll(token: token, dbId: dbId)
        var existing = try existingExerciseNames()

        for page in pages {
            let p    = page.properties
            let name = p["Name"]?.text ?? ""
            guard !name.isEmpty else { continue }

            if existing.contains(name) {
                result.exercisesSkipped += 1
                continue
            }

            let equipment    = p["Equipment"]?.selectName ?? "未知"
            let muscleGroups = p["MuscleGroup"]?.multiSelectNames ?? []

            let exercise = Exercise(name: name, equipment: equipment, muscleGroups: muscleGroups)
            context.insert(exercise)
            existing.insert(name)
            result.exercisesImported += 1
        }
        try context.save()
    }

    // MARK: - Foods

    private func importFoods(token: String, dbId: String, result: inout ImportResult) async throws {
        let pages = try await fetchAll(token: token, dbId: dbId)
        let existing = try existingFoodNames()

        for page in pages {
            let p    = page.properties
            let name = p["Name"]?.text ?? ""
            guard !name.isEmpty else { continue }
            if existing.contains(name) {
                result.foodsSkipped += 1
                continue
            }
            let food = Food(
                name:        name,
                weightBasis: p["Weight"]?.num ?? 100,
                calories:    p["Calories"]?.num ?? 0,
                protein:     p["Protein"]?.num ?? 0,
                fat:         p["Fat"]?.num ?? 0,
                carbs:       p["Carbs"]?.num ?? 0
            )
            context.insert(food)
            result.foodsImported += 1
        }
        try context.save()
    }

    private func existingFoodNames() throws -> Set<String> {
        let all = try context.fetch(FetchDescriptor<Food>())
        return Set(all.map(\.name))
    }

    // MARK: - Meals

    private func importMeals(token: String, dbId: String, result: inout ImportResult) async throws {
        let pages = try await fetchAll(token: token, dbId: dbId)

        for page in pages {
            let p        = page.properties
            let dateStr  = p["Date"]?.dateStart ?? ""
            let typeStr  = p["MealType"]?.selectName ?? "Breakfast"
            let foodName = p["FoodName"]?.text ?? p["Name"]?.text ?? ""
            let intake   = p["Intake"]?.num ?? 0

            guard !dateStr.isEmpty, !foodName.isEmpty else { continue }
            guard let date = dateFmt.date(from: String(dateStr.prefix(10))) else { continue }

            let mealType = notionMealType(typeStr)
            let dayStart = Calendar.current.startOfDay(for: date)

            if try mealExists(date: dayStart, mealType: mealType.rawValue, foodName: foodName) {
                result.mealsSkipped += 1
                continue
            }

            let record = MealRecord(
                date:      dayStart,
                mealType:  mealType,
                foodName:  foodName,
                intake:    intake,
                calories:  p["Calories"]?.num ?? 0,
                protein:   p["Protein"]?.num ?? 0,
                fat:       p["Fat"]?.num ?? 0,
                carbs:     p["Carbs"]?.num ?? 0
            )
            context.insert(record)
            result.mealsImported += 1
        }
        try context.save()
    }

    private func mealExists(date: Date, mealType: String, foodName: String) throws -> Bool {
        let descriptor = FetchDescriptor<MealRecord>(
            predicate: #Predicate {
                $0.date == date && $0.mealType == mealType && $0.foodName == foodName
            }
        )
        return try context.fetchCount(descriptor) > 0
    }

    private func notionMealType(_ notion: String) -> MealType {
        switch notion {
        case "Breakfast": return .breakfast
        case "Lunch":     return .lunch
        case "Dinner":    return .dinner
        case "Snack":     return .snack
        default:          return .breakfast
        }
    }

    // MARK: - Body Indexes

    private func importBodyIndexes(token: String, dbId: String, result: inout ImportResult) async throws {
        let pages = try await fetchAll(token: token, dbId: dbId)

        for page in pages {
            let p       = page.properties
            let dateStr = p["Date"]?.dateStart ?? ""
            let weight  = p["Weight"]?.num ?? 0
            guard !dateStr.isEmpty, weight > 0 else { continue }
            guard let date = dateFmt.date(from: String(dateStr.prefix(10))) else { continue }

            let dayStart = Calendar.current.startOfDay(for: date)
            if try bodyIndexExists(date: dayStart) {
                result.bodyIndexesSkipped += 1
                continue
            }

            let idx = BodyIndex(
                date:                 dayStart,
                weight:               weight,
                bodyFatPercentage:    p["BodyFatPercentage"]?.num,
                skeletalMuscleWeight: p["SkeletalMuscleWeight"]?.num,
                bodyFatWeight:        p["BodyFatWeight"]?.num,
                visceralFatIndex:     p["VisceralFatIndex"]?.num,
                basalMetabolicRate:   p["BasalMetabolicRate"]?.num,
                height:               p["Height"]?.num,
                totalWater:           p["TotalWater"]?.num,
                proteinWeight:        p["ProteinWeight"]?.num,
                mineralWeight:        p["MineralWeight"]?.num
            )
            context.insert(idx)
            result.bodyIndexesImported += 1
        }
        try context.save()
    }

    private func bodyIndexExists(date: Date) throws -> Bool {
        let descriptor = FetchDescriptor<BodyIndex>(
            predicate: #Predicate { $0.date == date }
        )
        return try context.fetchCount(descriptor) > 0
    }

    // MARK: - Workouts

    private struct ExerciseRow {
        let exerciseName: String
        let dateStr:      String
        let weightKg:     Double
        let reps:         Int
        let sets:         Int
        let dropWeightKg: Double?
        let dropReps:     Int?
    }

    private func importWorkouts(token: String, dbId: String, result: inout ImportResult) async throws {
        let pages = try await fetchAll(token: token, dbId: dbId)

        var rows: [ExerciseRow] = []
        for page in pages {
            let p    = page.properties
            let name = p["ExerciseName"]?.text ?? ""
            let date = p["Date"]?.dateStart ?? ""
            guard !name.isEmpty, !date.isEmpty else { continue }

            let dropW = p["DropWeight"]?.num
            let dropR = p["DropReps"]?.num.map { Int($0) }

            rows.append(ExerciseRow(
                exerciseName: name,
                dateStr:      date,
                weightKg:     p["Weight"]?.num ?? 0,
                reps:         Int(p["Reps"]?.num ?? 0),
                sets:         max(1, Int(p["Sets"]?.num ?? 1)),
                dropWeightKg: (dropW != nil && dropW! > 0) ? dropW : nil,
                dropReps:     (dropR != nil && dropR! > 0) ? dropR : nil
            ))
        }

        // Group by (dateStr, exerciseName) preserving insertion order
        var groupOrder: [(String, String)] = []
        var groups: [String: [ExerciseRow]] = [:]
        for row in rows {
            let key = "\(row.dateStr)|\(row.exerciseName)"
            if groups[key] == nil {
                groupOrder.append((row.dateStr, row.exerciseName))
                groups[key] = []
            }
            groups[key]!.append(row)
        }

        // Get existing exercise names for stub creation
        var knownExercises = try existingExerciseNames()

        // Get order indexes already used per date
        var orderIndexByDate: [String: Int] = [:]

        for (dateStr, exerciseName) in groupOrder {
            let key = "\(dateStr)|\(exerciseName)"
            let blockRows = groups[key]!

            guard let date = dateFmt.date(from: String(dateStr.prefix(10))) else { continue }
            let dayStart = Calendar.current.startOfDay(for: date)

            if try blockExists(date: dayStart, exerciseName: exerciseName) {
                result.blocksSkipped += 1
                continue
            }

            // Auto-create Exercise stub if needed
            if !knownExercises.contains(exerciseName) {
                let stub = Exercise(name: exerciseName, equipment: "未知", muscleGroups: [])
                context.insert(stub)
                knownExercises.insert(exerciseName)
                result.exerciseStubsCreated += 1
            }

            let isDropSet = blockRows.contains { $0.dropWeightKg != nil }
            let blockType: BlockType = isDropSet ? .dropSet : .single

            let orderIdx = orderIndexByDate[dateStr, default: 0]
            orderIndexByDate[dateStr] = orderIdx + 1

            let block = WorkoutBlock(
                date:         dayStart,
                exerciseName: exerciseName,
                blockType:    blockType,
                orderIndex:   orderIdx
            )

            var setIdx = 0
            for row in blockRows {
                if let dropW = row.dropWeightKg, let dropR = row.dropReps {
                    // Drop set: two sets per row
                    block.sets.append(WorkoutSet(orderIndex: setIdx,     weightKg: row.weightKg, reps: row.reps,  setType: .normal))
                    block.sets.append(WorkoutSet(orderIndex: setIdx + 1, weightKg: dropW,        reps: dropR,     setType: .drop))
                    setIdx += 2
                } else {
                    // Regular: one row may represent multiple sets
                    for _ in 0..<row.sets {
                        block.sets.append(WorkoutSet(orderIndex: setIdx, weightKg: row.weightKg, reps: row.reps, setType: .normal))
                        setIdx += 1
                    }
                }
            }

            context.insert(block)
            result.blocksImported += 1
        }
        try context.save()
    }

    private func blockExists(date: Date, exerciseName: String) throws -> Bool {
        let descriptor = FetchDescriptor<WorkoutBlock>(
            predicate: #Predicate { $0.date == date && $0.exerciseName == exerciseName }
        )
        return try context.fetchCount(descriptor) > 0
    }

    private func existingExerciseNames() throws -> Set<String> {
        let all = try context.fetch(FetchDescriptor<Exercise>())
        return Set(all.map(\.name))
    }

    // MARK: - Notion REST Fetch

    private func fetchAll(token: String, dbId: String) async throws -> [NotionPage] {
        let trimmedId = dbId.trimmingCharacters(in: .whitespacesAndNewlines)
                            .replacingOccurrences(of: "-", with: "")
        var pages:  [NotionPage] = []
        var cursor: String?      = nil

        repeat {
            var body: [String: Any] = ["page_size": 100]
            if let c = cursor { body["start_cursor"] = c }
            let bodyData = try JSONSerialization.data(withJSONObject: body)

            var req = URLRequest(url: URL(string: "https://api.notion.com/v1/databases/\(trimmedId)/query")!)
            req.httpMethod = "POST"
            req.setValue("Bearer \(token.trimmingCharacters(in: .whitespacesAndNewlines))", forHTTPHeaderField: "Authorization")
            req.setValue("2022-06-28",      forHTTPHeaderField: "Notion-Version")
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = bodyData

            let (data, response) = try await URLSession.shared.data(for: req)
            guard let http = response as? HTTPURLResponse else { throw NotionImportError.httpError(-1) }
            guard http.statusCode == 200 else { throw NotionImportError.httpError(http.statusCode) }

            let decoded = try JSONDecoder().decode(NotionQueryResponse.self, from: data)
            pages.append(contentsOf: decoded.results)
            cursor = decoded.hasMore ? decoded.nextCursor : nil
        } while cursor != nil

        return pages
    }
}
