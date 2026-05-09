import SwiftUI

struct HomeView: View {
    private let weekDayLabels = ["一", "二", "三", "四", "五", "六", "日"]
    private let trainedDays: Set<Int> = [0, 1, 3]
    private let todayIndex = 4

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                titleSection
                weeklyTrainingCard
                todayNutritionCard
                bodyMetricsCard
                quickNavSection
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
            Text("運動紀錄")
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.appText)
            Spacer()
        }
    }

    // MARK: - Weekly Training Card
    private var weeklyTrainingCard: some View {
        VStack(spacing: 12) {
            HStack {
                Text("本週訓練")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.appTextSub)
                Spacer()
                HStack(spacing: 2) {
                    Text("3")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.appEmerald)
                    Text("/ 7 天")
                        .font(.system(size: 12))
                        .foregroundColor(.appTextTert)
                }
            }

            HStack(spacing: 0) {
                ForEach(0..<7, id: \.self) { index in
                    dayColumn(index: index)
                }
            }
        }
        .padding(16)
        .background(Color.appCard)
        .cornerRadius(16)
    }

    private func dayColumn(index: Int) -> some View {
        let trained = trainedDays.contains(index)
        let isToday = index == todayIndex

        return VStack(spacing: 6) {
            Text(weekDayLabels[index])
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(isToday ? .appTextSub : .appTextTert)

            ZStack {
                // Outer ring for today
                if isToday {
                    Circle()
                        .stroke(Color.appBlue, lineWidth: 2)
                        .frame(width: 36, height: 36)
                }
                // Background
                Circle()
                    .fill(trained ? Color.appEmerald.opacity(0.2) : Color.clear)
                    .overlay(
                        Circle().stroke(
                            trained ? Color.appEmerald.opacity(0.5) : Color.appBorder,
                            lineWidth: 1
                        )
                    )
                    .frame(width: 30, height: 30)

                // Dot
                if trained {
                    Circle()
                        .fill(Color.appEmerald)
                        .frame(width: 10, height: 10)
                }
            }
            .frame(width: 36, height: 36)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Today Nutrition
    private var todayNutritionCard: some View {
        NavigationLink(destination: NutritionView()) {
            VStack(spacing: 12) {
                HStack {
                    Text("今日營養")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.appTextSub)
                    Spacer()
                }
                VStack(spacing: 8) {
                    miniProgressRow(label: "熱量", current: 1650, goal: 2000, unit: "kcal", color: .appRed)
                    miniProgressRow(label: "蛋白質", current: 120, goal: 150, unit: "g", color: .appBlue)
                }
            }
            .padding(16)
            .background(Color.appCard)
            .cornerRadius(16)
        }
        .buttonStyle(.plain)
    }

    private func miniProgressRow(label: String, current: Int, goal: Int, unit: String, color: Color) -> some View {
        VStack(spacing: 4) {
            HStack {
                Text(label)
                    .font(.system(size: 12))
                    .foregroundColor(.appTextTert)
                Spacer()
                HStack(spacing: 2) {
                    Text("\(current)")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(color)
                    Text("/ \(goal) \(unit)")
                        .font(.system(size: 12))
                        .foregroundColor(.appTextMuted)
                }
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color.appBorder)
                        .frame(height: 6)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(color)
                        .frame(
                            width: geo.size.width * min(CGFloat(current) / CGFloat(goal), 1),
                            height: 6
                        )
                }
            }
            .frame(height: 6)
        }
    }

    // MARK: - Body Metrics
    private var bodyMetricsCard: some View {
        NavigationLink(destination: BodyIndexView()) {
            VStack(spacing: 12) {
                HStack {
                    Text("身體指標")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.appTextSub)
                    Spacer()
                    Text("2025-05-01")
                        .font(.system(size: 12))
                        .foregroundColor(.appTextMuted)
                }
                HStack {
                    bodyMetric(label: "體重", value: "70.5", unit: "kg", color: .appBlue)
                    bodyMetric(label: "體脂率", value: "18.5", unit: "%", color: .appOrange)
                    bodyMetric(label: "骨骼肌", value: "35.2", unit: "kg", color: .appEmerald)
                }
            }
            .padding(16)
            .background(Color.appCard)
            .cornerRadius(16)
        }
        .buttonStyle(.plain)
    }

    private func bodyMetric(label: String, value: String, unit: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.system(size: 12))
                .foregroundColor(.appTextTert)
            HStack(alignment: .lastTextBaseline, spacing: 2) {
                Text(value)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(color)
                Text(unit)
                    .font(.system(size: 11))
                    .foregroundColor(.appTextTert)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Quick Nav
    private var quickNavSection: some View {
        VStack(spacing: 12) {
            SectionLabel(text: "快速導航")

            HStack(spacing: 12) {
                NavigationLink(destination: NutritionView()) {
                    quickNavCard(
                        icon: "leaf.fill",
                        iconColor: .appBlue,
                        iconBg: Color.appBlue.opacity(0.15),
                        title: "今日營養",
                        subtitle: "查看飲食紀錄"
                    )
                }
                .buttonStyle(.plain)

                NavigationLink(destination: WorkoutsView()) {
                    quickNavCard(
                        icon: "dumbbell.fill",
                        iconColor: .appEmerald,
                        iconBg: Color.appEmerald.opacity(0.15),
                        title: "運動記錄",
                        subtitle: "追蹤訓練進度"
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func quickNavCard(icon: String, iconColor: Color, iconBg: Color, title: String, subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(iconBg)
                    .frame(width: 40, height: 40)
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(iconColor)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.appText)
                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundColor(.appTextTert)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.appCard)
        .cornerRadius(16)
    }
}

#Preview {
    NavigationStack {
        HomeView()
    }
}
