import SwiftUI

struct DateSelectorView: View {
    @Binding var selectedDate: Date
    var trainedDates: Set<String> = []

    @State private var displayMonth: Date = Date()

    private let calendar = Calendar.current
    private let dayLabels = ["日", "一", "二", "三", "四", "五", "六"]

    private var displayTitle: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy年 M月"
        return formatter.string(from: displayMonth)
    }

    private var firstDayOfMonth: Date {
        calendar.date(from: calendar.dateComponents([.year, .month], from: displayMonth))!
    }

    private var leadingEmptyDays: Int {
        calendar.component(.weekday, from: firstDayOfMonth) - 1
    }

    private var daysInMonth: Int {
        calendar.range(of: .day, in: .month, for: displayMonth)!.count
    }

    private var isCurrentMonth: Bool {
        calendar.isDate(displayMonth, equalTo: Date(), toGranularity: .month)
    }

    private func dateString(for day: Int) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        var comps = calendar.dateComponents([.year, .month], from: displayMonth)
        comps.day = day
        let date = calendar.date(from: comps)!
        return formatter.string(from: date)
    }

    private func isSelected(day: Int) -> Bool {
        var comps = calendar.dateComponents([.year, .month], from: displayMonth)
        comps.day = day
        guard let d = calendar.date(from: comps) else { return false }
        return calendar.isDate(d, inSameDayAs: selectedDate)
    }

    private func isToday(day: Int) -> Bool {
        var comps = calendar.dateComponents([.year, .month], from: displayMonth)
        comps.day = day
        guard let d = calendar.date(from: comps) else { return false }
        return calendar.isDateInToday(d)
    }

    var body: some View {
        VStack(spacing: 8) {
            // Month navigation
            HStack {
                Button {
                    displayMonth = calendar.date(byAdding: .month, value: -1, to: displayMonth)!
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.appTextSub)
                        .frame(width: 32, height: 32)
                }

                Spacer()

                Text(displayTitle)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.appText)

                Spacer()

                Button {
                    displayMonth = calendar.date(byAdding: .month, value: 1, to: displayMonth)!
                } label: {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.appTextSub)
                        .frame(width: 32, height: 32)
                }
            }

            // Day labels
            HStack(spacing: 0) {
                ForEach(dayLabels, id: \.self) { label in
                    Text(label)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.appTextTert)
                        .frame(maxWidth: .infinity)
                }
            }

            // Calendar grid
            let totalCells = leadingEmptyDays + daysInMonth
            let rows = Int(ceil(Double(totalCells) / 7.0))
            ForEach(0..<rows, id: \.self) { row in
                HStack(spacing: 0) {
                    ForEach(0..<7, id: \.self) { col in
                        let cellIndex = row * 7 + col
                        let day = cellIndex - leadingEmptyDays + 1
                        Group {
                            if day >= 1 && day <= daysInMonth {
                                dayCell(day: day)
                            } else {
                                Color.clear.frame(height: 36)
                            }
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
            }

            // Back to today button
            if !isCurrentMonth {
                Button {
                    displayMonth = Date()
                    selectedDate = Date()
                } label: {
                    Text("回到今天")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.appBlue)
                        .padding(.vertical, 4)
                }
            }
        }
        .padding(12)
        .background(Color.appCard)
        .cornerRadius(16)
    }

    private func dayCell(day: Int) -> some View {
        let selected = isSelected(day: day)
        let today = isToday(day: day)
        let trained = trainedDates.contains(dateString(for: day))

        return Button {
            var comps = calendar.dateComponents([.year, .month], from: displayMonth)
            comps.day = day
            if let d = calendar.date(from: comps) {
                selectedDate = d
            }
        } label: {
            ZStack {
                Circle()
                    .fill(selected ? Color.appBlueCTA : Color.clear)
                    .frame(width: 32, height: 32)

                if today && !selected {
                    Circle()
                        .stroke(Color.appBlue, lineWidth: 1.5)
                        .frame(width: 32, height: 32)
                }

                Text("\(day)")
                    .font(.system(size: 13, weight: selected ? .semibold : .regular))
                    .foregroundColor(selected ? .white : today ? .appText : .appTextSub)

                if trained && !selected {
                    Circle()
                        .fill(Color.appEmerald)
                        .frame(width: 5, height: 5)
                        .offset(y: 10)
                }
            }
            .frame(height: 36)
        }
    }
}
