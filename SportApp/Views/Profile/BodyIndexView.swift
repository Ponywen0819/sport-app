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
                NavHeader("身體指標", onBack: { dismiss() }) {
                    NavHeaderButton(icon: "plus", fill: .appBorder) { showAddSheet = true }
                }

                if let latest = latest {
                    Text("最後量測：\(DateFormat.dayKey(latest.date))")
                        .font(.appCaption)
                        .foregroundColor(.appTextTert)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    metricsGrid
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

    // MARK: Metrics Grid

    // Scan records (newest first) for the first non-nil value of a field.
    // Returns (value, isFilled) where isFilled=true means it came from an older record.
    private func resolve(_ keyPath: KeyPath<BodyIndex, Double?>) -> (value: Double, isFilled: Bool)? {
        for (i, record) in records.enumerated() {
            if let v = record[keyPath: keyPath] {
                return (v, i > 0)
            }
        }
        return nil
    }

    private var metricsGrid: some View {
        typealias Item = (label: String, value: String, unit: String, color: Color, filled: Bool)

        func item(_ label: String, _ v: Double, _ unit: String, _ color: Color) -> Item {
            (label, fmtVal(v), unit, color, false)
        }
        func itemOpt(_ label: String, _ kp: KeyPath<BodyIndex, Double?>, _ unit: String, _ color: Color) -> Item {
            if let r = resolve(kp) {
                return (label, fmtVal(r.value), unit, color, r.isFilled)
            }
            return (label, "—", unit, color, false)
        }

        guard let latest = records.first else { return AnyView(EmptyView()) }

        let items: [Item] = [
            item   ("體重",     latest.weight,     "kg",   .appBlue),
            itemOpt("體脂率",   \.bodyFatPercentage,  "%",    .appOrange),
            itemOpt("骨骼肌重", \.skeletalMuscleWeight, "kg", .appEmerald),
            itemOpt("內臟脂肪", \.visceralFatIndex,   "",     .appRed),
            itemOpt("體脂重",   \.bodyFatWeight,      "kg",   .appYellow),
            itemOpt("基礎代謝", \.basalMetabolicRate,  "kcal", .appPurple),
            itemOpt("蛋白質重", \.proteinWeight,       "kg",   Color(hex: "22d3ee")),
            itemOpt("體內水分", \.totalWater,          "kg",   Color(hex: "38bdf8")),
        ]

        return AnyView(
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach(items, id: \.label) { it in
                    metricCard(label: it.label, value: it.value,
                                unit: it.unit, color: it.color, filled: it.filled)
                }
            }
        )
    }

    private func metricCard(label: String, value: String, unit: String, color: Color, filled: Bool) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                Text(label)
                    .font(.appCaption)
                    .foregroundColor(.appTextTert)
                if filled {
                    Image(systemName: "clock.arrow.circlepath")
                        .font(.system(size: 9))
                        .foregroundColor(.appTextMuted)
                }
            }
            HStack(alignment: .lastTextBaseline, spacing: 4) {
                Text(value)
                    .font(.appStatValue)
                    .foregroundColor(value == "—" ? .appTextTert : (filled ? color.opacity(0.6) : color))
                if !unit.isEmpty && value != "—" {
                    Text(unit)
                        .font(.appCaption)
                        .foregroundColor(.appTextTert)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color.appCard)
        .cornerRadius(16)
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
                    .font(.appCardLabel)
                    .foregroundColor(.appTextSub)
                Spacer()
                HStack(spacing: 4) {
                    ForEach(ChartMetric.allCases, id: \.self) { m in
                        Button { chartMetric = m } label: {
                            Text(m.rawValue)
                                .font(.appMicro)
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
                    .font(.appCaption)
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
                    .font(.appCardLabel)
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
                        .font(.appCaption)
                        .foregroundColor(.appBlue)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 4)
            }
        }
    }

    private func historyRow(record: BodyIndex) -> some View {
        HStack {
            Text(DateFormat.dayKey(record.date))
                .font(.appBody)
                .foregroundColor(.appTextTert)
            Spacer()
            HStack(spacing: 14) {
                Text("\(fmtVal(record.weight)) kg")
                    .font(.appCardLabel)
                    .foregroundColor(.appBlue)
                if let fat = record.bodyFatPercentage {
                    Text("\(fmtVal(fat))%")
                        .font(.appCaption)
                        .foregroundColor(.appOrange)
                }
                if let muscle = record.skeletalMuscleWeight {
                    Text("\(fmtVal(muscle)) kg")
                        .font(.appCaption)
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
                .font(.appBody)
                .foregroundColor(.appTextTert)
            Text("點擊右上角 + 新增第一筆量測")
                .font(.appCaption)
                .foregroundColor(.appTextMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }

    // MARK: Helpers

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
                            .font(.appMicro)
                            .foregroundColor(color)
                            .position(x: points[i].x, y: max(points[i].y - 13, 8))
                    }
                }
            }

            // Date axis
            HStack {
                Text(DateFormat.shortDate(data.first!.0))
                    .font(.appMicro)
                    .foregroundColor(.appTextTert)
                Spacer()
                Text(DateFormat.shortDate(data.last!.0))
                    .font(.appMicro)
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
