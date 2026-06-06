import SwiftUI
import SwiftData

struct NotionImportView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @AppStorage("notionImportExercisesDbId") private var exercisesDbId: String = ""
    @AppStorage("notionImportFoodsDbId")     private var foodsDbId:     String = ""
    @AppStorage("notionImportMealsDbId")     private var mealsDbId:     String = ""
    @AppStorage("notionImportWorkoutsDbId")  private var workoutsDbId:  String = ""
    @AppStorage("notionImportBodyDbId")      private var bodyDbId:      String = ""

    @State private var token:      String = ""
    @State private var isRunning:  Bool   = false
    @State private var result:     ImportResult?

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                NavHeader("匯入 Notion 資料", onBack: { dismiss() })

                tokenCard
                databaseIdsCard

                if let result {
                    resultCard(result)
                }

                importButton
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
            .padding(.bottom, 32)
        }
        .background(Color.appBackground)
        .scrollContentBackground(.hidden)
        .navigationBarHidden(true)
        .onAppear {
            token = KeychainHelper.loadToken() ?? ""
        }
        .disabled(isRunning)
    }

    // MARK: - Header

    // MARK: - Token

    private var tokenCard: some View {
        VStack(spacing: 12) {
            sectionTitle("Notion Integration Token")

            VStack(alignment: .leading, spacing: 6) {
                Text("Internal Integration Token")
                    .font(.appLabel)
                    .foregroundColor(.appTextTert)
                SecureField("secret_xxx...", text: $token)
                    .font(.system(size: 14))
                    .foregroundColor(.appText)
                    .padding(.horizontal, 16)
                    .frame(height: 48)
                    .background(Color.appBackground)
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.appBorder, lineWidth: 1))
                    .onChange(of: token) { _, new in
                        if new.isEmpty { KeychainHelper.deleteToken() }
                        else           { KeychainHelper.saveToken(new) }
                    }
                Text("在 Notion 設定 → 整合 頁面建立一個 internal integration，複製 token 後貼入此處")
                    .font(.appMicro)
                    .foregroundColor(.appTextMuted)
            }
        }
        .padding(16)
        .appCard()
    }

    // MARK: - DB IDs

    private var databaseIdsCard: some View {
        VStack(spacing: 12) {
            sectionTitle("Notion 資料庫 ID")

            VStack(spacing: 10) {
                dbField(label: "Exercises 資料庫",        hint: "動作名稱、器材、部位", value: $exercisesDbId)
                dbField(label: "Foods 資料庫",            hint: "食物名稱與營養資訊",   value: $foodsDbId)
                dbField(label: "Meal Items 資料庫",       hint: "每日飲食紀錄",         value: $mealsDbId)
                dbField(label: "Exercise Records 資料庫", hint: "訓練重量與組數紀錄",   value: $workoutsDbId)
                dbField(label: "Body Indexes 資料庫",     hint: "體重、體脂等身體指標", value: $bodyDbId)
            }

            Text("在 Notion 中開啟資料庫頁面，從網址列複製資料庫 ID（32 位元字串）")
                .font(.appMicro)
                .foregroundColor(.appTextMuted)
        }
        .padding(16)
        .appCard()
    }

    private func dbField(label: String, hint: String, value: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.appLabel)
                .foregroundColor(.appTextTert)
            TextField(hint, text: value)
                .font(.system(size: 13))
                .foregroundColor(.appText)
                .autocapitalization(.none)
                .disableAutocorrection(true)
                .padding(.horizontal, 12)
                .frame(height: 40)
                .background(Color.appBackground)
                .cornerRadius(10)
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.appBorder, lineWidth: 1))
        }
    }

    // MARK: - Import Button

    private var importButton: some View {
        Button {
            runImport()
        } label: {
            Group {
                if isRunning {
                    HStack(spacing: 8) {
                        ProgressView().tint(.white)
                        Text("匯入中...")
                    }
                } else {
                    Text("開始匯入")
                }
            }
            .font(.system(size: 15, weight: .semibold))
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(canImport ? Color.appEmerald : Color.appBorder)
            .cornerRadius(14)
        }
        .disabled(!canImport || isRunning)
    }

    private var canImport: Bool {
        !token.isEmpty && (!exercisesDbId.isEmpty || !foodsDbId.isEmpty || !mealsDbId.isEmpty || !workoutsDbId.isEmpty || !bodyDbId.isEmpty)
    }

    // MARK: - Result

    private func resultCard(_ r: ImportResult) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionTitle(r.errors.isEmpty ? "匯入完成" : "匯入完成（含錯誤）")

            VStack(spacing: 6) {
                if !exercisesDbId.isEmpty {
                    resultRow(label: "動作庫",    imported: r.exercisesImported,   skipped: r.exercisesSkipped)
                }
                if !foodsDbId.isEmpty {
                    resultRow(label: "食物",      imported: r.foodsImported,       skipped: r.foodsSkipped)
                }
                if !mealsDbId.isEmpty {
                    resultRow(label: "飲食紀錄",  imported: r.mealsImported,       skipped: r.mealsSkipped)
                }
                if !workoutsDbId.isEmpty {
                    resultRow(label: "訓練區塊",  imported: r.blocksImported,      skipped: r.blocksSkipped)
                    if r.exerciseStubsCreated > 0 {
                        resultRow(label: "自動建立動作（無器材資訊）", imported: r.exerciseStubsCreated, skipped: 0)
                    }
                }
                if !bodyDbId.isEmpty {
                    resultRow(label: "身體指標",  imported: r.bodyIndexesImported, skipped: r.bodyIndexesSkipped)
                }
            }

            if !r.errors.isEmpty {
                Divider().background(Color.appBorder)
                VStack(alignment: .leading, spacing: 4) {
                    Text("錯誤訊息")
                        .font(.appControlLabel)
                        .foregroundColor(.appRed)
                    ForEach(r.errors, id: \.self) { err in
                        Text("• \(err)")
                            .font(.appMicro)
                            .foregroundColor(.appRed.opacity(0.8))
                    }
                }
            }
        }
        .padding(16)
        .appCard()
    }

    private func resultRow(label: String, imported: Int, skipped: Int) -> some View {
        HStack {
            Text(label)
                .font(.appCaption)
                .foregroundColor(.appTextSub)
            Spacer()
            HStack(spacing: 8) {
                HStack(spacing: 3) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 11))
                        .foregroundColor(.appEmerald)
                    Text("\(imported) 匯入")
                        .font(.appCaption)
                        .foregroundColor(.appEmerald)
                }
                if skipped > 0 {
                    HStack(spacing: 3) {
                        Image(systemName: "arrow.right.circle")
                            .font(.system(size: 11))
                            .foregroundColor(.appTextMuted)
                        Text("\(skipped) 跳過")
                            .font(.appCaption)
                            .foregroundColor(.appTextMuted)
                    }
                }
            }
        }
    }

    // MARK: - Helpers

    private func sectionTitle(_ text: String) -> some View {
        HStack {
            Text(text)
                .font(.appCardLabel)
                .foregroundColor(.appTextSub)
            Spacer()
        }
    }

    private func runImport() {
        let service = NotionImportService(context: context)
        let snap = (token: token, exercises: exercisesDbId, foods: foodsDbId, meals: mealsDbId, workouts: workoutsDbId, body: bodyDbId)
        isRunning = true
        result    = nil
        Task { @MainActor in
            let r = await service.importAll(
                token:         snap.token,
                exercisesDbId: snap.exercises,
                foodsDbId:     snap.foods,
                mealsDbId:     snap.meals,
                workoutsDbId:  snap.workouts,
                bodyDbId:      snap.body
            )
            result    = r
            isRunning = false
        }
    }
}

#Preview {
    let config    = ModelConfiguration(isStoredInMemoryOnly: true)
    let container = try! ModelContainer(
        for: Exercise.self, WorkoutBlock.self, WorkoutSet.self,
             BodyIndex.self, Food.self, MealRecord.self,
        configurations: config
    )
    return NavigationStack {
        NotionImportView()
    }
    .modelContainer(container)
}
