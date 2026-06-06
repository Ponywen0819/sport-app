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
                NavHeader("LLM API 設定", onBack: { dismiss() })
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
                .font(.appLabel)
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
                .font(.appLabel)
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
                    .font(.appCardLabel)
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
                        .font(.appCaption)
                        .foregroundColor(.appTextTert)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            case .success(let reply):
                VStack(alignment: .leading, spacing: 6) {
                    Label("回覆成功", systemImage: "checkmark.circle.fill")
                        .font(.appLabel)
                        .foregroundColor(.appEmerald)
                    Text(reply)
                        .font(.appCaption)
                        .foregroundColor(.appTextSub)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(12)
                        .background(Color.appBackground)
                        .cornerRadius(10)
                }
            case .failure(let msg):
                VStack(alignment: .leading, spacing: 6) {
                    Label("失敗", systemImage: "xmark.circle.fill")
                        .font(.appLabel)
                        .foregroundColor(.appRed)
                    Text(msg)
                        .font(.appCaption)
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
        let client = LLMClient(config: LLMConfig(
            apiKey:  apiKey.trimmingCharacters(in: .whitespacesAndNewlines),
            baseURL: endpoint.trimmingCharacters(in: .whitespacesAndNewlines),
            model:   modelName.trimmingCharacters(in: .whitespacesAndNewlines)
        ))
        testState = .loading
        Task { @MainActor in
            do {
                let reply = try await client.chat("hi", maxTokens: 256)
                testState = .success(reply)
            } catch {
                testState = .failure(error.localizedDescription)
            }
        }
    }
}

#Preview {
    NavigationStack {
        LLMSettingsView()
    }
}
