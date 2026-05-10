import SwiftUI
import SwiftData

// MARK: - Chart Metric

private enum ChartMetric: String, CaseIterable {
    case weight  = "體重"
    case bodyFat = "體脂率"
    case muscle  = "骨骼肌重"

    func value(from r: BodyIndex) -> Double? {
        switch self {
        case .weight:  return r.weight
        case .bodyFat: return r.bodyFatPercentage
        case .muscle:  return r.skeletalMuscleWeight
        }
    }

    var color: Color {
        switch self {
        case .weight:  return .appBlue
        case .bodyFat: return .appOrange
        case .muscle:  return .appEmerald
        }
    }
}

// MARK: - Main View

struct BodyIndexView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(BodyIndexRepository.self) private var repo
    @Query(sort: \BodyIndex.date, order: .reverse) private var records: [BodyIndex]

    @State private var showAddSheet = false
    @State private var showAllHistory = false
    @State private var chartMetric: ChartMetric = .weight

    private var latest: BodyIndex? { records.first }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                navHeader

                if let latest = latest {
                    Text("最後量測：\(dateFmt.string(from: latest.date))")
                        .font(.system(size: 12))
                        .foregroundColor(.appTextTert)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    metricsGrid(record: latest)
                    trendSection
                    historySection
                } else {
                    emptyState
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
            .padding(.bottom, 32)
        }
        .background(Color.appBackground)
        .scrollContentBackground(.hidden)
        .navigationBarHidden(true)
        .sheet(isPresented: $showAddSheet) {
            AddBodyIndexSheet()
        }
    }

    // MARK: Nav Header

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
            Text("身體指標")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.appText)
                .padding(.leading, 4)
            Spacer()
            Button { showAddSheet = true } label: {
                ZStack {
                    Circle().fill(Color.appBorder).frame(width: 32, height: 32)
                    Image(systemName: "plus")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.appTextSub)
                }
            }
        }
    }

    // MARK: Metrics Grid

    private func metricsGrid(record: BodyIndex) -> some View {
        let items: [(String, String, String, Color)] = [
            ("體重",       fmtVal(record.weight),                  "kg",   .appBlue),
            ("體脂率",     fmtOpt(record.bodyFatPercentage),       "%",    .appOrange),
            ("骨骼肌重",   fmtOpt(record.skeletalMuscleWeight),    "kg",   .appEmerald),
            ("內臟脂肪",   fmtOpt(record.visceralFatIndex),        "",     .appRed),
            ("體脂重",     fmtOpt(record.bodyFatWeight),           "kg",   .appYellow),
            ("基礎代謝",   fmtOpt(record.basalMetabolicRate),      "kcal", .appPurple),
            ("蛋白質重",   fmtOpt(record.proteinWeight),           "kg",   Color(hex: "22d3ee")),
            ("體內水分",   fmtOpt(record.totalWater),              "kg",   Color(hex: "38bdf8")),
        ]

        return LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            ForEach(items, id: \.0) { label, value, unit, color in
                VStack(alignment: .leading, spacing: 4) {
                    Text(label)
                        .font(.system(size: 12))
                        .foregroundColor(.appTextTert)
                    HStack(alignment: .lastTextBaseline, spacing: 4) {
                        Text(value)
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(value == "—" ? .appTextTert : color)
                        if !unit.isEmpty && value != "—" {
                            Text(unit)
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

    // MARK: Trend Chart

    private var trendSection: some View {
        let chartData: [(Date, Double)] = records
            .compactMap { r -> (Date, Double)? in
                guard let v = chartMetric.value(from: r) else { return nil }
                return (r.date, v)
            }
            .reversed()

        return VStack(spacing: 12) {
            HStack {
                Text("趨勢")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.appTextSub)
                Spacer()
                HStack(spacing: 4) {
                    ForEach(ChartMetric.allCases, id: \.self) { m in
                        Button { chartMetric = m } label: {
                            Text(m.rawValue)
                                .font(.system(size: 11, weight: .medium))
                                .foregroundColor(chartMetric == m ? .appText : .appTextTert)
                                .padding(.horizontal, 8).padding(.vertical, 4)
                                .background(chartMetric == m ? Color.appBorder : Color.clear)
                                .cornerRadius(8)
                        }
                    }
                }
            }

            if chartData.count >= 2 {
                BodyIndexLineChart(data: chartData, color: chartMetric.color)
                    .frame(height: 160)
            } else {
                Text("需要兩筆以上資料才能顯示趨勢")
                    .font(.system(size: 13))
                    .foregroundColor(.appTextTert)
                    .frame(maxWidth: .infinity)
                    .frame(height: 60)
            }
        }
        .padding(16)
        .background(Color.appCard)
        .cornerRadius(16)
    }

    // MARK: History

    private var historySection: some View {
        VStack(spacing: 8) {
            HStack {
                Text("歷史紀錄")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.appTextSub)
                Spacer()
            }

            let displayed = showAllHistory ? records : Array(records.prefix(5))
            ForEach(displayed) { record in
                historyRow(record: record)
            }

            if records.count > 5 {
                Button { showAllHistory.toggle() } label: {
                    Text(showAllHistory ? "收起" : "顯示全部 \(records.count) 筆")
                        .font(.system(size: 13))
                        .foregroundColor(.appBlue)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 4)
            }
        }
    }

    private func historyRow(record: BodyIndex) -> some View {
        HStack {
            Text(dateFmt.string(from: record.date))
                .font(.system(size: 14))
                .foregroundColor(.appTextTert)
            Spacer()
            HStack(spacing: 14) {
                Text("\(fmtVal(record.weight)) kg")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.appBlue)
                if let fat = record.bodyFatPercentage {
                    Text("\(fmtVal(fat))%")
                        .font(.system(size: 13))
                        .foregroundColor(.appOrange)
                }
                if let muscle = record.skeletalMuscleWeight {
                    Text("\(fmtVal(muscle)) kg")
                        .font(.system(size: 13))
                        .foregroundColor(.appEmerald)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.appCard)
        .cornerRadius(16)
        .contextMenu {
            Button(role: .destructive) {
                try? repo.delete(record)
            } label: {
                Label("刪除", systemImage: "trash")
            }
        }
    }

    // MARK: Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "person.crop.circle")
                .font(.system(size: 48))
                .foregroundColor(.appTextTert)
            Text("尚無量測資料")
                .font(.system(size: 15))
                .foregroundColor(.appTextTert)
            Text("點擊右上角 + 新增第一筆量測")
                .font(.system(size: 13))
                .foregroundColor(.appTextMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }

    // MARK: Helpers

    private let dateFmt: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "zh_TW")
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private func fmtVal(_ v: Double) -> String {
        v.truncatingRemainder(dividingBy: 1) == 0
            ? "\(Int(v))"
            : String(format: "%.1f", v)
    }

    private func fmtOpt(_ v: Double?) -> String {
        guard let v else { return "—" }
        return fmtVal(v)
    }
}

// MARK: - Line Chart

private struct BodyIndexLineChart: View {
    let data: [(Date, Double)]
    let color: Color

    private let axisFmt: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "MM/dd"
        return f
    }()

    var body: some View {
        VStack(spacing: 6) {
            GeometryReader { geo in
                let w = geo.size.width
                let h = geo.size.height
                let values = data.map { $0.1 }
                let minV = values.min() ?? 0
                let maxV = values.max() ?? 1
                let range = max(maxV - minV, 0.001)
                let count = data.count

                let points: [CGPoint] = data.enumerated().map { i, item in
                    let x = count == 1 ? w / 2 : CGFloat(i) / CGFloat(count - 1) * w
                    let y = h - CGFloat((item.1 - minV) / range) * h * 0.85 - h * 0.075
                    return CGPoint(x: x, y: y)
                }

                // Guide lines
                ForEach([0.2, 0.5, 0.8], id: \.self) { pct in
                    Path { p in
                        p.move(to: CGPoint(x: 0, y: h * pct))
                        p.addLine(to: CGPoint(x: w, y: h * pct))
                    }
                    .stroke(Color.appBorder.opacity(0.35),
                            style: StrokeStyle(lineWidth: 0.5, dash: [4, 4]))
                }

                // Fill gradient
                Path { p in
                    p.move(to: CGPoint(x: points[0].x, y: h))
                    p.addLine(to: points[0])
                    for pt in points.dropFirst() { p.addLine(to: pt) }
                    p.addLine(to: CGPoint(x: points.last!.x, y: h))
                    p.closeSubpath()
                }
                .fill(color.opacity(0.12))

                // Line
                Path { p in
                    p.move(to: points[0])
                    for pt in points.dropFirst() { p.addLine(to: pt) }
                }
                .stroke(color, style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))

                // Dots + value labels at first and last
                ForEach(points.indices, id: \.self) { i in
                    Circle()
                        .fill(color)
                        .frame(width: 6, height: 6)
                        .position(points[i])

                    if i == 0 || i == count - 1 {
                        Text(fmtVal(data[i].1))
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(color)
                            .position(x: points[i].x, y: max(points[i].y - 13, 8))
                    }
                }
            }

            // Date axis
            HStack {
                Text(axisFmt.string(from: data.first!.0))
                    .font(.system(size: 10))
                    .foregroundColor(.appTextTert)
                Spacer()
                Text(axisFmt.string(from: data.last!.0))
                    .font(.system(size: 10))
                    .foregroundColor(.appTextTert)
            }
        }
    }

    private func fmtVal(_ v: Double) -> String {
        v.truncatingRemainder(dividingBy: 1) == 0
            ? "\(Int(v))"
            : String(format: "%.1f", v)
    }
}

#Preview {
    let config = ModelConfiguration(isStoredInMemoryOnly: true)
    let container = try! ModelContainer(for: BodyIndex.self, configurations: config)
    let repo = BodyIndexRepository(context: container.mainContext)
    return NavigationStack {
        BodyIndexView()
    }
    .modelContainer(container)
    .environment(repo)
}
