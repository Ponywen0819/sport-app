import SwiftUI

// Labeled numeric text field shared by every add sheet's weight / reps / sets
// inputs. One canonical look (leading label, centered large value, translucent
// fill) so the standard, superset, and block sheets stay visually consistent.
struct AppNumberField: View {
    let label: String
    @Binding var text: String
    var isDecimal: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.appLabel)
                .foregroundColor(.appTextTert)
            TextField("0", text: $text)
                .keyboardType(isDecimal ? .decimalPad : .numberPad)
                .font(.appInputValue)
                .foregroundColor(.appText)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .background(Color.appBackground)
                .cornerRadius(12)
        }
    }
}
