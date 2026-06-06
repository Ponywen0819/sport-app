import SwiftUI

// Circular 32pt nav button used by NavHeader for the back chevron and any
// trailing action. Defaults to the back-button fill; trailing actions pass a
// different fill (e.g. appBorder for an add button).
struct NavHeaderButton: View {
    let icon: String
    var fill: Color = .appCard
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                Circle().fill(fill).frame(width: 32, height: 32)
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.appTextSub)
            }
        }
    }
}

// In-page navigation header for pushed/presented detail screens: a circular
// back button, the page title, and an optional trailing control. Replaces the
// near-identical navHeader each settings/detail screen carried. Padding is left
// to the caller since each screen's parent stack handles it differently.
struct NavHeader<Trailing: View>: View {
    let title: String
    let onBack: () -> Void
    let trailing: Trailing

    init(_ title: String, onBack: @escaping () -> Void, @ViewBuilder trailing: () -> Trailing) {
        self.title = title
        self.onBack = onBack
        self.trailing = trailing()
    }

    var body: some View {
        HStack {
            NavHeaderButton(icon: "chevron.left", action: onBack)
            Text(title)
                .font(.appPageTitle)
                .foregroundColor(.appText)
                .padding(.leading, 4)
            Spacer()
            trailing
        }
    }
}

// Convenience for headers without a trailing control.
extension NavHeader where Trailing == EmptyView {
    init(_ title: String, onBack: @escaping () -> Void) {
        self.init(title, onBack: onBack) { EmptyView() }
    }
}
