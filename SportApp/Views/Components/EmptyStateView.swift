import SwiftUI

// Centered empty-state placeholder: an SF Symbol over a title and an optional
// subtitle. Replaces the hand-rolled empty states in the workout day card and
// the body-index screen. iconSize and verticalPadding are parameters so an
// in-card empty can sit tighter than a full-screen one.
struct EmptyStateView: View {
    let icon: String
    let title: String
    var subtitle: String? = nil
    var iconSize: CGFloat = 48
    var verticalPadding: CGFloat = 48

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: iconSize))
                .foregroundColor(.appTextTert)
            Text(title)
                .font(.appBody)
                .foregroundColor(.appTextTert)
            if let subtitle {
                Text(subtitle)
                    .font(.appCaption)
                    .foregroundColor(.appTextMuted)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, verticalPadding)
    }
}
