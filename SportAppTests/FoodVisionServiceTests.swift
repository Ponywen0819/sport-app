import Testing
import Foundation
import UIKit
@testable import SportApp

// Integration tests for FoodVisionService — these hit a REAL LLM endpoint, so
// they only run when credentials are supplied via environment variables and are
// otherwise skipped (normal `xcodebuild test` won't touch the network).
//
// The intent is to eyeball that the service returns a sensible, well-formed
// result — NOT to assert exact numbers (vision output is non-deterministic).
// The parsed result is printed to the test log for manual inspection.
//
// Run with, e.g.:
//   LLM_API_KEY=sk-... \
//   LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai \
//   LLM_MODEL=gemini-2.5-flash \
//   xcodebuild -project SportApp.xcodeproj -scheme SportApp \
//     -destination 'platform=iOS Simulator,name=iPhone 17' \
//     test -only-testing:SportAppTests/FoodVisionServiceTests
//
// Optional: point at your own photos instead of the built-in synthetic ones:
//   LLM_TEST_FOOD_IMAGE=/path/to/label.jpg
//   LLM_TEST_MEAL_IMAGE=/path/to/meal.jpg
struct FoodVisionServiceTests {

    // MARK: - Environment

    private enum Env {
        static var apiKey:  String { value("LLM_API_KEY") }
        static var baseURL: String { value("LLM_BASE_URL") }
        static var model:   String { value("LLM_MODEL") }

        static var isConfigured: Bool {
            !apiKey.isEmpty && !baseURL.isEmpty && !model.isEmpty
        }

        // Resolves a key from the real environment first, then falls back to the
        // repo-root .env file (so values can be fixed once without exporting them
        // each run, while CLI env vars still override).
        static func value(_ key: String) -> String {
            if let v = ProcessInfo.processInfo.environment[key]?
                .trimmingCharacters(in: .whitespacesAndNewlines), !v.isEmpty {
                return v
            }
            return dotEnv[key] ?? ""
        }

        // Parsed once. Located via #filePath → repo root (.../sport-app/.env).
        // Simulator test processes can read host files by absolute path.
        private static let dotEnv: [String: String] = {
            let repoRoot = URL(fileURLWithPath: #filePath)   // …/SportAppTests/FoodVisionServiceTests.swift
                .deletingLastPathComponent()                 // …/SportAppTests
                .deletingLastPathComponent()                 // …/ (repo root)
            let url = repoRoot.appendingPathComponent(".env")
            guard let content = try? String(contentsOf: url, encoding: .utf8) else { return [:] }

            var result: [String: String] = [:]
            for rawLine in content.split(whereSeparator: \.isNewline) {
                let line = rawLine.trimmingCharacters(in: .whitespaces)
                guard !line.isEmpty, !line.hasPrefix("#"),
                      let eq = line.firstIndex(of: "=") else { continue }
                let k = line[..<eq].trimmingCharacters(in: .whitespaces)
                var v = line[line.index(after: eq)...].trimmingCharacters(in: .whitespaces)
                if v.count >= 2,
                   (v.hasPrefix("\"") && v.hasSuffix("\"")) || (v.hasPrefix("'") && v.hasSuffix("'")) {
                    v = String(v.dropFirst().dropLast())
                }
                result[k] = v
            }
            return result
        }()
    }

    private func makeService() -> FoodVisionService {
        FoodVisionService(chat: GeminiChatClient(config: GeminiChatConfig(
            apiKey:  Env.apiKey,
            model:   Env.model,
            baseURL: Env.baseURL
        )))
    }

    // MARK: - Tests

