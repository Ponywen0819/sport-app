import SwiftUI
import PhotosUI

// MARK: - Sheet

struct AddFoodSheet: View {
    private enum Mode {
        case search
        case intake(Food)
        case create
    }

    @Environment(\.dismiss) private var dismiss
    @Environment(FoodRepository.self) private var foodRepo
    @Environment(MealRepository.self) private var mealRepo

    let date: Date
    let mealType: MealType

    @State private var mode: Mode = .search

    var body: some View {
        NavigationStack {
            Group {
                switch mode {
                case .search:
                    SearchView(
                        onSelect: { mode = .intake($0) },
                        onCreate: { mode = .create }
                    )
                case .intake(let food):
                    IntakeView(food: food, date: date, mealType: mealType) {
                        dismiss()
                    }
                case .create:
                    CreateFoodView { newFood in
                        mode = .intake(newFood)
                    }
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    switch mode {
                    case .search:
                        EmptyView()
                    case .intake, .create:
                        Button {
                            mode = .search
                        } label: {
                            Image(systemName: "chevron.left")
                                .foregroundColor(.appTextSub)
                        }
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark")
                            .font(.appBody)
                            .foregroundColor(.appTextSub)
                            .frame(width: 28, height: 28)
                            .background(Color.appBorder)
                            .clipShape(Circle())
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

// MARK: - Search

private struct SearchView: View {
    @Environment(FoodRepository.self) private var foodRepo

    let onSelect: (Food) -> Void
    let onCreate: () -> Void

    @State private var query = ""
    @State private var results: [Food] = []
    @State private var recent: [Food] = []

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                SearchField(placeholder: "搜尋食物名稱…", text: $query)
                    .padding(16)

                if query.isEmpty {
                    if !recent.isEmpty {
                        sectionHeader("最近使用")
                        foodList(recent)
                    }
                } else {
                    if results.isEmpty {
                        emptyResult
                    } else {
                        foodList(results)
                    }
                }

                createButton
                    .padding(16)
            }
        }
        .background(Color.appBackground)
        .scrollContentBackground(.hidden)
        .navigationTitle("新增食物")
        .onAppear { loadRecent() }
        .onChange(of: query) { _, q in performSearch(q) }
    }

    private func sectionHeader(_ title: String) -> some View {
        Text(title)
            .font(.appControlLabel)
            .foregroundColor(.appTextTert)
            .padding(.horizontal, 16)
            .padding(.bottom, 6)
    }

    private func foodList(_ foods: [Food]) -> some View {
        VStack(spacing: 0) {
            ForEach(foods) { food in
                Button { onSelect(food) } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(food.name)
                                .font(.appBody)
                                .foregroundColor(.appText)
                            Text("\(fmt(food.calories)) kcal · P \(fmt(food.protein))g · F \(fmt(food.fat))g · C \(fmt(food.carbs))g  / \(fmt(food.weightBasis))g")
                                .font(.appMicro)
                                .foregroundColor(.appTextTert)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.appCaption)
                            .foregroundColor(.appTextMuted)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)

                Divider()
                    .background(Color.appBorder.opacity(0.5))
                    .padding(.leading, 16)
            }
        }
        .appCard()
        .padding(.horizontal, 16)
        .padding(.bottom, 16)
    }

    private var emptyResult: some View {
        Text("找不到「\(query)」，試試建立新食物")
            .font(.appCaption)
            .foregroundColor(.appTextMuted)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 32)
    }

    private var createButton: some View {
        Button(action: onCreate) {
            HStack(spacing: 8) {
                Image(systemName: "plus.circle.fill")
                Text("建立新食物")
            }
            .font(.appBody)
            .foregroundColor(.appEmerald)
            .frame(maxWidth: .infinity)
            .frame(height: 48)
            .background(Color.appEmerald.opacity(0.1))
            .cornerRadius(12)
        }
    }

    private func loadRecent() {
        recent = (try? foodRepo.recentFoods()) ?? []
    }

    private func performSearch(_ q: String) {
        results = (try? foodRepo.search(query: q)) ?? []
    }

