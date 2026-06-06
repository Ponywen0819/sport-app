import SwiftUI

// Rounded pill label used for the small inline tags across the workout UI:
// ×N round counts, the superset type badge, per-exercise labels, drop markers,
// and the read-only exercise chips in the add sheet. Defaults match the common
// inline-counter look; callers tweak size / padding / background for larger
// chips or the neutral equipment tag.
struct AppPillBadge: View {
    let text: String
    let color: Color
    var fontSize: CGFloat = 11
    var fontWeight: Font.Weight = .regular
    var horizontalPadding: CGFloat = 6
    var verticalPadding: CGFloat = 2
    var background: Color? = nil  // nil → color.opacity(0.15)

    var body: some View {
        Text(text)
            .font(.system(size: fontSize, weight: fontWeight))
            .foregroundColor(color)
            .padding(.horizontal, horizontalPadding)
            .padding(.vertical, verticalPadding)
            .background(background ?? color.opacity(0.15))
            .cornerRadius(100)
    }
}
