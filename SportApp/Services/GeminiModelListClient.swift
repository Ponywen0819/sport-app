import Foundation

// MARK: - Model

// One entry from the Gemini `models` listing. Field names follow the REST JSON
// (e.g. `supportedGenerationMethods`, not the SDK's `supported_actions`); only
// the fields we actually need are decoded — unknown ones are ignored.
struct GeminiModel: Decodable, Identifiable {
    let name: String                                    // e.g. "models/gemini-2.5-flash"
    let version: String?
    let displayName: String?
    let description: String?
    let inputTokenLimit: Int?
    let outputTokenLimit: Int?
    let supportedGenerationMethods: [String]?           // REST name; SDK calls it supported_actions
    let temperature: Double?
    let topP: Double?
    let topK: Int?
    let maxTemperature: Double?
    let thinking: Bool?

    // The bare id without the "models/" prefix — what you put in a model field.
    var id: String { name.hasPrefix("models/") ? String(name.dropFirst("models/".count)) : name }

    // Whether this model can serve normal text/vision generation requests.
    var supportsGenerateContent: Bool {
        supportedGenerationMethods?.contains("generateContent") ?? false
    }

    // Whether this model can produce embeddings.
    var supportsEmbedding: Bool {
        guard let methods = supportedGenerationMethods else { return false }
        return methods.contains("embedContent") || methods.contains("batchEmbedContents")
    }
}

// MARK: - Config

struct GeminiModelListConfig {
    var apiKey:  String
    var baseURL: String = "https://generativelanguage.googleapis.com/v1beta"
    var pageSize: Int? = nil                             // nil = server default (50)
}

// MARK: - Errors

enum GeminiModelListError: LocalizedError {
    case notConfigured
    case invalidURL(String)
    case httpError(statusCode: Int, body: String)
    case decodingFailed(String)

    var errorDescription: String? {
        switch self {
        case .notConfigured:        return "請先在「LLM API 設定」中填入 API Key"
        case .invalidURL(let url):  return "無效的 URL：\(url)"
        case .httpError(let code, let body): return "HTTP \(code)：\(body)"
        case .decodingFailed(let detail):    return "解析回應失敗：\(detail)"
        }
    }
}

// MARK: - Client

// Lists the models available to a Gemini API key via the native
// generativelanguage `GET /models` endpoint (NOT the OpenAI-compatible surface
// used by GeminiChatClient). Auth is the simple `x-goog-api-key` header.
//
// The endpoint pages at 50 models by default and returns a `nextPageToken` while
// more remain; `listAll()` follows that token transparently so callers just get
// the full list — mirroring how the official SDK's `client.models.list()` Pager
// auto-iterates. `get(model:)` fetches a single model's full spec.
final class GeminiModelListClient: ModelListService {
    let config: GeminiModelListConfig

    init(config: GeminiModelListConfig) {
        self.config = config
    }

    // ModelListService — provider-neutral listing for the settings pickers.
    func availableModels() async throws -> [LLMModelInfo] {
        try await listAll().map {
            LLMModelInfo(
                id:                $0.id,
                displayName:       $0.displayName,
                supportsChat:      $0.supportsGenerateContent,
                supportsEmbedding: $0.supportsEmbedding
            )
        }
    }

    // Builds a client from the stored API key, or nil if none is set.
    static func fromStoredSettings() -> GeminiModelListClient? {
        guard let key = KeychainHelper.loadLLMKey(), !key.isEmpty else { return nil }
        return GeminiModelListClient(config: GeminiModelListConfig(apiKey: key))
    }

    // MARK: List

    // Fetches every model, following `nextPageToken` until the listing is
    // exhausted. Result order matches the server's order across pages.
    func listAll() async throws -> [GeminiModel] {
        var all: [GeminiModel] = []
        var pageToken: String? = nil

        repeat {
            let page = try await listPage(pageToken: pageToken)
            all.append(contentsOf: page.models)
            pageToken = page.nextPageToken
        } while !(pageToken ?? "").isEmpty

        return all
    }

    // Fetches a single page. Pass the previous page's `nextPageToken` to advance;
    // a returned `nextPageToken` of nil/empty means this was the last page.
    func listPage(pageToken: String? = nil) async throws -> (models: [GeminiModel], nextPageToken: String?) {
        let url = try resolveListURL(pageToken: pageToken)

        var request = URLRequest(url: url, timeoutInterval: 30)
        request.httpMethod = "GET"
        request.setValue(config.apiKey, forHTTPHeaderField: "x-goog-api-key")

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)

        struct Raw: Decodable {
            let models: [GeminiModel]?
            let nextPageToken: String?
        }
        do {
            let raw = try JSONDecoder().decode(Raw.self, from: data)
            return (raw.models ?? [], raw.nextPageToken)
        } catch {
            throw GeminiModelListError.decodingFailed(error.localizedDescription)
        }
    }

    // MARK: Get

    // Fetches the full spec for one model. Accepts "gemini-2.5-flash" or the
    // fully-qualified "models/gemini-2.5-flash".
    func get(model: String) async throws -> GeminiModel {
        let modelPath = model.hasPrefix("models/") ? model : "models/\(model)"
        let url = try resolveModelURL(modelPath: modelPath)

        var request = URLRequest(url: url, timeoutInterval: 30)
        request.httpMethod = "GET"
        request.setValue(config.apiKey, forHTTPHeaderField: "x-goog-api-key")

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)

        do {
            return try JSONDecoder().decode(GeminiModel.self, from: data)
        } catch {
            throw GeminiModelListError.decodingFailed(error.localizedDescription)
        }
    }

    // MARK: - Private

    private func resolveListURL(pageToken: String?) throws -> URL {
        guard var components = URLComponents(string: "\(normalizedBase())/models") else {
            throw GeminiModelListError.invalidURL("\(normalizedBase())/models")
        }
        var query: [URLQueryItem] = []
        if let size = config.pageSize { query.append(URLQueryItem(name: "pageSize", value: String(size))) }
        if let token = pageToken, !token.isEmpty { query.append(URLQueryItem(name: "pageToken", value: token)) }
        if !query.isEmpty { components.queryItems = query }

        guard let url = components.url else {
            throw GeminiModelListError.invalidURL(components.string ?? "")
        }
        return url
    }

    private func resolveModelURL(modelPath: String) throws -> URL {
        let urlStr = "\(normalizedBase())/\(modelPath)"
        guard let url = URL(string: urlStr) else { throw GeminiModelListError.invalidURL(urlStr) }
        return url
    }

    private func normalizedBase() -> String {
        var base = config.baseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        if base.hasSuffix("/") { base.removeLast() }
        return base
    }

    private func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
        guard http.statusCode == 200 else {
            let body = String(data: data.prefix(400), encoding: .utf8) ?? "（無法解析）"
            throw GeminiModelListError.httpError(statusCode: http.statusCode, body: body)
        }
    }
}
