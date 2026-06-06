import SwiftUI

extension View {
    // Standard card surface: appCard fill with rounded corners. Apply any
    // padding before this. The default 16 radius matches the design system's
    // cards; smaller radii (14 / 12) suit inset fields and compact chips.
    func appCard(cornerRadius: CGFloat = 16) -> some View {
        self
            .background(Color.appCard)
            .cornerRadius(cornerRadius)
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
