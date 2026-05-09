import SwiftUI

struct ExercisesView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var searchText = ""
    @State private var selectedEquipment: String? = nil

    private let equipment = ["徒手", "啞鈴", "槓鈴", "機械", "繩索", "壺鈴"]
    private let equipmentColors: [String: Color] = [
        "徒手": .appEmerald,
        "啞鈴": .appBlue,
        "槓鈴": .appOrange,
        "機械": .appPurple,
        "繩索": .appYellow,
        "壺鈴": .appRed,
    ]

    private let exercises: [(name: String, muscles: String, equipment: String)] = [
        ("臥推",       "胸 · 三頭",    "槓鈴"),
        ("深蹲",       "腿 · 臀",      "槓鈴"),
        ("硬舉",       "背 · 腿",      "槓鈴"),
        ("肩推",       "肩 · 三頭",    "槓鈴"),
        ("引體向上",   "背 · 二頭",    "徒手"),
        ("啞鈴飛鳥",   "胸",           "啞鈴"),
        ("槓鈴彎舉",   "二頭",         "槓鈴"),
        ("滑輪下拉",   "背 · 二頭",    "機械"),
        ("腿推機",     "腿",           "機械"),
        ("繩索夾胸",   "胸",           "繩索"),
    ]

    private var filtered: [(name: String, muscles: String, equipment: String)] {
        exercises.filter { ex in
            let matchesSearch = searchText.isEmpty || ex.name.contains(searchText)
            let matchesEquipment = selectedEquipment == nil || ex.equipment == selectedEquipment
            return matchesSearch && matchesEquipment
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Button { dismiss() } label: {
                    ZStack {
                        Circle()
                            .fill(Color.appCard)
                            .frame(width: 32, height: 32)
                        Image(systemName: "chevron.left")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.appTextSub)
                    }
                }
                Text("動作管理")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.appText)
                    .padding(.leading, 4)
                Spacer()
                Button {
                    // Add exercise
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
            .padding(.horizontal, 16)
            .padding(.top, 16)
            .padding(.bottom, 12)

            // Search
            HStack {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 15))
                    .foregroundColor(.appTextTert)
                TextField("搜尋動作...", text: $searchText)
                    .font(.system(size: 15))
                    .foregroundColor(.appText)
            }
            .padding(.horizontal, 16)
            .frame(height: 48)
            .background(Color.appCard)
            .cornerRadius(12)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.appBorder, lineWidth: 1))
            .padding(.horizontal, 16)
            .padding(.bottom, 10)

            // Equipment filter
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(equipment, id: \.self) { eq in
                        Button {
                            selectedEquipment = selectedEquipment == eq ? nil : eq
                        } label: {
                            Text(eq)
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(selectedEquipment == eq ? (equipmentColors[eq] ?? .appTextSub) : .appTextTert)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(
                                    selectedEquipment == eq
                                        ? (equipmentColors[eq] ?? .appBlue).opacity(0.15)
                                        : Color.appCard
                                )
                                .cornerRadius(100)
                        }
                    }
                }
                .padding(.horizontal, 16)
            }
            .padding(.bottom, 10)

            // List
            ScrollView {
                VStack(spacing: 8) {
                    ForEach(filtered, id: \.name) { exercise in
                        exerciseRow(exercise)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 32)
            }
        }
        .background(Color.appBackground)
        .navigationBarHidden(true)
    }

    private func exerciseRow(_ exercise: (name: String, muscles: String, equipment: String)) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(exercise.name)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.appText)
                Text(exercise.muscles)
                    .font(.system(size: 12))
                    .foregroundColor(.appTextTert)
            }
            Spacer()
            Text(exercise.equipment)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(equipmentColors[exercise.equipment] ?? .appTextTert)
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background((equipmentColors[exercise.equipment] ?? .appBlue).opacity(0.15))
                .cornerRadius(100)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 14)
        .background(Color.appCard)
        .cornerRadius(16)
    }
}

#Preview {
    NavigationStack {
        ExercisesView()
    }
}
