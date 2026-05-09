import SwiftUI

struct WorkoutsView: View {
    @State private var selectedDate = Date()
    @State private var displayUnit: WeightUnit = .pounds

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                titleSection
                DateSelectorView(selectedDate: $selectedDate, trainedDates: ["2025-05-05", "2025-05-07"])
                    .padding(.horizontal, 16)
                WeeklyWorkoutSummaryCard()
                    .padding(.horizontal, 16)
                ExerciseTrackerCard(displayUnit: $displayUnit)
                    .padding(.horizontal, 16)
            }
            .padding(.bottom, 32)
        }
        .background(Color.appBackground)
        .scrollContentBackground(.hidden)
        .navigationBarHidden(true)
    }

    private var titleSection: some View {
        HStack {
            Text("運動紀錄")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.appText)
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.top, 16)
        .padding(.bottom, 4)
    }
}

// MARK: - Weight Unit

enum WeightUnit: String, CaseIterable {
    case pounds = "磅"
    case kg = "kg"
}

// MARK: - Weekly Workout Summary

struct WeeklyWorkoutSummaryCard: View {
    private let dayLabels = ["一", "二", "三", "四", "五", "六", "日"]
    private let setsByDay: [Int?] = [3, 2, nil, 4, nil, nil, nil]
    private let todayIndex = 3

    private var totalDays: Int { setsByDay.compactMap { $0 }.count }
    private var totalSets: Int { setsByDay.compactMap { $0 }.reduce(0, +) }

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Text("本週訓練")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.appTextSub)
                Spacer()
                HStack(spacing: 12) {
                    HStack(spacing: 4) {
                        Text("\(totalDays)")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.appEmerald)
                        Text("天")
                            .font(.system(size: 12))
                            .foregroundColor(.appTextTert)
                    }
                    HStack(spacing: 4) {
                        Text("\(totalSets)")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.appBlue)
                        Text("組")
                            .font(.system(size: 12))
                            .foregroundColor(.appTextTert)
                    }
                }
            }

            HStack(spacing: 0) {
                ForEach(0..<7, id: \.self) { index in
                    VStack(spacing: 4) {
                        Text(dayLabels[index])
                            .font(.system(size: 11, weight: .medium))
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

// MARK: - Exercise Tracker

struct WorkoutBlock: Identifiable {
    let id = UUID()
    let exerciseName: String
    let blockType: BlockType
    let rounds: [WorkoutRound]

    enum BlockType: String {
        case single = "single"
        case dropSet = "drop_set"
        case superset = "superset"
        case circuit = "circuit"

        var label: String {
            switch self {
            case .single: return "單一動作"
            case .dropSet: return "Drop Set"
            case .superset: return "Superset"
            case .circuit: return "Circuit"
            }
        }

        var badgeColor: Color {
            switch self {
            case .single: return .appBlue
            case .dropSet: return .appOrange
            case .superset: return .appEmerald
            case .circuit: return .appPurple
            }
        }
    }
}

struct WorkoutRound: Identifiable {
    let id = UUID()
    let number: Int
    let weight: Double
    let reps: Int
    let unit: String
}

struct ExerciseTrackerCard: View {
    @Binding var displayUnit: WeightUnit

    private let blocks: [WorkoutBlock] = [
        WorkoutBlock(
            exerciseName: "臥推",
            blockType: .single,
            rounds: [
                WorkoutRound(number: 1, weight: 100, reps: 8, unit: "磅"),
                WorkoutRound(number: 2, weight: 100, reps: 8, unit: "磅"),
                WorkoutRound(number: 3, weight: 100, reps: 6, unit: "磅"),
            ]
        ),
        WorkoutBlock(
            exerciseName: "深蹲",
            blockType: .single,
            rounds: [
                WorkoutRound(number: 1, weight: 120, reps: 10, unit: "磅"),
                WorkoutRound(number: 2, weight: 120, reps: 10, unit: "磅"),
            ]
        ),
    ]

    private var totalSets: Int { blocks.reduce(0) { $0 + $1.rounds.count } }
    private var exerciseCount: Int { blocks.count }

    var body: some View {
        VStack(spacing: 12) {
            // Toolbar
            HStack {
                Text("共 \(exerciseCount) 個動作 · \(totalSets) 組")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.appTextSub)
                Spacer()
                unitToggle
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(Color.appCard)
            .cornerRadius(16)

            // Today's workout card
            VStack(spacing: 0) {
                HStack {
                    Text("今日訓練")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.appText)
                    Spacer()
                    Button {
                        // Add exercise
                    } label: {
                        ZStack {
                            Circle()
                                .fill(Color.appBorder)
                                .frame(width: 40, height: 40)
                            Image(systemName: "plus")
                                .font(.system(size: 18))
                                .foregroundColor(.appTextSub)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)

                Divider()
                    .background(Color.appBorder.opacity(0.5))

                ForEach(Array(blocks.enumerated()), id: \.element.id) { index, block in
                    workoutBlockRow(block: block)

                    if index < blocks.count - 1 {
                        Divider()
                            .background(Color.appBorder.opacity(0.5))
                    }
                }
            }
            .background(Color.appCard)
            .cornerRadius(16)
        }
    }

    private var unitToggle: some View {
        HStack(spacing: 0) {
            ForEach(WeightUnit.allCases, id: \.self) { unit in
                Button {
                    displayUnit = unit
                } label: {
                    Text(unit.rawValue)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(displayUnit == unit ? .appText : .appTextTert)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(displayUnit == unit ? Color.appBorder : Color.clear)
                }
            }
        }
        .background(Color.appBorder.opacity(0.6))
        .cornerRadius(12)
    }

    private func workoutBlockRow(block: WorkoutBlock) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        Text(block.exerciseName)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(.appText)

                        if block.blockType != .single {
                            Text(block.blockType.label)
                                .font(.system(size: 11))
                                .foregroundColor(block.blockType.badgeColor)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(block.blockType.badgeColor.opacity(0.15))
                                .cornerRadius(100)
                        }
                    }

                    Text("\(block.rounds.count) 回合 · \(block.rounds.count) 筆 set")
                        .font(.system(size: 12))
                        .foregroundColor(.appTextTert)
                }

                Spacer()

                HStack(spacing: 8) {
                    iconButton(systemName: "line.3.horizontal", color: .appTextTert)
                    iconButton(systemName: "plus", color: .appTextTert)
                    iconButton(systemName: "trash", color: .appTextTert)
                }
            }

            VStack(spacing: 8) {
                ForEach(block.rounds) { round in
                    roundRow(round: round)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }

    private func roundRow(round: WorkoutRound) -> some View {
        HStack {
            Text("第 \(round.number) 回合")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.appTextTert)
            Spacer()
            Text("\(Int(round.weight)) \(displayUnit.rawValue) · \(round.reps) 下")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.appTextSub)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Color.appBackground.opacity(0.45))
        .cornerRadius(12)
    }

    private func iconButton(systemName: String, color: Color) -> some View {
        ZStack {
            Circle()
                .fill(Color.appBackground.opacity(0.45))
                .frame(width: 36, height: 36)
            Image(systemName: systemName)
                .font(.system(size: 15))
                .foregroundColor(color)
        }
    }
}

#Preview {
    NavigationStack {
        WorkoutsView()
    }
}
