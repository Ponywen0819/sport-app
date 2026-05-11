import Foundation
import Security

enum KeychainHelper {
    private static let service = "com.sportapp"

    static func save(_ value: String, account: String) {
        let data = Data(value.utf8)
        let query: [String: Any] = [
            kSecClass as String:       kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String:   data
        ]
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }

    static func load(account: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String:       kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String:  true,
            kSecMatchLimit as String:  kSecMatchLimitOne
        ]
        var ref: AnyObject?
        guard SecItemCopyMatching(query as CFDictionary, &ref) == errSecSuccess,
              let data = ref as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func delete(account: String) {
        let query: [String: Any] = [
            kSecClass as String:       kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(query as CFDictionary)
    }

    // MARK: Named helpers

    static func saveToken(_ token: String)  { save(token, account: "notion_token") }
    static func loadToken() -> String?      { load(account: "notion_token") }
    static func deleteToken()               { delete(account: "notion_token") }

    static func saveLLMKey(_ key: String)   { save(key, account: "llm_api_key") }
    static func loadLLMKey() -> String?     { load(account: "llm_api_key") }
    static func deleteLLMKey()              { delete(account: "llm_api_key") }
}
