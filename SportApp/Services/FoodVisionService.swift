import UIKit

// MARK: - Results

// A food entity detected in a photo (stage 1): what it is and an estimated
// edible weight, before any nutrition is predicted. This is the seam where
// callers can enrich/replace an entity (e.g. match against a food database)
// before nutrition prediction.
struct FoodEntity {
    let name:  String
    let grams: Double
}

// A food with predicted nutrition at its weight (stage 2). A photo yields one of
// these per food (a single item, a whole meal of several, or none) — callers
// decide whether to use the first or all.
struct RecognizedFood {
    let name:     String
    let grams:    Double
    let calories: Double
    let protein:  Double
    let fat:      Double
    let carbs:    Double
}

// A confirmed food handed back for the RAG memory after the user reviews a scan.
struct ConfirmedFood {
    let name:     String
    let grams:    Double
    let calories: Double
    let protein:  Double
    let fat:      Double
    let carbs:    Double
    let userEdited: Bool
}

// A retrieved candidate food (per-100g, from the parent Food) used both to
// canonicalize the entity name and as few-shot context. `score` is cosine
// similarity of the current photo to a past sighting of this food.
struct FoodAnchor {
    let name:           String
    let per100Calories: Double
    let per100Protein:  Double
    let per100Fat:      Double
    let per100Carbs:    Double
    let score:          Float
}

// The store the service reads candidates from / writes confirmed foods to. Backed
// by FoodMemoryRepository; abstracted so the service stays free of SwiftData.
// `record` upserts the canonical Food (propagating user edits) and appends a
// photo sighting (FoodMemory) when an embedding is available.
protocol FoodMemoryStore: AnyObject {
    func similarFoods(to embedding: [Float], topK: Int, minScore: Float) -> [FoodAnchor]
    func record(
        name: String, grams: Double,
        calories: Double, protein: Double, fat: Double, carbs: Double,
        embedding: [Float]?, imagePath: String?, userEdited: Bool
    )
}

// MARK: - Errors

enum FoodVisionError: LocalizedError {
    case notConfigured
    case imageCompressionFailed
    case noJSONObject
    case jsonEncodingFailed

    var errorDescription: String? {
        switch self {
        case .notConfigured:          return "請先在「LLM API 設定」中填入 API Key、Endpoint 與模型名稱"
        case .imageCompressionFailed: return "無法壓縮圖片"
        case .noJSONObject:           return "回應中找不到 JSON 物件"
        case .jsonEncodingFailed:     return "JSON 編碼失敗"
        }
    }
}

// MARK: - Service

// Wraps the LLM vision call behind the nutrition photo-input flows: recognizing
// the food(s) in a photo with an estimated weight and macros each. Owns the
// prompt, JSON schema, image compression, and response parsing so the views only
// deal with domain results. Designed to grow (more recognizers, alternate
// prompts, etc.).
final class FoodVisionService {
    private let client: LLMClient
    private let embedder: GeminiEmbeddingClient?   // image embedding for RAG; nil = no RAG
    private let memory: FoodMemoryStore?           // past confirmed foods; nil = no RAG
    private let maxImageBytes: Int

    // RAG retrieval knobs.
    private let anchorTopK     = 4
    private let anchorMinScore: Float = 0.6

    init(
        client:        LLMClient,
        embedder:      GeminiEmbeddingClient? = nil,
        memory:        FoodMemoryStore?       = nil,
        maxImageBytes: Int                    = 800_000
    ) {
        self.client        = client
        self.embedder      = embedder
        self.memory        = memory
        self.maxImageBytes = maxImageBytes
    }

    // Builds a service from stored settings, or nil if the LLM is unconfigured.
    // Pass a memory store to enable RAG (retrieval + write-back); the embedder is
    // taken from the stored embedding settings and may be nil (→ RAG disabled).
    static func fromStoredSettings(memory: FoodMemoryStore? = nil) -> FoodVisionService? {
        guard let client = LLMClient.fromStoredSettings() else { return nil }
        return FoodVisionService(
            client:   client,
            embedder: GeminiEmbeddingClient.fromStoredSettings(),
            memory:   memory
        )
    }

    // MARK: Recognize (two-stage)

    // Full pipeline:
    //   1. retrieve candidates by photo similarity (RAG, before recognition)
    //   2. detect entities, primed with candidate names so naming is consistent
    //   3. reconcile: an entity whose (canonicalized) name matches a candidate
    //      reuses that food's stored nutrition; the rest go to prediction
    //   4. predict nutrition for the unmatched, using candidates as anchors
    // Returns one RecognizedFood per food (empty if none), in entity order.
    func recognizeFoods(_ image: UIImage) async throws -> [RecognizedFood] {
        let candidates = await retrieveCandidates(for: image)
        let entities   = try await recognizeEntities(image, candidates: candidates)
        guard !entities.isEmpty else { return [] }

        let candidateByName = Dictionary(
            candidates.map { ($0.name, $0) },
            uniquingKeysWith: { first, _ in first }
        )
        let unmatched = entities.filter { candidateByName[$0.name] == nil }

        let predicted = unmatched.isEmpty
            ? []
            : try await predictNutrition(for: unmatched, in: image, anchors: candidates)
        let predictedByName = Dictionary(
            predicted.map { ($0.name, $0) },
            uniquingKeysWith: { first, _ in first }
        )

        return entities.map { entity in
            if let c = candidateByName[entity.name] {
                let f = entity.grams / 100.0
                return RecognizedFood(
                    name: entity.name, grams: entity.grams,
                    calories: c.per100Calories * f, protein: c.per100Protein * f,
                    fat: c.per100Fat * f, carbs: c.per100Carbs * f
                )
            }
            return predictedByName[entity.name]
                ?? RecognizedFood(name: entity.name, grams: entity.grams,
                                  calories: 0, protein: 0, fat: 0, carbs: 0)
        }
    }

