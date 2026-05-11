import SwiftUI

struct LLMSettingsView: View {
    @Environment(\.dismiss) private var dismiss

    @AppStorage("llmEndpoint")  private var endpoint:  String = ""
    @AppStorage("llmModelName") private var modelName: String = ""

    @State private var apiKey:    String    = ""
    @State private var saved:     Bool      = false
    @State private var testState: TestState = .idle

    private enum TestState {
        case idle
        case loading
        case success(String)
        case failure(String)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                navHeader
                configCard
                testCard
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
            .padding(.bottom, 32)
        }
        .background(Color.appBackground)
        .scrollContentBackground(.hidden)
        .navigationBarHidden(true)
        .onAppear {
            apiKey = KeychainHelper.loadLLMKey() ?? ""
        }
        .animation(.easeInOut(duration: 0.2), value: saved)
    }

    // MARK: - Header

    private var navHeader: some View {
        HStack {
            Button { dismiss() } label: {
                ZStack {
                    Circle().fill(Color.appCard).frame(width: 32, height: 32)
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.appTextSub)
                }
            }
            Text("LLM API 設定")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.appText)
                .padding(.leading, 4)
            Spacer()
        }
    }

    // MARK: - Config Card

    private var configCard: some View {
        VStack(spacing: 16) {
            secureInputField(
                label: "API Key",
                hint:  "sk-... 或對應格式的 API 金鑰",
                value: $apiKey
            )

            inputField(
                label: "Base URL",
                hint:  "https://api.openai.com/v1",
                value: $endpoint
            )

            inputField(
                label: "Model",
                hint:  "gpt-4o / claude-sonnet-4-6 / ...",
                value: $modelName
            )

            HStack(spacing: 12) {
                Button {
                    apiKey    = ""
                    endpoint  = ""
                    modelName = ""
                    KeychainHelper.deleteLLMKey()
                    flash()
                } label: {
                    Text("清除")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.appTextSub)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(Color.appBackground)
                        .cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.appBorder, lineWidth: 1))
                }

                Button {
                    if apiKey.isEmpty { KeychainHelper.deleteLLMKey() }
                    else              { KeychainHelper.saveLLMKey(apiKey) }
                    flash()
                } label: {
                    Text("儲存")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(Color.appBlueCTA)
                        .cornerRadius(12)
                }
            }
        }
        .padding(16)
        .background(Color.appCard)
        .cornerRadius(16)
    }

    // MARK: - Fields

    private func inputField(label: String, hint: String, value: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.appTextTert)
            TextField(hint, text: value)
                .font(.system(size: 14))
                .foregroundColor(.appText)
                .autocapitalization(.none)
                .disableAutocorrection(true)
                .padding(.horizontal, 16)
                .frame(height: 48)
                .background(Color.appBackground)
                .cornerRadius(12)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.appBorder, lineWidth: 1))
        }
    }

    private func secureInputField(label: String, hint: String, value: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.appTextTert)
            SecureField(hint, text: value)
                .font(.system(size: 14))
                .foregroundColor(.appText)
                .padding(.horizontal, 16)
                .frame(height: 48)
                .background(Color.appBackground)
                .cornerRadius(12)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.appBorder, lineWidth: 1))
        }
    }

    // MARK: - Test Card

    private var testCard: some View {
        VStack(spacing: 12) {
            HStack {
                Text("連線測試")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.appTextSub)
                Spacer()
            }

            switch testState {
            case .idle:
                EmptyView()
            case .loading:
                HStack(spacing: 8) {
                    ProgressView().tint(.appTextSub)
                    Text("傳送中...")
                        .font(.system(size: 13))
                        .foregroundColor(.appTextTert)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            case .success(let reply):
                VStack(alignment: .leading, spacing: 6) {
                    Label("回覆成功", systemImage: "checkmark.circle.fill")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.appEmerald)
                    Text(reply)
                        .font(.system(size: 13))
                        .foregroundColor(.appTextSub)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(12)
                        .background(Color.appBackground)
                        .cornerRadius(10)
                }
            case .failure(let msg):
                VStack(alignment: .leading, spacing: 6) {
                    Label("失敗", systemImage: "xmark.circle.fill")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.appRed)
                    Text(msg)
                        .font(.system(size: 12))
                        .foregroundColor(.appRed.opacity(0.8))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(12)
                        .background(Color.appBackground)
                        .cornerRadius(10)
                }
            }

            Button {
                runTest()
            } label: {
                Group {
                    if case .loading = testState {
                        ProgressView().tint(.white)
                    } else {
                        Label("傳送 \"hi\" 測試", systemImage: "paperplane.fill")
                    }
                }
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(canTest ? Color.appPurple : Color.appBorder)
                .cornerRadius(12)
            }
            .disabled(!canTest || { if case .loading = testState { return true } else { return false } }())
        }
        .padding(16)
        .background(Color.appCard)
        .cornerRadius(16)
    }

    private var canTest: Bool {
        !apiKey.isEmpty && !endpoint.isEmpty && !modelName.isEmpty
    }

    // MARK: - Helpers

    private func flash() {
        saved = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { saved = false }
    }

    private func runTest() {
        let key      = apiKey.trimmingCharacters(in: .whitespacesAndNewlines)
        let base     = endpoint.trimmingCharacters(in: .whitespacesAndNewlines)
        let model    = modelName.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !key.isEmpty, !base.isEmpty, !model.isEmpty else { return }

        testState = .loading

        Task { @MainActor in
            do {
                let reply = try await sendHi(key: key, base: base, model: model)
                testState = .success(reply)
            } catch {
                testState = .failure(error.localizedDescription)
            }
        }
    }

    private func sendHi(key: String, base: String, model: String) async throws -> String {
        let urlStr = base.hasSuffix("/") ? "\(base)chat/completions" : "\(base)/chat/completions"
        guard let url = URL(string: urlStr) else {
            throw URLError(.badURL)
        }

        let body: [String: Any] = [
            "model":      model,
            "max_tokens": 256,
            "messages":   [["role": "user", "content": "hi"]]
        ]

        var req = URLRequest(url: url, timeoutInterval: 30)
        req.httpMethod = "POST"
        req.setValue("Bearer \(key)",    forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: req)

        guard let http = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }
        guard http.statusCode == 200 else {
            let preview = String(data: data.prefix(300), encoding: .utf8) ?? "（無法解析）"
            throw NSError(domain: "LLM", code: http.statusCode,
                          userInfo: [NSLocalizedDescriptionKey: "HTTP \(http.statusCode): \(preview)"])
        }

        // OpenAI-compatible response shape
        struct Response: Decodable {
            struct Choice: Decodable {
                struct Message: Decodable { let content: String }
                let message: Message
            }
            let choices: [Choice]
        }

        let decoded = try JSONDecoder().decode(Response.self, from: data)
        return decoded.choices.first?.message.content ?? "（空回覆）"
    }
}

#Preview {
    NavigationStack {
        LLMSettingsView()
    }
}
