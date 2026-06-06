import SwiftUI

struct AppCard<Content: View>: View {
    let content: () -> Content

    init(@ViewBuilder content: @escaping () -> Content) {
        self.content = content
    }

    var body: some View {
        content()
            .background(Color.appCard)
            .cornerRadius(16)
    }
}

struct SectionLabel: View {
    let text: String

    var body: some View {
        Text(text.uppercased())
            .font(.appMicro)
            .foregroundColor(.appTextTert)
            .tracking(1)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}