    // MARK: RAG

    // Embeds the photo and pulls similar past foods (canonical name + per-100g).
    // Best-effort: any failure (no embedder/memory, network error) yields no
    // candidates rather than aborting recognition.
    private func retrieveCandidates(for image: UIImage) async -> [FoodAnchor] {
        guard let embedder, let memory else { return [] }
        do {
            let vector = try await embedder.embed(image: image)
            return memory.similarFoods(to: vector, topK: anchorTopK, minScore: anchorMinScore)
        } catch {
            return []
        }
    }

    // Stores the user-confirmed foods of a scan: upserts each canonical Food
    // (propagating edits) and appends a photo sighting. Best-effort. Foods are
    // still upserted even if embedding fails (only the sighting is skipped).
    func remember(_ foods: [ConfirmedFood], from image: UIImage) async {
        guard let memory, !foods.isEmpty else { return }
        var vector: [Float]? = nil
        var imagePath: String? = nil
        if let embedder, let v = try? await embedder.embed(image: image) {
            vector    = v
            imagePath = FoodImageStore.save(image)
        }
        for food in foods {
            memory.record(
                name: food.name, grams: food.grams,
                calories: food.calories, protein: food.protein, fat: food.fat, carbs: food.carbs,
                embedding: vector, imagePath: imagePath, userEdited: food.userEdited
            )
        }
    }

    // Stage 1 — vision, focused on detection: identify each food and estimate its
    // edible weight, with no nutrition yet. When candidates are supplied (from
    // RAG), the model is told to reuse an existing food's exact name if it's the
    // same dish, so naming stays consistent across scans (photo, not name, is the
    // identity).
    func recognizeEntities(_ image: UIImage, candidates: [FoodAnchor] = []) async throws -> [FoodEntity] {
        let prompt = """
        你是專業的食物辨識專家。使用者會給你一張食物照片。

        你的任務：
        1. 以「一道菜／一份品項」為單位辨識照片中的食物，並估計每一道的可食重量（公克）。
        2. 根據餐具、盤子大小、食物堆疊厚度估計重量。

        辨識粒度（重要）：
        - 一道菜就是「一項」，不要拆成個別食材或配料。
          例：鮭魚炒飯算一項，不要拆成「炒飯」「炒蛋」「鮭魚」。
        - 只有當盤中有「多道可明顯區分的餐點」時才分成多項。
          例：便當裡的白飯、雞排、燙青菜各自為一項。
        \(candidateSection(candidates))
        其他注意：
        - name 一律使用「繁體中文」，嚴禁簡體字、英文或其他語言；外來語請用台灣慣用的繁體中文譯名。
        - 份量請以「煮熟後可食部分」為準，寧可給估計值也不要留空。
        - 若照片中沒有任何食物，回傳空的 items 陣列。

        以 items 陣列回傳，每項包含 name（繁體中文菜名）、grams（可食重量，公克）。
        """
        let scan: EntityDTO = try await visionScan(
            image: image, prompt: prompt, schema: Self.entitySchema, maxTokens: 1024
        )
        return scan.items.map { FoodEntity(name: $0.name, grams: $0.grams) }
    }

    // Candidate names from RAG, injected so the model canonicalizes naming.
    private func candidateSection(_ candidates: [FoodAnchor]) -> String {
        guard !candidates.isEmpty else { return "" }
        let names = candidates.map { "- \($0.name)" }.joined(separator: "\n")
        return """

        命名對齊（重要）：
        若照片中的食物與下列「已知食物」是同一道，請務必沿用其『完全相同』的名稱（一字不差）；只有不屬於這些的才自行命名。
        已知食物：
        \(names)
        """
    }

