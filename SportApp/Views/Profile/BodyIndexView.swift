import SwiftUI

struct BodyIndexView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var showAddModal = false

    private let metrics: [(label: String, value: String, unit: String, color: Color)] = [
        ("體重",       "70.5", "kg",   .appBlue),
        ("體脂率",     "18.5", "%",    .appOrange),
        ("骨骼肌重",   "35.2", "kg",   .appEmerald),
        ("內臟脂肪指數","8",   "",     .appRed),
        ("體脂重",     "14.5", "kg",   .appYellow),
        ("基礎代謝率", "1650", "kcal", .appPurple),
        ("蛋白質重",   "12.0", "kg",   Color(hex: "22d3ee")),
        ("體內水分",   "42.0", "kg",   Color(hex: "38bdf8")),
    ]

    private let history: [(date: String, weight: String, fat: String, muscle: String)] = [
        ("2025-05-01", "70.5", "18.5%", "35.2"),
        ("2025-04-15", "71.0", "19.0%", "34.8"),
        ("2025-04-01", "71.5", "19.5%", "34.5"),
        ("2025-03-15", "72.0", "20.0%", "34.2"),
        ("2025-03-01", "72.5", "20.5%", "34.0"),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                navHeader

                Text("最後量測：2025-05-01")
                    .font(.system(size: 12))
                    .foregroundColor(.appTextTert)
                    .frame(maxWidth: .infinity, alignment: .leading)

                metricsGrid
                trendChartPlaceholder
                historySection
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
            .padding(.bottom, 32)
        }
        .background(Color.appBackground)
        .scrollContentBackground(.hidden)
        .navigationBarHidden(true)
    }

    // MARK: - Navigation Header
    private var navHeader: some View {
        HStack {
            Button {
                dismiss()
            } label: {
                ZStack {
                    Circle()
                        .fill(Color.appCard)
                        .frame(width: 32, height: 32)
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.appTextSub)
                }
            }

            Text("身體指標")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.appText)
                .padding(.leading, 4)

            Spacer()

            Button {
                showAddModal = true
            } label: {
                ZStack {
                    Circle()
                        .fill(Color.appBorder)
                        .frame(width: 32, height: 32)
                    Image(systemName: "plus")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.appTextSub)
                }
            }
        }
    }

    // MARK: - Metrics Grid
    private var metricsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            ForEach(metrics, id: \.label) { metric in
                VStack(alignment: .leading, spacing: 4) {
                    Text(metric.label)
                        .font(.system(size: 12))
                        .foregroundColor(.appTextTert)

                    HStack(alignment: .lastTextBaseline, spacing: 4) {
                        Text(metric.value)
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(metric.color)

                        if !metric.unit.isEmpty {
                            Text(metric.unit)
                                .font(.system(size: 13))
                                .foregroundColor(.appTextTert)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(16)
                .background(Color.appCard)
                .cornerRadius(16)
            }
        }
    }

    // MARK: - Trend Chart Placeholder
    private var trendChartPlaceholder: some View {
        VStack(spacing: 12) {
            HStack {
                Text("趨勢圖")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.appTextSub)
                Spacer()
                HStack(spacing: 4) {
                    chartTabButton("體重", isSelected: true)
                    chartTabButton("體脂率", isSelected: false)
                    chartTabButton("骨骼肌重", isSelected: false)
                }
            }

            // Placeholder for line chart
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.appBorder.opacity(0.3))
                    .frame(height: 160)

                // Simple mock line chart using shapes
                mockLineChart
            }
        }
        .padding(16)
        .background(Color.appCard)
        .cornerRadius(16)
    }

    private var mockLineChart: some View {
        GeometryReader { geo in
            let points: [CGPoint] = [
                CGPoint(x: 0, y: 0.6),
                CGPoint(x: 0.2, y: 0.5),
                CGPoint(x: 0.4, y: 0.55),
                CGPoint(x: 0.6, y: 0.4),
                CGPoint(x: 0.8, y: 0.45),
                CGPoint(x: 1.0, y: 0.35),
            ].map { CGPoint(x: $0.x * geo.size.width, y: $0.y * geo.size.height) }

            Path { path in
                guard let first = points.first else { return }
                path.move(to: first)
                for point in points.dropFirst() {
                    path.addLine(to: point)
                }
            }
            .stroke(Color.appBlue, style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))

            ForEach(points.indices, id: \.self) { i in
                Circle()
                    .fill(Color.appBlue)
                    .frame(width: 6, height: 6)
                    .position(points[i])
            }
        }
        .padding(8)
    }

    private func chartTabButton(_ label: String, isSelected: Bool) -> some View {
        Text(label)
            .font(.system(size: 11, weight: .medium))
            .foregroundColor(isSelected ? .appText : .appTextTert)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(isSelected ? Color.appBorder : Color.clear)
            .cornerRadius(8)
    }

    // MARK: - History
    private var historySection: some View {
        VStack(spacing: 8) {
            HStack {
                Text("歷史紀錄")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.appTextTert)
                Spacer()
            }

            ForEach(history, id: \.date) { record in
                HStack {
                    Text(record.date)
                        .font(.system(size: 14))
                        .foregroundColor(.appTextTert)
                    Spacer()
                    HStack(spacing: 16) {
                        Text("\(record.weight) kg")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.appBlue)
                        Text(record.fat)
                            .font(.system(size: 13))
                            .foregroundColor(.appOrange)
                        Text("\(record.muscle) kg")
                            .font(.system(size: 13))
                            .foregroundColor(.appEmerald)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Color.appCard)
                .cornerRadius(16)
            }
        }
    }
}

#Preview {
    NavigationStack {
        BodyIndexView()
    }
}
