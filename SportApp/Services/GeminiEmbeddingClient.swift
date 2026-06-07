import UIKit

// MARK: - Input

// One item to embed. The model is multimodal, so text and images share the same
// vector space — image↔image, text↔text and (with care) image↔text retrieval
// all work off these vectors.
enum EmbeddingInput {
    case text(String)
    case image(Data, mimeType: String)
}

// MARK: - Config

struct GeminiEmbeddingConfig {
    var apiKey:  String
    var model:   String                                                 // e.g. "gemini-embedding-2-preview"
    var baseURL: String = "https://generativelanguage.googleapis.com/v1beta"
    var outputDimensionality: Int? = 768                                // Matryoshka truncation; nil = full (3072)
    var taskType: String? = nil                                         // e.g. "RETRIEVAL_DOCUMENT" / "RETRIEVAL_QUERY"
}

// MARK: - Errors

enum GeminiEmbeddingError: LocalizedError {
    case notConfigured
    case imageCompressionFailed
    case invalidURL(String)
    case httpError(statusCode: Int, body: String)
    case countMismatch(expected: Int, got: Int)
    case decodingFailed(String)

    var errorDescription: String? {
        switch self {
        case .notConfigured:          return "請先在「LLM API 設定」中填入 API Key 與 Embedding 模型名稱"
        case .imageCompressionFailed: return "無法壓縮圖片"
        case .invalidURL(let url):    return "無效的 URL：\(url)"
        case .httpError(let code, let body): return "HTTP \(code)：\(body)"
        case .countMismatch(let e, let g):   return "回傳向量數不符（預期 \(e)，實得 \(g)）"
        case .decodingFailed(let detail):    return "解析回應失敗：\(detail)"
        }
    }
}

// MARK: - Client

// Talks to the native Gemini embedding API (generativelanguage `embedContent` /
// `batchEmbedContents`) — NOT the OpenAI-compatible surface used by LLMClient.
// Auth is the simple `x-goog-api-key` header. Always batches (a single item is a
// batch of one), which matches the official SDK and is more quota-efficient.
// Vectors come back unnormalized and possibly Matryoshka-truncated, so every
// vector is L2-normalized here before returning (cosine == dot product after).
final class GeminiEmbeddingClient {
    let config: GeminiEmbeddingConfig

    init(config: GeminiEmbeddingConfig) {
        self.config = config
    }

    // Builds a client from the stored API key + embedding model name, or nil.
    static func fromStoredSettings() -> GeminiEmbeddingClient? {
        guard let key = KeychainHelper.loadLLMKey(), !key.isEmpty else { return nil }
        let model = (UserDefaults.standard.string(forKey: "llmEmbeddingModelName") ?? "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        guard !model.isEmpty else { return nil }
        return GeminiEmbeddingClient(config: GeminiEmbeddingConfig(apiKey: key, model: model))
    }

    // MARK: Convenience (single input)

    func embed(text: String) async throws -> [Float] {
        try await embed([.text(text)])[0]
    }

    func embed(image: UIImage, maxBytes: Int = 800_000) async throws -> [Float] {
        guard let data = image.compressedJPEG(maxBytes: maxBytes) else {
            throw GeminiEmbeddingError.imageCompressionFailed
        }
        return try await embed([.image(data, mimeType: "image/jpeg")])[0]
    }

    // MARK: Batch

    // Embeds every input in one request; result order matches input order.
    func embed(_ inputs: [EmbeddingInput]) async throws -> [[Float]] {
        guard !inputs.isEmpty else { return [] }

        let modelPath = config.model.hasPrefix("models/") ? config.model : "models/\(config.model)"
        let url       = try resolveURL(modelPath: modelPath, verb: "batchEmbedContents")

        let requests: [[String: Any]] = inputs.map { input in
            var req: [String: Any] = [
                "model":   modelPath,
                "content": ["parts": [part(for: input)]]
            ]
            if let dim = config.outputDimensionality { req["outputDimensionality"] = dim }
            if let task = config.taskType            { req["taskType"]             = task }
            return req
        }

        var request = URLRequest(url: url, timeoutInterval: 30)
        request.httpMethod = "POST"
        request.setValue(config.apiKey,    forHTTPHeaderField: "x-goog-api-key")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["requests": requests])

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)

        let vectors = try decode(data: data)
        guard vectors.count == inputs.count else {
            throw GeminiEmbeddingError.countMismatch(expected: inputs.count, got: vectors.count)
        }
        return vectors.map(Self.l2Normalized)
    }

    // MARK: - Private

    private func part(for input: EmbeddingInput) -> [String: Any] {
        switch input {
        case .text(let text):
            return ["text": text]
        case .image(let data, let mimeType):
            return ["inline_data": ["mime_type": mimeType, "data": data.base64EncodedString()]]
        }
    }

    private func resolveURL(modelPath: String, verb: String) throws -> URL {
        var base = config.baseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        if base.hasSuffix("/") { base.removeLast() }
        let urlStr = "\(base)/\(modelPath):\(verb)"
        guard let url = URL(string: urlStr) else { throw GeminiEmbeddingError.invalidURL(urlStr) }
        return url
    }

    private func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
        guard http.statusCode == 200 else {
            let body = String(data: data.prefix(400), encoding: .utf8) ?? "（無法解析）"
            throw GeminiEmbeddingError.httpError(statusCode: http.statusCode, body: body)
        }
    }

    private func decode(data: Data) throws -> [[Double]] {
        struct Raw: Decodable {
            struct Embedding: Decodable { let values: [Double] }
            let embeddings: [Embedding]
        }
        do {
            return try JSONDecoder().decode(Raw.self, from: data).embeddings.map(\.values)
        } catch {
            throw GeminiEmbeddingError.decodingFailed(error.localizedDescription)
        }
    }

    // Required because values are returned unnormalized (and truncation breaks
    // the original normalization), so cosine == dot product afterwards.
    private static func l2Normalized(_ v: [Double]) -> [Float] {
        let norm = (v.reduce(0) { $0 + $1 * $1 }).squareRoot()
        let denom = norm > 0 ? norm : 1
        return v.map { Float($0 / denom) }
    }
}
