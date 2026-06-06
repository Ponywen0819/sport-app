import SwiftUI

// Segmented 磅 / kg selector shared by the workout day header and every add
// sheet. The caller owns the selected value and reacts to onSelect — display
// toggles just assign it, input toggles also convert the typed fields.
struct AppUnitToggle: View {
    let selected: WeightUnit
    let onSelect: (WeightUnit) -> Void

    var body: some View {
        HStack(spacing: 0) {
            ForEach(WeightUnit.allCases, id: \.self) { unit in
                Button { onSelect(unit) } label: {
                    Text(unit.rawValue)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(selected == unit ? .appText : .appTextTert)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(selected == unit ? Color.appBorder : Color.clear)
                }
            }
        }
        .background(Color.appBorder.opacity(0.6))
        .cornerRadius(10)
    }
}