    private func fmt(_ v: Double) -> String {
        v.truncatingRemainder(dividingBy: 1) == 0 ? "\(Int(v))" : String(format: "%.1f", v)
    }
}

// MARK: - Intake

private struct IntakeView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(FoodRepository.self) private var foodRepo
    @Environment(MealRepository.self) private var mealRepo

    let food: Food
    let date: Date
    let mealType: MealType
    let onAdded: () -> Void

    @State private var intakeStr = "100"

    private var intake: Double? {
        let v = Double(intakeStr.trimmingCharacters(in: .whitespaces))
        return (v ?? 0) > 0 ? v : nil
    }

    private var ratio: Double { (intake ?? 0) / food.weightBasis }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Macros reference card
                VStack(alignment: .leading, spacing: 10) {
                    Text("每 \(fmt(food.weightBasis))g 營養素")
                        .font(.appCaption)
                        .foregroundColor(.appTextTert)
                    HStack(spacing: 0) {
                        macroCell(label: "熱量", value: fmt(food.calories), unit: "kcal", color: .appRed)
                        macroCell(label: "蛋白質", value: fmt(food.protein), unit: "g", color: .appBlue)
                        macroCell(label: "脂肪", value: fmt(food.fat), unit: "g", color: .appYellow)
                        macroCell(label: "碳水", value: fmt(food.carbs), unit: "g", color: .appGreen)
                    }
                }
                .padding(16)
                .appCard()

                // Intake input
                VStack(alignment: .leading, spacing: 8) {
                    Text("攝取量 (g)")
                        .font(.appCaption)
                        .foregroundColor(.appTextTert)
                    TextField("0", text: $intakeStr)
                        .keyboardType(.decimalPad)
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(.appText)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity)
                        .frame(height: 64)
                        .appCard()
                }

                // Live preview
                if let i = intake {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("攝取 \(fmt(i))g 的營養素")
                            .font(.appCaption)
                            .foregroundColor(.appTextTert)
                        HStack(spacing: 0) {
                            macroCell(label: "熱量", value: fmt(food.calories * i / food.weightBasis), unit: "kcal", color: .appRed)
                            macroCell(label: "蛋白質", value: fmt(food.protein * i / food.weightBasis), unit: "g", color: .appBlue)
                            macroCell(label: "脂肪", value: fmt(food.fat * i / food.weightBasis), unit: "g", color: .appYellow)
                            macroCell(label: "碳水", value: fmt(food.carbs * i / food.weightBasis), unit: "g", color: .appGreen)
                        }
                    }
                    .padding(16)
                    .appCard()
                }

                Button {
                    guard let i = intake else { return }
                    let scale = i / food.weightBasis
                    let record = MealRecord(
                        date: date,
                        mealType: mealType,
                        foodName: food.name,
                        intake: i,
                        calories: food.calories * scale,
                        protein: food.protein * scale,
                        fat: food.fat * scale,
                        carbs: food.carbs * scale
                    )
                    try? mealRepo.add(record)
                    foodRepo.markUsed(food)
                    onAdded()
                } label: {
                    Text("新增到\(mealType.rawValue)")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(intake != nil ? Color.appBlueCTA : Color.appBorder)
                        .cornerRadius(12)
                }
                .disabled(intake == nil)
            }
            .padding(16)
        }
        .background(Color.appBackground)
        .scrollContentBackground(.hidden)
        .navigationTitle(food.name)
    }

    private func macroCell(label: String, value: String, unit: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(label)
                .font(.appMicro)
                .foregroundColor(.appTextMuted)
            Text(value)
                .font(.appItemTitle)
                .foregroundColor(color)
            Text(unit)
                .font(.appMicro)
                .foregroundColor(.appTextTert)
        }
        .frame(maxWidth: .infinity)
    }

    private func fmt(_ v: Double) -> String {
        v.truncatingRemainder(dividingBy: 1) == 0 ? "\(Int(v))" : String(format: "%.1f", v)
    }
}

// MARK: - Create Food

private struct CreateFoodView: View {
    @Environment(FoodRepository.self) private var foodRepo