    // Stage 2 — vision, focused on nutrition: looks at the same photo again, but
    // primed with the already-detected entities (and optional RAG anchors), and
    // predicts the macros for each at its weight.
    func predictNutrition(
        for entities: [FoodEntity],
        in image: UIImage,
        anchors: [FoodAnchor] = []
    ) async throws -> [RecognizedFood] {
        guard !entities.isEmpty else { return [] }

        let list = entities
            .map { "- \($0.name)（約 \(formatGrams($0.grams)) 公克）" }
            .joined(separator: "\n")
        let prompt = """
        你是專業的營養師。請參考這張食物照片。照片中已辨識出的食物與估計重量如下：

        \(list)
        \(anchorSection(anchors))
        請參考照片中的烹調方式、油量與配料，為每一項估計「在該重量下」的熱量（kcal）、蛋白質（g）、脂肪（g）、碳水化合物（g）。

        注意：
        - 目標是「接近」而非完全精準，合理估計即可，寧可給值也不要留空。
        - 請完整保留原本每一項的食物名稱與重量，數量與順序不變。

        以 items 陣列回傳，每項包含 name（食物中文名稱）、grams（公克）、calories（kcal）、protein（g）、fat（g）、carbs（g）。
        """
        let scan: ScanDTO = try await visionScan(
            image: image, prompt: prompt, schema: Self.nutritionSchema, maxTokens: 1024
        )
        return scan.items.map {
            RecognizedFood(
                name: $0.name, grams: $0.grams, calories: $0.calories,
                protein: $0.protein, fat: $0.fat, carbs: $0.carbs
            )
        }
    }

    // MARK: - Core

    // Shared vision call: compress → LLM vision with schema → parse JSON.
    private func visionScan<T: Decodable>(
        image:     UIImage,
        prompt:    String,
        schema:    LLMResponseSchema,
        maxTokens: Int
    ) async throws -> T {
        guard let imageData = image.compressedJPEG(maxBytes: maxImageBytes) else {
            throw FoodVisionError.imageCompressionFailed
        }
        let completion = try await client.completeWithImage(
            prompt:    prompt,
            imageData: imageData,
            schema:    schema,
            maxTokens: maxTokens
        )
        return try decodeJSON(from: completion.content)
    }

    private func formatGrams(_ v: Double) -> String {
        v.truncatingRemainder(dividingBy: 1) == 0 ? "\(Int(v))" : String(format: "%.1f", v)
    }

    // Few-shot block injected into the stage-2 prompt. Anchors are per-100g so the
    // model scales them to the current portion. Empty string when no anchors.
    private func anchorSection(_ anchors: [FoodAnchor]) -> String {
        guard !anchors.isEmpty else { return "" }
        let lines = anchors.map { a in
            "- \(a.name)：每 100g 約 "
                + "\(formatGrams(a.per100Calories)) kcal、"
                + "P\(formatGrams(a.per100Protein))、"
                + "F\(formatGrams(a.per100Fat))、"
                + "C\(formatGrams(a.per100Carbs))"
        }.joined(separator: "\n")
        return """

        以下是使用者過去確認過、與這張照片相似的食物營養（每 100g，僅供校準參考）：
        \(lines)

        """
    }

    // Pulls the first {...} block in case the model wraps the JSON in prose.
    private func decodeJSON<T: Decodable>(from text: String) throws -> T {
        guard let start = text.firstIndex(of: "{"),
              let end   = text.lastIndex(of: "}") else {
            throw FoodVisionError.noJSONObject
        }
        guard let data = String(text[start...end]).data(using: .utf8) else {
            throw FoodVisionError.jsonEncodingFailed
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    // MARK: - DTOs

    private struct EntityDTO: Decodable {
        struct Item: Decodable {
            let name:  String
            let grams: Double
        }
        let items: [Item]
    }

    private struct ScanDTO: Decodable {
        struct Item: Decodable {
            let name:     String
            let grams:    Double
            let calories: Double
            let protein:  Double
            let fat:      Double
            let carbs:    Double
        }
        let items: [Item]
    }

    // MARK: - Schemas

    // Stage 1: food entities (name + weight only).
    private static let entitySchema = LLMResponseSchema(
        name:   "entities",
        strict: true,
        schema: [
            "type": "object",
            "additionalProperties": false,
            "required": ["items"],
            "properties": [
                "items": [
                    "type": "array",
                    "items": [
                        "type": "object",
                        "additionalProperties": false,
                        "required": ["name", "grams"],
                        "properties": [
                            "name":  ["type": "string"],
                            "grams": ["type": "number"]
                        ] as [String: Any]
                    ] as [String: Any]
                ] as [String: Any]
            ] as [String: Any]
        ] as [String: Any]
    )

    // Stage 2: entities with predicted macros.
    private static let nutritionSchema = LLMResponseSchema(
        name:   "foods",
        strict: true,
        schema: [
            "type": "object",
            "additionalProperties": false,
            "required": ["items"],
            "properties": [
                "items": [
                    "type": "array",
                    "items": [
                        "type": "object",
                        "additionalProperties": false,
                        "required": ["name", "grams", "calories", "protein", "fat", "carbs"],
                        "properties": [
                            "name":     ["type": "string"],
                            "grams":    ["type": "number"],
                            "calories": ["type": "number"],
                            "protein":  ["type": "number"],
                            "fat":      ["type": "number"],
                            "carbs":    ["type": "number"]
                        ] as [String: Any]
                    ] as [String: Any]
                ] as [String: Any]
            ] as [String: Any]
        ] as [String: Any]
    )
}
