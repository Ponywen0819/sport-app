import Foundation

// MARK: - Config

struct LLMConfig {
    var apiKey:  String
    var baseURL: String
    var model:   String
}

// MARK: - Message

struct LLMMessage {
    enum Role: String { case system, user, assistant }
    let role:    Role
    let content: String

    static func user(_ content: String)      -> LLMMessage { .init(role: .user,      content: content) }
    static func system(_ content: String)    -> LLMMessage { .init(role: .system,    content: content) }
    static func assistant(_ content: String) -> LLMMessage { .init(role: .assistant, content: content) }
}

// MARK: - Response

struct LLMCompletion {
    let content: String
    let model:   String
    let usage:   TokenUsage?

    struct TokenUsage {
        let prompt:     Int
        let completion: Int
        let total:      Int
    }
}

// MARK: - Response Schema

/// OpenAI-compatible structured-output schema.
/// When provided, the model is constrained to return JSON that matches the schema exactly.
struct LLMResponseSchema {
    let name:   String
    let strict: Bool
    let schema: [String: Any]

    var asResponseFormat: [String: Any] {
        [
            "type": "json_schema",
            "json_schema": [
                "name":   name,
                "strict": strict,
                "schema": schema
            ] as [String: Any]
        ]
    }
}

// MARK: - Errors

enum LLMError: LocalizedError {
    case invalidURL(String)
    case httpError(statusCode: Int, body: String)
    case emptyChoices
    case decodingFailed(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL(let url):
            return "無效的 URL：\(url)"
        case .httpError(let code, let body):
            return "HTTP \(code)：\(body)"
        case .emptyChoices:
            return "模型未回傳任何結果"
        case .decodingFailed(let detail):
            return "解析回應失敗：\(detail)"
        }
    }
}

// MARK: - Client

final class LLMClient {
    let config: LLMConfig

    init(config: LLMConfig) {
        self.config = config
    }

    // MARK: Core

    func complete(
        messages:  [LLMMessage],
        maxTokens: Int = 1024
    ) async throws -> LLMCompletion {
        let url = try resolveURL()

        let body: [String: Any] = [
            "model":      config.model,
            "max_tokens": maxTokens,
            "messages":   messages.map { ["role": $0.role.rawValue, "content": $0.content] }
        ]

        var req = URLRequest(url: url, timeoutInterval: 30)
        req.httpMethod = "POST"
        req.setValue("Bearer \(config.apiKey)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json",         forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: req)
        try validate(response: response, data: data)
        return try decode(data: data)
    }

    // MARK: Convenience

    func chat(_ text: String, maxTokens: Int = 1024) async throws -> String {
        let completion = try await complete(messages: [.user(text)], maxTokens: maxTokens)
        return completion.content
    }

    func completeWithImage(
        prompt:    String,
        imageData: Data,
        mimeType:  String              = "image/jpeg",
        schema:    LLMResponseSchema?  = nil,
        maxTokens: Int                 = 1024
    ) async throws -> LLMCompletion {
        let url    = try resolveURL()
        let base64 = imageData.base64EncodedString()

        let content: [[String: Any]] = [
            ["type": "image_url",
             "image_url": ["url": "data:\(mimeType);base64,\(base64)"]],
            ["type": "text", "text": prompt]
        ]
        var body: [String: Any] = [
            "model":      config.model,
            "max_tokens": maxTokens,
            "messages":   [["role": "user", "content": content]]
        ]
        if let schema {
            body["response_format"] = schema.asResponseFormat
        }

        var req = URLRequest(url: url, timeoutInterval: 60)
        req.httpMethod = "POST"
        req.setValue("Bearer \(config.apiKey)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json",         forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: req)
        try validate(response: response, data: data)
        return try decode(data: data)
    }

    // MARK: Factory

    static func fromStoredSettings() -> LLMClient? {
        guard let key = KeychainHelper.loadLLMKey(), !key.isEmpty else { return nil }
        let base  = UserDefaults.standard.string(forKey: "llmEndpoint")  ?? ""
        let model = UserDefaults.standard.string(forKey: "llmModelName") ?? ""
        guard !base.isEmpty, !model.isEmpty else { return nil }
        return LLMClient(config: LLMConfig(apiKey: key, baseURL: base, model: model))
    }

    // MARK: - Private

    private func resolveURL() throws -> URL {
        var base = config.baseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        if base.hasSuffix("/") { base.removeLast() }
        let urlStr = "\(base)/chat/completions"
        guard let url = URL(string: urlStr) else { throw LLMError.invalidURL(urlStr) }
        return url
    }

    private func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }
        guard http.statusCode == 200 else {
            let body = String(data: data.prefix(400), encoding: .utf8) ?? "（無法解析）"
            throw LLMError.httpError(statusCode: http.statusCode, body: body)
        }
    }

    private func decode(data: Data) throws -> LLMCompletion {
        struct Raw: Decodable {
            struct Choice: Decodable {
                struct Message: Decodable { let content: String }
                let message: Message
            }
            struct Usage: Decodable {
                let promptTokens:     Int
                let completionTokens: Int
                let totalTokens:      Int
                enum CodingKeys: String, CodingKey {
                    case promptTokens     = "prompt_tokens"
                    case completionTokens = "completion_tokens"
                    case totalTokens      = "total_tokens"
                }
            }
            let model:   String
            let choices: [Choice]
            let usage:   Usage?
        }

        let raw: Raw
        do {
            raw = try JSONDecoder().decode(Raw.self, from: data)
        } catch {
            throw LLMError.decodingFailed(error.localizedDescription)
        }

        guard let first = raw.choices.first else { throw LLMError.emptyChoices }

        let usage = raw.usage.map {
            LLMCompletion.TokenUsage(
                prompt:     $0.promptTokens,
                completion: $0.completionTokens,
                total:      $0.totalTokens
            )
        }
        return LLMCompletion(content: first.message.content, model: raw.model, usage: usage)
    }
}