    let onCreated: (Food) -> Void

    @State private var name = ""
    @State private var basisStr = "100"
    @State private var caloriesStr = ""
    @State private var proteinStr = ""
    @State private var fatStr = ""
    @State private var carbsStr = ""

    // Scan state
    @State private var pickerItem:    PhotosPickerItem? = nil
    @State private var selectedImage: UIImage?          = nil
    @State private var showCamera:    Bool              = false
    @State private var scanPhase:     PhotoScanPhase    = .idle

    private var canCreate: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
        && Double(caloriesStr) != nil
        && Double(proteinStr) != nil
        && Double(fatStr) != nil
        && Double(carbsStr) != nil
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                PhotoScanCard(
                    image:      $selectedImage,
                    pickerItem: $pickerItem,
                    phase:      scanPhase,
                    doneLabel:  "填入完成",
                    onCamera:     { showCamera = true },
                    onReanalyze:  { Task { await analyze() } }
                )

                VStack(alignment: .leading, spacing: 8) {
                    label("食物名稱", required: true)
                    TextField("例如：雞胸肉", text: $name)
                        .font(.system(size: 15))
                        .foregroundColor(.appText)
                        .padding(.horizontal, 14)
                        .frame(height: 48)
                        .appCard(cornerRadius: 12)
                }

                VStack(alignment: .leading, spacing: 8) {
                    label("基準份量 (g)")
                    TextField("100", text: $basisStr)
                        .keyboardType(.decimalPad)
                        .font(.system(size: 15))
                        .foregroundColor(.appText)
                        .padding(.horizontal, 14)
                        .frame(height: 48)
                        .appCard(cornerRadius: 12)
                }

                let basis = Double(basisStr) ?? 100
                Text("以下為每 \(fmt(basis))g 的營養素")
                    .font(.appCaption)
                    .foregroundColor(.appTextTert)
                    .frame(maxWidth: .infinity, alignment: .leading)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    macroInput("熱量 (kcal)", text: $caloriesStr, required: true)
                    macroInput("蛋白質 (g)", text: $proteinStr, required: true)
                    macroInput("脂肪 (g)", text: $fatStr, required: true)
                    macroInput("碳水化合物 (g)", text: $carbsStr, required: true)
                }

                Button {
                    guard canCreate,
                          let cal = Double(caloriesStr),
                          let pro = Double(proteinStr),
                          let fat = Double(fatStr),
                          let carb = Double(carbsStr),
                          let basis = Double(basisStr), basis > 0
                    else { return }
                    let food = Food(
                        name: name.trimmingCharacters(in: .whitespaces),
                        weightBasis: basis,
                        calories: cal,
                        protein: pro,
                        fat: fat,
                        carbs: carb
                    )
                    try? foodRepo.add(food)
                    onCreated(food)
                } label: {
                    Text("建立食物")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(canCreate ? Color.appEmeraldCTA : Color.appBorder)
                        .cornerRadius(12)
                }
                .disabled(!canCreate)
            }
            .padding(16)
        }
        .background(Color.appBackground)
        .scrollContentBackground(.hidden)
        .navigationTitle("建立食物")
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

    // MARK: - Scan

    @MainActor
    private func analyze() async {
        guard let image = selectedImage else { return }
        guard let service = FoodVisionService.fromStoredSettings() else {
            scanPhase = .error(FoodVisionError.notConfigured.localizedDescription ?? "")
            return
        }

        scanPhase = .analyzing
        do {
            // The create-food form represents one food, so take the first
            // recognized item (the whole-meal flow is where multiple are used).
            guard let food = try await service.recognizeFoods(image).first else {
                scanPhase = .error("沒有辨識到食物，請換一張清楚的照片")
                return
            }
            applyFoodScan(food)
            scanPhase = .done
        } catch {
            scanPhase = .error(error.localizedDescription)
        }
    }

    private func applyFoodScan(_ food: RecognizedFood) {
        let trimmed = food.name.trimmingCharacters(in: .whitespaces)
        if !trimmed.isEmpty { name = trimmed }
        basisStr    = fmt(food.grams)
        caloriesStr = fmt(food.calories)
        proteinStr  = fmt(food.protein)
        fatStr      = fmt(food.fat)
        carbsStr    = fmt(food.carbs)
    }

    private func label(_ text: String, required: Bool = false) -> some View {
        HStack(spacing: 3) {
            Text(text)
                .font(.appCaption)
                .foregroundColor(.appTextTert)
            if required {
                Text("*").font(.appMicro).foregroundColor(.appRed)
            }
        }
    }

    private func macroInput(_ label: String, text: Binding<String>, required: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 3) {
                Text(label)
                    .font(.appMicro)
                    .foregroundColor(.appTextTert)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                if required {
                    Text("*").font(.appMicro).foregroundColor(.appRed)
                }
            }
            TextField("0", text: text)
                .keyboardType(.decimalPad)
                .font(.system(size: 20, weight: .semibold))
                .foregroundColor(.appText)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
                .frame(height: 44)
                .background(Color.appBackground)
                .cornerRadius(10)
        }
        .padding(12)
        .appCard(cornerRadius: 14)
    }

    private func fmt(_ v: Double) -> String {
        v.truncatingRemainder(dividingBy: 1) == 0 ? "\(Int(v))" : String(format: "%.1f", v)
    }
}

