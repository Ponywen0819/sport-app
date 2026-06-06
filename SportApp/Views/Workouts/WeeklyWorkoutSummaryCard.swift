import SwiftUI

// The "本週訓練" card at the top of the workouts tab: a Monday-indexed row of
// seven day dots, filled for days that have logged sets, with the trained-day
// and total-set tallies in the header.
struct WeeklyWorkoutSummaryCard: View {
    let setsByDay: [Int?]
    let todayIndex: Int

    private let dayLabels = ["一", "二", "三", "四", "五", "六", "日"]

    private var totalDays: Int { setsByDay.compactMap { $0 }.count }
    private var totalSets: Int { setsByDay.compactMap { $0 }.reduce(0, +) }

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Text("本週訓練")
                    .font(.appCardLabel)
                    .foregroundColor(.appTextSub)
                Spacer()
                HStack(spacing: 12) {
                    HStack(spacing: 4) {
                        Text("\(totalDays)")
                            .font(.appControlLabel)
                            .foregroundColor(.appEmerald)
                        Text("天")
                            .font(.appCaption)
                            .foregroundColor(.appTextTert)
                    }
                    HStack(spacing: 4) {
                        Text("\(totalSets)")
                            .font(.appControlLabel)
                            .foregroundColor(.appBlue)
                        Text("組")
                            .font(.appCaption)
                            .foregroundColor(.appTextTert)
                    }
                }
            }

            HStack(spacing: 0) {
                ForEach(0..<7, id: \.self) { index in
                    VStack(spacing: 4) {
                        Text(dayLabels[index])
                            .font(.appMicro)
                            .foregroundColor(index == todayIndex ? .appTextSub : .appTextTert)

                        ZStack {
                            if index == todayIndex {
                                Circle()
                                    .stroke(Color.appBlue, lineWidth: 1.5)
                                    .frame(width: 30, height: 30)
                            }
                            Circle()
                                .fill(setsByDay[index] != nil ? Color.appEmeraldCTA : Color.clear)
                                .overlay(
                                    Circle().stroke(
                                        setsByDay[index] != nil ? Color.clear : Color.appBorder,
                                        lineWidth: 1
                                    )
                                )
                                .frame(width: 26, height: 26)
                        }
                        .frame(width: 30, height: 30)

                        Text(setsByDay[index].map { "\($0)" } ?? "")
                            .font(.system(size: 10))
                            .foregroundColor(.appTextTert)
                            .frame(height: 12)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .padding(16)
        .background(Color.appCard)
        .cornerRadius(16)
    }
}
