import SwiftUI
import PhotosUI

// Whole-meal photo recognition: snap or pick a photo, let the LLM identify each
// food with an estimated portion and macros, then review/edit the list before
// writing one MealRecord per item into the day's meal. Presented as its own
// sheet from the nutrition tab; the meal slot is auto-picked from the upload
// time (overridable via the picker).
struct ScanMealView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(MealRepository.self) private var mealRepo
    @Environment(FoodMemoryRepository.self) private var memoryRepo

    let date: Date

    @State private var mealType:      MealType
    @State private var pickerItem:    PhotosPickerItem? = nil
    @State private var selectedImage: UIImage?          = nil
    @State private var showCamera:    Bool              = false
    @State private var scanPhase:     PhotoScanPhase    = .idle
    @State private var items:         [ScannedItem]     = []

    init(date: Date) {
        self.date = date
        _mealType = State(initialValue: .forTime())
    }

    private var canSave: Bool {
        !items.isEmpty && items.allSatisfy { $0.isValid }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    PhotoScanCard(
                        image:      $selectedImage,
                        pickerItem: $pickerItem,
                        phase:      scanPhase,
                        analyzingLabel: "AI 辨識中...",
                        doneLabel:      "辨識完成",
                        onCamera:     { showCamera = true },
                        onReanalyze:  { Task { await analyze() } }
                    )

                    mealPicker

                    if items.isEmpty {
                        hint
                    } else {
                        ForEach($items) { $item in
                            itemRow($item)
                        }
                        saveButton
                    }
                }
                .padding(16)
            }
            .background(Color.appBackground)
            .scrollContentBackground(.hidden)
            .navigationTitle("拍照辨識整餐")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.appCard, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("取消") { dismiss() }.foregroundColor(.appTextSub)
                }
            }
        }
        .fullScreenCover(isPresented: $showCamera) {
            CameraPicker(image: $selectedImage)
                .ignoresSafeArea()
        }
        .onChange(of: selectedImage) { _, img in
            if img != nil { Task { await analyze() } }
        }
        .onChange(of: pickerItem) { _, item in
            Task {
                if let data = try? await item?.loadTransferable(type: Data.self),
                   let img  = UIImage(data: data) {
                    selectedImage = img
                }
            }
        }
    }

    // MARK: - Subviews

    // Auto-assigned by upload time; user can still override the target meal.
    private var mealPicker: some View {
        HStack {
            Text("加入餐別")
                .font(.appBody)
                .foregroundColor(.appTextSub)
            Spacer()
            Menu {
                ForEach(MealType.allCases, id: \.self) { type in
                    Button(type.rawValue) { mealType = type }
                }
            } label: {
                HStack(spacing: 4) {
                    Text(mealType.rawValue)
                        .font(.appBody)
                        .foregroundColor(.appBlue)
                    Image(systemName: "chevron.up.chevron.down")
                        .font(.system(size: 11))
                        .foregroundColor(.appBlue)
                }
            }
        }
        .padding(16)
        .appCard()
    }

    private var hint: some View {
        VStack(spacing: 6) {
            Text("拍一張餐點照片")
                .font(.appBody)
                .foregroundColor(.appTextSub)
            Text("AI 會辨識各項食物並估算份量與營養素，\n你可以再逐項調整後存入\(mealType.rawValue)。")
                .font(.appCaption)
                .foregroundColor(.appTextTert)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
    }

    private func itemRow(_ item: Binding<ScannedItem>) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                TextField("食物名稱", text: item.name)
                    .font(.appItemTitle)
                    .foregroundColor(.appText)
                Spacer()
                Button {
                    items.removeAll { $0.id == item.wrappedValue.id }
                } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 13))
                        .foregroundColor(.appTextMuted)
                        .frame(width: 28, height: 28)
                }
            }

            HStack(spacing: 8) {
                Text("份量")
                    .font(.appCaption)
                    .foregroundColor(.appTextTert)
                TextField("0", text: item.intakeStr)
                    .keyboardType(.decimalPad)
                    .font(.appBody)
                    .foregroundColor(.appText)
                    .multilineTextAlignment(.center)
                    .frame(width: 72, height: 36)
                    .background(Color.appBackground)
                    .cornerRadius(8)
                Text("g")
                    .font(.appCaption)
                    .foregroundColor(.appTextTert)
                Spacer()
            }

            Text("\(fmt(item.wrappedValue.calories)) kcal · P \(fmt(item.wrappedValue.protein))g · F \(fmt(item.wrappedValue.fat))g · C \(fmt(item.wrappedValue.carbs))g")
                .font(.appMicro)
                .foregroundColor(.appTextTert)
        }
        .padding(16)
        .appCard()
    }

    private var saveButton: some View {
        Button(action: save) {
            Text("加入\(mealType.rawValue)（\(items.count) 項）")
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(canSave ? Color.appBlueCTA : Color.appBorder)
                .cornerRadius(12)
        }
        .disabled(!canSave)
    }

    // MARK: - Actions

    private func save() {
        guard canSave else { return }
        for item in items {
            let record = MealRecord(
                date: date,
                mealType: mealType,
                foodName: item.name.trimmingCharacters(in: .whitespaces),
                intake: item.intake,
                calories: item.calories,
                protein: item.protein,
                fat: item.fat,
                carbs: item.carbs
            )
            try? mealRepo.add(record)
        }

        // Best-effort RAG write-back: remember these confirmed foods (with the
        // photo embedding) so future scans of similar meals are more accurate.
        // Fire-and-forget so saving stays snappy.
        if let image = selectedImage,
           let service = FoodVisionService.fromStoredSettings(memory: memoryRepo) {
            let confirmed = items.map {
                ConfirmedFood(
                    name: $0.name.trimmingCharacters(in: .whitespaces),
                    grams: $0.intake,
                    calories: $0.calories, protein: $0.protein, fat: $0.fat, carbs: $0.carbs,
                    userEdited: $0.isEdited
                )
            }
            Task { await service.remember(confirmed, from: image) }
        }

        dismiss()
    }

    // MARK: - Scan

    @MainActor
    private func analyze() async {
        guard let image = selectedImage else { return }
        guard let service = FoodVisionService.fromStoredSettings(memory: memoryRepo) else {
            scanPhase = .error(FoodVisionError.notConfigured.localizedDescription ?? "")
            return
        }

        scanPhase = .analyzing
        do {
            let foods = try await service.recognizeFoods(image)
            items = foods.map {
                ScannedItem(
                    name:     $0.name,
                    intake:   $0.grams,
                    calories: $0.calories,
                    protein:  $0.protein,
                    fat:      $0.fat,
                    carbs:    $0.carbs
                )
            }
            scanPhase = items.isEmpty ? .error("沒有辨識到食物，請換一張清楚的照片") : .done
        } catch {
            scanPhase = .error(error.localizedDescription)
        }
    }

    private func fmt(_ v: Double) -> String {
        v.truncatingRemainder(dividingBy: 1) == 0 ? "\(Int(v))" : String(format: "%.1f", v)
    }
}

