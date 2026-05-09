import SwiftUI

extension Color {
    // Stone palette
    static let appBackground   = Color(hex: "1c1917")  // stone-900
    static let appCard         = Color(hex: "292524")  // stone-800
    static let appBorder       = Color(hex: "44403c")  // stone-700
    static let appText         = Color(hex: "f5f5f4")  // stone-100
    static let appTextSub      = Color(hex: "d6d3d1")  // stone-300
    static let appTextTert     = Color(hex: "78716c")  // stone-500
    static let appTextMuted    = Color(hex: "57534e")  // stone-600

    // Accent colors
    static let appBlue         = Color(hex: "60a5fa")  // blue-400
    static let appBlueCTA      = Color(hex: "3b82f6")  // blue-500
    static let appEmerald      = Color(hex: "34d399")  // emerald-400
    static let appEmeraldCTA   = Color(hex: "10b981")  // emerald-500
    static let appOrange       = Color(hex: "fb923c")  // orange-400
    static let appRed          = Color(hex: "f87171")  // red-400
    static let appYellow       = Color(hex: "facc15")  // yellow-400
    static let appGreen        = Color(hex: "4ade80")  // green-400
    static let appPurple       = Color(hex: "c084fc")  // purple-400

    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 255, 255, 255)
        }
        self.init(.sRGB,
                  red: Double(r) / 255,
                  green: Double(g) / 255,
                  blue: Double(b) / 255,
                  opacity: Double(a) / 255)
    }
}
