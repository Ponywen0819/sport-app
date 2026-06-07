import Foundation

// A selectable LLM backend. Drives the endpoints and field hints in settings so
// the user picks a provider instead of hand-typing a base URL. More cases (e.g.
// OpenAI, a custom OpenAI-compatible endpoint) can be added here.
enum LLMProvider: String, CaseIterable, Identifiable {
    case geminiAPI

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .geminiAPI: return "Gemini API"
        }
    }

    // When true the settings UI can fetch a model list (via GeminiModelListClient)
    // and offer pickers instead of free-text model fields.
    var supportsModelListing: Bool {
        switch self {
        case .geminiAPI: return true
        }
    }

    var modelHint: String {
        switch self {
        case .geminiAPI: return "gemini-2.5-flash / gemini-3.1-flash-lite / ..."
        }
    }

    var embeddingModelHint: String {
        switch self {
        case .geminiAPI: return "gemini-embedding-2-preview / ..."
        }
    }
}

// MARK: - Service factory

// The provider acts as an adapter: callers ask the current provider for the
// configured chat / embedding / model-list service instead of constructing a
// specific client. Adding a provider means adding its cases here — call sites
// don't change.
extension LLMProvider {
    // The provider the user has selected (defaults to Gemini API).
    static var current: LLMProvider {
        LLMProvider(rawValue: UserDefaults.standard.string(forKey: "llmProvider") ?? "") ?? .geminiAPI
    }

    func makeChatService() -> ChatService? {
        switch self {
        case .geminiAPI: return GeminiChatClient.fromStoredSettings()
        }
    }

    func makeEmbeddingService() -> EmbeddingService? {
        switch self {
        case .geminiAPI: return GeminiEmbeddingClient.fromStoredSettings()
        }
    }

    func makeModelListService() -> ModelListService? {
        switch self {
        case .geminiAPI: return GeminiModelListClient.fromStoredSettings()
        }
    }
}
