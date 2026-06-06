import SwiftUI

// Circular icon button shared by the block-row actions (add set / delete) and
// the day section's add-block button. Defaults match the inline row action;
// the larger primary add-block button overrides fill / diameter / icon.
struct AppIconButton: View {
    let systemName: String
    var fill: Color = Color.appBackground.opacity(0.45)
    var diameter: CGFloat = 36
    var iconSize: CGFloat = 15
    var iconColor: Color = .appTextTert
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                Circle()
                    .fill(fill)
                    .frame(width: diameter, height: diameter)
                Image(systemName: systemName)
                    .font(.system(size: iconSize))
                    .foregroundColor(iconColor)
            }
        }
    }
}
