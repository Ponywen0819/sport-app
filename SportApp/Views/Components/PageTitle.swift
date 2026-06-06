import SwiftUI

// The standard screen title row at the top of each tab's main view: a left
// aligned bold title with a trailing spacer. Prominence follows the design doc —
// the home hero uses the larger 主標題, the other tabs use the 副標題 page title.
// Padding is left to the caller since each screen's parent stack pads it
// differently.
struct PageTitle: View {
    let text: String
    var prominent: Bool = false

    init(_ text: String, prominent: Bool = false) {
        self.text = text
        self.prominent = prominent
    }

    var body: some View {
        HStack {
            Text(text)
                .font(prominent ? .appTitle : .appPageTitle)
                .foregroundColor(.appText)
            Spacer()
        }
    }
}
