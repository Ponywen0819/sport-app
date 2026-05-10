import SwiftUI
import SwiftData

struct ExercisesView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(ExerciseRepository.self) private var repo
    @Query(sort: \Exercise.name) private var exercises: [Exercise]

    @State private var searchText = ""
    @State private var selectedEquipment: String? = nil
    @State private var showAddSheet = false

    private let equipment = ["徒手", "啞鈴", "槓鈴", "機械", "繩索", "壺鈴"]
    private let equipmentColors: [String: Color] = [
        "徒手": .appEmerald,
        "啞鈴": .appBlue,
        "槓鈴": .appOrange,
        "機械": .appPurple,
        "繩索": .appYellow,
        "壺鈴": .appRed,
    ]

    private var filtered: [Exercise] {
        exercises.filter { ex in
            let matchesSearch = searchText.isEmpty || ex.name.contains(searchText)
            let matchesEquipment = selectedEquipment == nil || ex.equipment == selectedEquipment
            return matchesSearch && matchesEquipment
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            searchBar
            equipmentFilter
            exerciseList
        }
        .background(Color.appBackground)
        .navigationBarHidden(true)
        .sheet(isPresented: $showAddSheet) {
            AddExerciseSheet(equipmentColors: equipmentColors) { name, equipment, brand, muscles in
                try? repo.add(Exercise(name: name, equipment: equipment, brand: brand, muscleGroups: muscles))
            }
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Button { dismiss() } label: {
                ZStack {
                    Circle().fill(Color.appCard).frame(width: 32, height: 32)
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
            Button { showAddSheet = true } label: {
                ZStack {
                    Circle().fill(Color.appBorder).frame(width: 32, height: 32)
                    Image(systemName: "plus")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.appTextSub)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 16)
        .padding(.bottom, 12)
    }

    // MARK: - Search

    private var searchBar: some View {
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
    }

    // MARK: - Equipment Filter

    private var equipmentFilter: some View {
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
    }

    // MARK: - List

    private var exerciseList: some View {
        List {
            ForEach(filtered) { exercise in
                exerciseRow(exercise)
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets(top: 0, leading: 16, bottom: 0, trailing: 16))
                    .listRowSeparator(.hidden)
                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                        Button(role: .destructive) {
                            try? repo.delete(exercise)
                        } label: {
                            Label("刪除", systemImage: "trash")
                                .tint(Color.appRed)
                        }
                    }
            }
            Color.clear
                .frame(height: 32)
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
                .listRowInsets(EdgeInsets())
        }
        .listStyle(.plain)
        .listRowSpacing(8)
        .scrollContentBackground(.hidden)
        .background(Color.appBackground)
    }

    private func exerciseRow(_ exercise: Exercise) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(exercise.name)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.appText)
                HStack(spacing: 6) {
                    if let brand = exercise.brand, !brand.isEmpty {
                        Text(brand)
                            .font(.system(size: 12))
                            .foregroundColor(.appPurple)
                        Text("·")
                            .font(.system(size: 12))
                            .foregroundColor(.appTextTert)
                    }
                    Text(exercise.muscleGroups.joined(separator: " · "))
                        .font(.system(size: 12))
                        .foregroundColor(.appTextTert)
                }
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

// MARK: - Add Exercise Sheet

private struct AddExerciseSheet: View {
    @Environment(\.dismiss) private var dismiss

    let equipmentColors: [String: Color]
    let onSave: (String, String, String?, [String]) -> Void

    @State private var name = ""
    @State private var selectedEquipment = "槓鈴"
    @State private var brand = ""
    @State private var selectedMuscles: Set<String> = []

    private let equipmentOptions = ["徒手", "啞鈴", "槓鈴", "機械", "繩索", "壺鈴"]
    private let muscleOptions = ["胸", "背", "肩", "二頭", "三頭", "腿", "臀", "核心"]

    private var canSave: Bool { !name.trimmingCharacters(in: .whitespaces).isEmpty }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Name
                    VStack(alignment: .leading, spacing: 6) {
                        Text("動作名稱")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.appTextTert)
                        TextField("例：臥推", text: $name)
                            .font(.system(size: 15))
                            .foregroundColor(.appText)
                            .padding(.horizontal, 16)
                            .frame(height: 48)
                            .background(Color.appBackground)
                            .cornerRadius(12)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.appBorder, lineWidth: 1))
                    }

                    // Equipment
                    VStack(alignment: .leading, spacing: 10) {
                        Text("器材")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.appTextTert)
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                            ForEach(equipmentOptions, id: \.self) { eq in
                                Button {
                                    withAnimation(.easeInOut(duration: 0.2)) {
                                        selectedEquipment = eq
                                    }
                                } label: {
                                    Text(eq)
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundColor(selectedEquipment == eq ? (equipmentColors[eq] ?? .appBlue) : .appTextTert)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 10)
                                        .background(
                                            selectedEquipment == eq
                                                ? (equipmentColors[eq] ?? .appBlue).opacity(0.15)
                                                : Color.appCard
                                        )
                                        .cornerRadius(12)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 12)
                                                .stroke(
                                                    selectedEquipment == eq
                                                        ? (equipmentColors[eq] ?? .appBlue).opacity(0.4)
                                                        : Color.clear,
                                                    lineWidth: 1
                                                )
                                        )
                                }
                            }
                        }
                    }

                    // Brand (機械 only)
                    if selectedEquipment == "機械" {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("廠牌（選填）")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.appTextTert)
                            TextField("例：Life Fitness", text: $brand)
                                .font(.system(size: 15))
                                .foregroundColor(.appText)
                                .padding(.horizontal, 16)
                                .frame(height: 48)
                                .background(Color.appBackground)
                                .cornerRadius(12)
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.appBorder, lineWidth: 1))
                        }
                        .transition(.opacity.combined(with: .move(edge: .top)))
                    }

                    // Muscle groups
                    VStack(alignment: .leading, spacing: 10) {
                        Text("主要肌群（可多選）")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.appTextTert)
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                            ForEach(muscleOptions, id: \.self) { muscle in
                                Button {
                                    if selectedMuscles.contains(muscle) {
                                        selectedMuscles.remove(muscle)
                                    } else {
                                        selectedMuscles.insert(muscle)
                                    }
                                } label: {
                                    Text(muscle)
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundColor(selectedMuscles.contains(muscle) ? .appBlue : .appTextTert)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 10)
                                        .background(
                                            selectedMuscles.contains(muscle)
                                                ? Color.appBlue.opacity(0.15)
                                                : Color.appCard
                                        )
                                        .cornerRadius(12)
                                }
                            }
                        }
                    }

                    // Save
                    Button {
                        let brandValue = selectedEquipment == "機械" ? brand.trimmingCharacters(in: .whitespaces) : nil
                        onSave(name.trimmingCharacters(in: .whitespaces), selectedEquipment, brandValue?.isEmpty == false ? brandValue : nil, Array(selectedMuscles))
                        dismiss()
                    } label: {
                        Text("新增動作")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                            .background(canSave ? Color.appBlueCTA : Color.appBorder)
                            .cornerRadius(12)
                    }
                    .disabled(!canSave)
                }
                .padding(16)
            }
            .background(Color.appBackground)
            .scrollContentBackground(.hidden)
            .navigationTitle("新增動作")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.appCard, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") { dismiss() }
                        .foregroundColor(.appTextSub)
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        ExercisesView()
    }
    .modelContainer(for: Exercise.self, inMemory: true)
    .environment(ExerciseRepository(context: try! ModelContainer(for: Exercise.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)).mainContext))
}
