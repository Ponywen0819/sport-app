import Foundation

// Shared date formatting. DateFormatter construction is expensive and was
// previously re-created per computed-property access (and duplicated across the
// home / workout / nutrition / body-index views); these cached formatters keep
// the "yyyy-MM-dd" day key and the "MM/dd" axis label in one place.
//
// Fixed numeric formats use en_US_POSIX so output is stable and locale-/
// calendar-independent — the right choice for keys and short labels.
enum DateFormat {
    // Traditional-Chinese weekday initials. Monday-first matches the weekly
    // summary cards (which index the week from Monday); Sunday-first matches the
    // calendar grid (which starts each row on Sunday).
    static let weekdayInitialsMondayFirst = ["一", "二", "三", "四", "五", "六", "日"]
    static let weekdayInitialsSundayFirst = ["日", "一", "二", "三", "四", "五", "六"]

    // Calendar-day key for grouping / matching records by day, e.g. "2025-05-31".
    static func dayKey(_ date: Date) -> String { dayKeyFormatter.string(from: date) }

    // Compact month/day label for chart axes and week ranges, e.g. "05/31".
    static func shortDate(_ date: Date) -> String { shortDateFormatter.string(from: date) }

    private static let dayKeyFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private static let shortDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "MM/dd"
        return f
    }()
}
