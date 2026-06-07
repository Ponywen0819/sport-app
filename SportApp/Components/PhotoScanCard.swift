import SwiftUI
import PhotosUI

// Outcome of an LLM vision scan, driving the card's feedback row.
enum PhotoScanPhase: Equatable {
    case idle
    case analyzing
    case done
    case error(String)
}

// Reusable photo-input card: an optional thumbnail with phase feedback, plus a
// 拍照 / 從相簿 / 重新分析 button row. The owner supplies the bindings and the
// analyse trigger; this view only handles presentation and source selection.
struct PhotoScanCard: View {
    @Binding var image: UIImage?
    @Binding var pickerItem: PhotosPickerItem?
    let phase: PhotoScanPhase
    var analyzingLabel: String = "AI 分析中..."
    var doneLabel: String = "辨識完成"
    let onCamera: () -> Void
    let onReanalyze: () -> Void

    var body: some View {
        VStack(spacing: 12) {
            if let img = image {
                HStack(spacing: 12) {
                    Image(uiImage: img)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 64, height: 64)
                        .clipShape(RoundedRectangle(cornerRadius: 10))

                    VStack(alignment: .leading, spacing: 4) {
                        switch phase {
                        case .idle:
                            EmptyView()
                        case .analyzing:
                            Label(analyzingLabel, systemImage: "sparkles")
                                .font(.appBody)
                                .foregroundColor(.appPurple)
                        case .done:
                            Label(doneLabel, systemImage: "checkmark.circle.fill")
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

            HStack(spacing: 10) {
                Button(action: onCamera) {
                    sourceLabel("拍照", systemImage: "camera.fill")
                }

                PhotosPicker(selection: $pickerItem, matching: .images) {
                    sourceLabel("從相簿", systemImage: "photo.fill")
                }

                if image != nil {
                    Button(action: onReanalyze) {
                        Image(systemName: "arrow.clockwise")
                            .font(.system(size: 15))
                            .foregroundColor(.appPurple)
                            .frame(width: 40, height: 40)
                            .background(Color.appPurple.opacity(0.12))
                            .cornerRadius(10)
                    }
                    .disabled(phase == .analyzing)
                }
            }
        }
        .padding(16)
        .appCard()
    }

    private func sourceLabel(_ title: String, systemImage: String) -> some View {
        Label(title, systemImage: systemImage)
            .font(.appBody)
            .foregroundColor(.appTextSub)
            .frame(maxWidth: .infinity)
            .frame(height: 40)
            .background(Color.appBackground)
            .cornerRadius(10)
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.appBorder, lineWidth: 1))
    }
}
