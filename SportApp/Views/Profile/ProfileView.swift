import SwiftUI

struct ProfileView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                titleSection
                healthSection
                nutritionSection
                workoutSection
                appSection
                aboutCard
            }
            .padding(.horizontal, 16)
            .padding(.top, 24)
            .padding(.bottom, 32)
        }
        .background(Color.appBackground)
        .scrollContentBackground(.hidden)
        .navigationBarHidden(true)
    }

    // MARK: - Title
    private var titleSection: some View {
        HStack {
            Text("個人設定")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.appText)
            Spacer()
        }
    }

    // MARK: - Sections
    private var healthSection: some View {
        VStack(spacing: 8) {
            SectionLabel(text: "健康數據")
            NavigationLink(destination: BodyIndexView()) {
                settingsRow(
                    icon: "person.fill",
                    iconColor: .appEmerald,
                    iconBg: Color.appEmerald.opacity(0.15),
                    title: "身體指標",
                    description: "體重、體脂率、骨骼肌等數據"
                )
            }
            .buttonStyle(.plain)
        }
    }

    private var nutritionSection: some View {
        VStack(spacing: 8) {
            SectionLabel(text: "飲食設定")
            NavigationLink(destination: NutritionGoalsView()) {
                settingsRow(
                    icon: "fork.knife",
                    iconColor: .appOrange,
                    iconBg: Color.appOrange.opacity(0.15),
                    title: "飲食目標",
                    description: "每日卡路里與三大營養素目標"
                )
            }
            .buttonStyle(.plain)
        }
    }

    private var workoutSection: some View {
        VStack(spacing: 8) {
            SectionLabel(text: "運動設定")
            NavigationLink(destination: ExercisesView()) {
                settingsRow(
                    icon: "dumbbell.fill",
                    iconColor: .appBlue,
                    iconBg: Color.appBlue.opacity(0.15),
                    title: "動作管理",
                    description: "新增、編輯、刪除訓練動作"
                )
            }
            .buttonStyle(.plain)
        }
    }

    private var appSection: some View {
        VStack(spacing: 8) {
            SectionLabel(text: "應用程式")
            NavigationLink(destination: NotionImportView()) {
                settingsRow(
                    icon: "arrow.down.circle.fill",
                    iconColor: .appTextSub,
                    iconBg: Color.appBorder,
                    title: "匯入 Notion 資料",
                    description: "從舊版 Notion 資料庫匯入歷史紀錄"
                )
            }
            .buttonStyle(.plain)
        }
    }

    // MARK: - Settings Row
    private func settingsRow(icon: String, iconColor: Color, iconBg: Color, title: String, description: String) -> some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(iconBg)
                    .frame(width: 36, height: 36)
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundColor(iconColor)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.appText)
                Text(description)
                    .font(.system(size: 12))
                    .foregroundColor(.appTextTert)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 14))
                .foregroundColor(.appTextMuted)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(Color.appCard)
        .cornerRadius(16)
    }

    private func settingsRowPlain(icon: String, iconColor: Color, iconBg: Color, title: String, description: String) -> some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(iconBg)
                    .frame(width: 36, height: 36)
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundColor(iconColor)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.appText)
                Text(description)
                    .font(.system(size: 12))
                    .foregroundColor(.appTextTert)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 14))
                .foregroundColor(.appTextMuted)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(Color.appCard)
        .cornerRadius(16)
    }

    // MARK: - About
    private var aboutCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("關於")
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.appTextSub)
            Text("運動紀錄 v1.0")
                .font(.system(size: 12))
                .foregroundColor(.appTextTert)
            Text("資料存儲於你的 Notion workspace")
                .font(.system(size: 12))
                .foregroundColor(.appTextMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color.appCard)
        .cornerRadius(16)
    }
}

#Preview {
    NavigationStack {
        ProfileView()
    }
}
