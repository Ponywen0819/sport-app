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

    // OpenAI-compatible chat/completions base URL (consumed by LLMClient).
    var chatBaseURL: String {
        switch self {
        case .geminiAPI: return "https://generativelanguage.googleapis.com/v1beta/openai"
        }
    }

    // When true the base URL is fixed by the provider, so the settings UI hides
    // the manual Base URL field and pins the stored endpoint to `chatBaseURL`.
    var hasFixedBaseURL: Bool {
        switch self {
        case .geminiAPI: return true
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