// MARK: - Edit Intake Sheet

struct EditIntakeSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(MealRepository.self) private var mealRepo

    let record: MealRecord

    @State private var intakeStr: String

    init(record: MealRecord) {
        self.record = record
        self._intakeStr = State(initialValue: {
            let v = record.intake
            return v.truncatingRemainder(dividingBy: 1) == 0 ? "\(Int(v))" : String(format: "%.1f", v)
        }())
    }

    private var newIntake: Double? {
        let v = Double(intakeStr.trimmingCharacters(in: .whitespaces))
        return (v ?? 0) > 0 ? v : nil
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Text(record.foodName)
                    .font(.appBody)
                    .foregroundColor(.appTextSub)
                    .frame(maxWidth: .infinity, alignment: .leading)

                VStack(alignment: .leading, spacing: 8) {
                    Text("攝取量 (g)")
                        .font(.appCaption)
                        .foregroundColor(.appTextTert)
                    TextField("0", text: $intakeStr)
                        .keyboardType(.decimalPad)
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(.appText)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity)
                        .frame(height: 64)
                        .appCard()
                }

                if let i = newIntake {
                    let ratio = i / record.intake
                    HStack(spacing: 0) {
                        previewCell(label: "熱量", value: record.calories * ratio, unit: "kcal", color: .appRed)
                        previewCell(label: "蛋白質", value: record.protein * ratio, unit: "g", color: .appBlue)
                        previewCell(label: "脂肪", value: record.fat * ratio, unit: "g", color: .appYellow)
                        previewCell(label: "碳水", value: record.carbs * ratio, unit: "g", color: .appGreen)
                    }
                    .padding(12)
                    .appCard(cornerRadius: 12)
                }

                Button {
                    guard let i = newIntake else { return }
                    try? mealRepo.update(record, newIntake: i)
                    dismiss()
                } label: {
                    Text("確認")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(newIntake != nil ? Color.appBlueCTA : Color.appBorder)
                        .cornerRadius(12)
                }
                .disabled(newIntake == nil)

                Spacer()
            }
            .padding(16)
            .background(Color.appBackground)
            .scrollContentBackground(.hidden)
            .navigationTitle("修改分量")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.appCard, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("取消") { dismiss() }.foregroundColor(.appTextSub)
                }
            }
        }
    }

    private func previewCell(label: String, value: Double, unit: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(label).font(.appMicro).foregroundColor(.appTextMuted)
            Text(fmt(value)).font(.appCardLabel).foregroundColor(color)
            Text(unit).font(.appMicro).foregroundColor(.appTextTert)
        }
        .frame(maxWidth: .infinity)
    }

    private func fmt(_ v: Double) -> String {
        v.truncatingRemainder(dividingBy: 1) == 0 ? "\(Int(v))" : String(format: "%.1f", v)
    }
}
