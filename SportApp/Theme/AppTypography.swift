import SwiftUI

// Semantic text type scale, aligned with docs/swiftui-ui-design.md. Sizes match
// the values already in use so adopting these tokens is visually identical —
// the win is one place to tune the scale instead of scattered `.font(.system(…))`.
//
// These are TEXT roles only. SF Symbol sizing (icon glyphs) stays as inline
// `.font(.system(size:))`, and component-internal fonts (AppPillBadge,
// AppUnitToggle, AppNumberField) keep their own values.
extension Font {
    // Large numeric value in a text field, e.g. the weight / reps inputs.
    static let appInputValue   = Font.system(size: 24, weight: .semibold)
    // Page header, e.g. "運動紀錄".
    static let appPageTitle    = Font.system(size: 20, weight: .bold)
    // Sheet header, e.g. an exercise name or "超級組".
    static let appHeading      = Font.system(size: 18, weight: .semibold)
    // In-card section title, e.g. "今日訓練".
    static let appSectionTitle = Font.system(size: 16, weight: .semibold)
    // List / block item name, e.g. an exercise.
    static let appItemTitle    = Font.system(size: 15, weight: .semibold)
    // Card header label, e.g. "本週訓練".
    static let appCardLabel    = Font.system(size: 14, weight: .semibold)
    // Primary content and numeric row values.
    static let appBody         = Font.system(size: 14, weight: .medium)
    // Segmented-control / chip / tally label.
    static let appControlLabel = Font.system(size: 13, weight: .semibold)
    // Field and row labels.
    static let appLabel        = Font.system(size: 12, weight: .medium)
    // Units, round counts, muted detail.
    static let appCaption      = Font.system(size: 12)
    // Tiny detail, e.g. weekday letters.
    static let appMicro        = Font.system(size: 11, weight: .medium)
}