// MARK: - Editable scanned item

// A recognized food the user can tweak before saving. Macros scale from the
// AI's original estimate as the user adjusts the portion.
private struct ScannedItem: Identifiable {
    let id = UUID()
    var name: String
    var intakeStr: String

    let baseName:     String
    let baseIntake:   Double
    let baseCalories: Double
    let baseProtein:  Double
    let baseFat:      Double
    let baseCarbs:    Double

    init(name: String, intake: Double, calories: Double, protein: Double, fat: Double, carbs: Double) {
        self.name         = name
        self.baseName     = name
        self.baseIntake   = intake
        self.baseCalories = calories
        self.baseProtein  = protein
        self.baseFat      = fat
        self.baseCarbs    = carbs
        self.intakeStr = intake.truncatingRemainder(dividingBy: 1) == 0
            ? "\(Int(intake))"
            : String(format: "%.1f", intake)
    }

    var intake: Double { Double(intakeStr.trimmingCharacters(in: .whitespaces)) ?? 0 }
    private var ratio: Double { baseIntake > 0 ? intake / baseIntake : 0 }

    var calories: Double { baseCalories * ratio }
    var protein:  Double { baseProtein  * ratio }
    var fat:      Double { baseFat      * ratio }
    var carbs:    Double { baseCarbs    * ratio }

    // The user changed the name or portion from the AI's suggestion → this entry
    // is a correction, worth weighting higher as a future RAG anchor.
    var isEdited: Bool {
        name.trimmingCharacters(in: .whitespaces) != baseName.trimmingCharacters(in: .whitespaces)
            || intake != baseIntake
    }

    var isValid: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty && intake > 0
    }
}
