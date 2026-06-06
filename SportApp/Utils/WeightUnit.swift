import Foundation

// User-facing weight unit plus the conversion / formatting helpers shared across
// the workout sheets and rows. Centralizing these keeps the kg↔pounds factor and
// the display formatting in one place instead of re-deriving them in every view.
enum WeightUnit: String, CaseIterable {
    case pounds = "磅"
    case kg = "kg"

    private static let poundsPerKg = 2.20462

    // Parse a user-typed string (interpreted in this unit) into kilograms.
    // Returns nil for non-positive or non-numeric input.
    func parseToKg(_ s: String) -> Double? {
        guard let w = Double(s), w > 0 else { return nil }
        return self == .pounds ? w / Self.poundsPerKg : w
    }

    // Format a stored kg value for display in this unit, rounded to a whole
    // number with the unit suffix (e.g. "100 磅" / "45 kg").
    func format(_ kg: Double) -> String {
        self == .pounds
            ? "\(Int((kg * Self.poundsPerKg).rounded())) 磅"
            : "\(Int(kg)) kg"
    }

    // Format a stored kg value as a text-field pre-fill in this unit: one
    // decimal place, no suffix (e.g. "100.0").
    func fieldValue(_ kg: Double) -> String {
        String(format: "%.1f", self == .pounds ? kg * Self.poundsPerKg : kg)
    }

    // Reinterpret a typed numeric string from this unit into `target`, keeping
    // one decimal place. Non-numeric input passes through unchanged.
    func convert(_ s: String, to target: WeightUnit) -> String {
        guard self != target, let w = Double(s) else { return s }
        return String(format: "%.1f", target == .kg ? w / Self.poundsPerKg : w * Self.poundsPerKg)
    }
}

// Parse a positive integer rep count; nil for non-positive / non-numeric input.
func parseReps(_ s: String) -> Int? {
    guard let r = Int(s), r > 0 else { return nil }
    return r
}