    @Test("recognizeFoods：單一食物照片(取第一項)", .enabled(if: Env.isConfigured))
    func recognizeSingleFood() async throws {
        let service = makeService()
        let image   = loadImage("LLM_TEST_FOOD_IMAGE") ?? Self.syntheticLabelImage()

        let foods = try await service.recognizeFoods(image)
        let food  = foods.first

        report("""
        [recognizeFoods/single] 共 \(foods.count) 項，第一項：
          名稱：\(food?.name ?? "nil")
          重量：\(string(food?.grams)) g
          熱量：\(string(food?.calories)) kcal
          蛋白：\(string(food?.protein)) g
          脂肪：\(string(food?.fat)) g
          碳水：\(string(food?.carbs)) g
        """)

        // Loose: confirm the call succeeded and parsed into the domain shape.
        #expect(!foods.isEmpty)
    }

    @Test("recognizeFoods：整餐照片(取全部)", .enabled(if: Env.isConfigured))
    func recognizeMeal() async throws {
        let service = makeService()
        let image   = loadImage("LLM_TEST_MEAL_IMAGE") ?? Self.syntheticMealImage()

        let foods = try await service.recognizeFoods(image)

        var lines = ["[recognizeFoods/meal] 共辨識 \(foods.count) 項："]
        for food in foods {
            lines.append("  - \(food.name)｜\(string(food.grams))g｜\(string(food.calories))kcal "
                + "P\(string(food.protein)) F\(string(food.fat)) C\(string(food.carbs))")
        }
        report(lines.joined(separator: "\n"))

        // Loose: confirm it parsed into the domain shape with usable basics.
        #expect(!foods.isEmpty)
        for food in foods {
            #expect(!food.name.trimmingCharacters(in: .whitespaces).isEmpty)
            #expect(food.grams >= 0)
        }
    }

    // MARK: - Helpers

    // Prints to the test log AND appends to a host file, because print() from
    // Swift Testing doesn't reliably surface through xcodebuild's stdout. Path
    // overridable via FOODVISION_REPORT (defaults to /tmp).
    private func report(_ text: String) {
        print(text)
        let path = Env.value("FOODVISION_REPORT").isEmpty ? "/tmp/foodvision_result.txt" : Env.value("FOODVISION_REPORT")
        let url  = URL(fileURLWithPath: path)
        let line = text + "\n"
        if let handle = try? FileHandle(forWritingTo: url) {
            handle.seekToEndOfFile()
            handle.write(Data(line.utf8))
            try? handle.close()
        } else {
            try? line.write(to: url, atomically: true, encoding: .utf8)
        }
    }

    private func loadImage(_ envKey: String) -> UIImage? {
        let path = Env.value(envKey)
        guard !path.isEmpty else { return nil }
        return UIImage(contentsOfFile: path)
    }

    private func string(_ v: Double?) -> String {
        guard let v else { return "nil" }
        return v.truncatingRemainder(dividingBy: 1) == 0 ? "\(Int(v))" : String(format: "%.1f", v)
    }

    // A drawn nutrition-label image so the food test is runnable without any
    // external asset (vision models read this text reliably).
    private static func syntheticLabelImage() -> UIImage {
        textImage([
            "雞胸肉 營養標示",
            "每份 100 公克",
            "熱量 165 大卡",
            "蛋白質 31 公克",
            "脂肪 3.6 公克",
            "碳水化合物 0 公克"
        ])
    }

    private static func syntheticMealImage() -> UIImage {
        textImage([
            "今日便當內容：",
            "白飯 一碗",
            "炸雞排 一塊",
            "燙青菜 一份"
        ])
    }

    private static func textImage(_ lines: [String]) -> UIImage {
        let size     = CGSize(width: 640, height: 420)
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { ctx in
            UIColor.white.setFill()
            ctx.fill(CGRect(origin: .zero, size: size))
            let attrs: [NSAttributedString.Key: Any] = [
                .font:            UIFont.boldSystemFont(ofSize: 32),
                .foregroundColor: UIColor.black
            ]
            for (i, line) in lines.enumerated() {
                line.draw(at: CGPoint(x: 24, y: CGFloat(24 + i * 56)), withAttributes: attrs)
            }
        }
    }
}
