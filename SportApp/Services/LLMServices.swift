import UIKit

// Provider-agnostic service contracts. Concrete clients (GeminiChatClient,
// GeminiEmbeddingClient, GeminiModelListClient) conform to these, and
// LLMProvider vends the right implementation for the current selection, so the
// rest of the app depends on the role, not the provider.

// MARK: - Chat

protocol ChatService {
    func complete(messages: [LLMMessage], maxTokens: Int) async throws -> LLMCompletion
    func chat(_ text: String, maxTokens: Int) async throws -> String
    func completeWithImage(
        prompt: String,
        imageData: Data,
        mimeType: String,
        schema: LLMResponseSchema?,
        maxTokens: Int
    ) async throws -> LLMCompletion
}

// MARK: - Embedding

protocol EmbeddingService {
    func embed(text: String) async throws -> [Float]
    func embed(image: UIImage, maxBytes: Int) async throws -> [Float]
    func embed(_ inputs: [EmbeddingInput]) async throws -> [[Float]]
}

// MARK: - Model listing

// A provider-neutral model description for the settings pickers.
struct LLMModelInfo: Identifiable {
    let id: String
    let displayName: String?
    let supportsChat: Bool
    let supportsEmbedding: Bool
}

protocol ModelListService {
    func availableModels() async throws -> [LLMModelInfo]
}
