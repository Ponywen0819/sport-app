import SwiftUI

// Shared search input: a magnifying-glass icon and a text field on a rounded
// appCard surface with a hairline border. Replaces the near-identical search
// bars the exercise list, food picker, and add-block picker each carried.
// Outer padding is left to the caller.
struct SearchField: View {
    let placeholder: String
    @Binding var text: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 15))
                .foregroundColor(.appTextTert)
            TextField(placeholder, text: $text)
                .font(.system(size: 15))
                .foregroundColor(.appText)
                .autocorrectionDisabled()
        }
        .padding(.horizontal, 14)
        .frame(height: 44)
        .appCard(cornerRadius: 12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.appBorder, lineWidth: 1))
    }
}
