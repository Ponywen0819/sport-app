import SwiftUI
import PhotosUI

struct AddBodyIndexSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(BodyIndexRepository.self) private var repo

    // MARK: - Form State
    @State private var date         = Date()
    @State private var weightStr    = ""
    @State private var bodyFatStr   = ""
    @State private var muscleStr    = ""
    @State private var fatWeightStr = ""
    @State private var visceralStr  = ""
    @State private var bmrStr       = ""
    @State private var heightStr    = ""
    @State private var waterStr     = ""
    @State private var proteinStr   = ""
    @State private var mineralStr   = ""

    // MARK: - Scan State
    @State private var pickerItem:       PhotosPickerItem? = nil
    @State private var selectedImage:    UIImage?          = nil
    @State private var showCamera:       Bool              = false
    @State private var showSourceDialog: Bool              = false
    @State private var scanPhase:        ScanPhase         = .idle

    private enum ScanPhase {
        case idle
        case analyzing
        case done
        case error(String)
    }

    // MARK: - Computed
    private var weight: Double? {
        guard let w = Double(weightStr), w > 0 else { return nil }
        return w
    }
    private var canSave: Bool { weight != nil }

    private func opt(_ s: String) -> Double? {
        let t = s.trimmingCharacters(in: .whitespaces)
        return t.isEmpty ? nil : Double(t)
    }

    // MARK: - Body

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    dateRow
                    scanCard
                    inputGrid
                    saveButton
                }
                .padding(16)
            }
            .background(Color.appBackground)
            .scrollContentBackground(.hidden)
            .navigationTitle("新增量測")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.appCard, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("取消") { dismiss() }.foregroundColor(.appTextSub)
                }
            }
        }
        .confirmationDialog("選擇照片來源", isPresented: $showSourceDialog) {
            Button("拍照") { showCamera = true }
            Button("從相簿選擇") { /* PhotosPicker handles it */ }
            Button("取消", role: .cancel) {}
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

    private var dateRow: some View {
        HStack {
            Text("量測日期")
                .font(.appBody)
                .foregroundColor(.appTextSub)
            Spacer()
            DatePicker("", selection: $date, displayedComponents: .date)
                .labelsHidden()
                .colorScheme(.dark)
        }
        .padding(16)
        .appCard()
    }

    private var scanCard: some View {
        VStack(spacing: 12) {
            // Thumbnail + phase feedback
            if let img = selectedImage {
                HStack(spacing: 12) {
                    Image(uiImage: img)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 64, height: 64)
                        .clipShape(RoundedRectangle(cornerRadius: 10))

                    VStack(alignment: .leading, spacing: 4) {
                        switch scanPhase {
                        case .idle:
                            EmptyView()
                        case .analyzing:
                            Label("AI 分析中...", systemImage: "sparkles")
                                .font(.appBody)
                                .foregroundColor(.appPurple)
                        case .done:
                            Label("填入完成", systemImage: "checkmark.circle.fill")
                                .font(.appBody)
                                .foregroundColor(.appEmerald)
                        case .error(let msg):
                            Label("分析失敗", systemImage: "xmark.circle.fill")
                                .font(.appBody)
                                .foregroundColor(.appRed)
                            Text(msg)
                                .font(.appMicro)
                                .foregroundColor(.appRed.opacity(0.8))
                                .lineLimit(2)
                        }
                    }
                    Spacer()
                }
            }

            // Buttons row
            HStack(spacing: 10) {
                // Camera button
                Button {
                    showCamera = true
                } label: {
                    Label("拍照", systemImage: "camera.fill")
                        .font(.appBody)
                        .foregroundColor(.appTextSub)
                        .frame(maxWidth: .infinity)
                        .frame(height: 40)
                        .background(Color.appBackground)
                        .cornerRadius(10)
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.appBorder, lineWidth: 1))
                }

                // Photo library button
                PhotosPicker(selection: $pickerItem, matching: .images) {
                    Label("從相簿", systemImage: "photo.fill")
                        .font(.appBody)
                        .foregroundColor(.appTextSub)
                        .frame(maxWidth: .infinity)
                        .frame(height: 40)
                        .background(Color.appBackground)
                        .cornerRadius(10)
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.appBorder, lineWidth: 1))
                }

                // Re-analyse button (only after image is selected)
                if selectedImage != nil {
                    Button {
                        Task { await analyze() }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                            .font(.system(size: 15))
                            .foregroundColor(.appPurple)
                            .frame(width: 40, height: 40)
                            .background(Color.appPurple.opacity(0.12))
                            .cornerRadius(10)
                    }
                    .disabled({ if case .analyzing = scanPhase { return true } else { return false } }())
                }
            }
        }
        .padding(16)
        .appCard()
    }

    private var inputGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            inputField("體重 (kg)",      text: $weightStr,    required: true)
            inputField("體脂率 (%)",     text: $bodyFatStr)
            inputField("骨骼肌重 (kg)", text: $muscleStr)
            inputField("體脂重 (kg)",   text: $fatWeightStr)
            inputField("內臟脂肪指數",  text: $visceralStr)
            inputField("基礎代謝 (kcal)", text: $bmrStr)
            inputField("身高 (cm)",     text: $heightStr)
            inputField("體內水分 (kg)", text: $waterStr)
            inputField("蛋白質重 (kg)", text: $proteinStr)
            inputField("礦物質重 (kg)", text: $mineralStr)
        }
    }

    private var saveButton: some View {
        Button { save() } label: {
            Text("儲存")
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(canSave ? Color.appEmeraldCTA : Color.appBorder)
                .cornerRadius(12)
        }
        .disabled(!canSave)
    }

    private func inputField(_ label: String, text: Binding<String>, required: Bool = false) -> some View {
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
            TextField("—", text: text)
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

    // MARK: - Actions

    private func save() {
        guard let w = weight else { return }
        let record = BodyIndex(
            date:                 date,
            weight:               w,
            bodyFatPercentage:    opt(bodyFatStr),
            skeletalMuscleWeight: opt(muscleStr),
            bodyFatWeight:        opt(fatWeightStr),
            visceralFatIndex:     opt(visceralStr),
            basalMetabolicRate:   opt(bmrStr),
            height:               opt(heightStr),
            totalWater:           opt(waterStr),
            proteinWeight:        opt(proteinStr),
            mineralWeight:        opt(mineralStr)
        )
        try? repo.save(record)
        dismiss()
    }

    // Fixed schema for body composition data extraction
    private static let bodyScanSchema = LLMResponseSchema(
        name:   "body_index",
        strict: true,
        schema: [
            "type": "object",
            "additionalProperties": false,
            "required": [
                "weight", "bodyFatPercentage", "skeletalMuscleWeight", "bodyFatWeight",
                "visceralFatIndex", "basalMetabolicRate", "height",
                "totalWater", "proteinWeight", "mineralWeight"
            ],
            "properties": [
                "weight":               ["anyOf": [["type": "number"], ["type": "null"]]],
                "bodyFatPercentage":    ["anyOf": [["type": "number"], ["type": "null"]]],
                "skeletalMuscleWeight": ["anyOf": [["type": "number"], ["type": "null"]]],
                "bodyFatWeight":        ["anyOf": [["type": "number"], ["type": "null"]]],
                "visceralFatIndex":     ["anyOf": [["type": "number"], ["type": "null"]]],
                "basalMetabolicRate":   ["anyOf": [["type": "number"], ["type": "null"]]],
                "height":               ["anyOf": [["type": "number"], ["type": "null"]]],
                "totalWater":           ["anyOf": [["type": "number"], ["type": "null"]]],
                "proteinWeight":        ["anyOf": [["type": "number"], ["type": "null"]]],
                "mineralWeight":        ["anyOf": [["type": "number"], ["type": "null"]]]
            ] as [String: Any]
        ] as [String: Any]
    )

    @MainActor
    private func analyze() async {
        guard let image = selectedImage else { return }
        guard let client = LLMClient.fromStoredSettings() else {
            scanPhase = .error("請先在「LLM API 設定」中填入 API Key、Endpoint 與模型名稱")
            return
        }

        scanPhase = .analyzing

        guard let imageData = compressedJPEG(image, maxBytes: 800_000) else {
            scanPhase = .error("無法壓縮圖片")
            return
        }

        let prompt = "這是一張身體組成量測儀器的螢幕照片。請擷取所有可見的數值並回傳，找不到的欄位設為 null。"

        do {
            let completion = try await client.completeWithImage(
                prompt:    prompt,
                imageData: imageData,
                schema:    Self.bodyScanSchema,
                maxTokens: 256
            )
            let scan = try extractBodyScan(from: completion.content)
            applyBodyScan(scan)
            scanPhase = .done
        } catch {
            scanPhase = .error(error.localizedDescription)
        }
    }

    // MARK: - Image Helpers

    private func compressedJPEG(_ image: UIImage, maxBytes: Int) -> Data? {
        var quality: CGFloat = 0.85
        while quality >= 0.1 {
            if let data = image.jpegData(compressionQuality: quality), data.count <= maxBytes {
                return data
            }
            quality -= 0.15
        }
        return image.jpegData(compressionQuality: 0.1)
    }

    // MARK: - LLM Parsing

    private struct BodyScan: Decodable {
        let weight:               Double?
        let bodyFatPercentage:    Double?
        let skeletalMuscleWeight: Double?
        let bodyFatWeight:        Double?
        let visceralFatIndex:     Double?
        let basalMetabolicRate:   Double?
        let height:               Double?
        let totalWater:           Double?
        let proteinWeight:        Double?
        let mineralWeight:        Double?
    }

    private func extractBodyScan(from text: String) throws -> BodyScan {
        // Pull out the first {...} block in case the model adds surrounding text
        guard let start = text.firstIndex(of: "{"),
              let end   = text.lastIndex(of: "}") else {
            throw LLMError.decodingFailed("回應中找不到 JSON 物件")
        }
        let json = String(text[start...end])
        guard let data = json.data(using: .utf8) else {
            throw LLMError.decodingFailed("JSON 編碼失敗")
        }
        return try JSONDecoder().decode(BodyScan.self, from: data)
    }

    private func applyBodyScan(_ scan: BodyScan) {
        if let v = scan.weight               { weightStr    = fmt(v) }
        if let v = scan.bodyFatPercentage    { bodyFatStr   = fmt(v) }
        if let v = scan.skeletalMuscleWeight { muscleStr    = fmt(v) }
        if let v = scan.bodyFatWeight        { fatWeightStr = fmt(v) }
        if let v = scan.visceralFatIndex     { visceralStr  = fmt(v) }
        if let v = scan.basalMetabolicRate   { bmrStr       = fmt(v) }
        if let v = scan.height               { heightStr    = fmt(v) }
        if let v = scan.totalWater           { waterStr     = fmt(v) }
        if let v = scan.proteinWeight        { proteinStr   = fmt(v) }
        if let v = scan.mineralWeight        { mineralStr   = fmt(v) }
    }

    private func fmt(_ v: Double) -> String {
        v.truncatingRemainder(dividingBy: 1) == 0 ? "\(Int(v))" : String(format: "%.1f", v)
    }
}

// MARK: - Camera Picker

private struct CameraPicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    @Environment(\.dismiss) private var dismiss

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker        = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate   = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: CameraPicker
        init(_ parent: CameraPicker) { self.parent = parent }

        func imagePickerController(
            _ picker: UIImagePickerController,
            didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
        ) {
            parent.image = info[.originalImage] as? UIImage
            parent.dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}
