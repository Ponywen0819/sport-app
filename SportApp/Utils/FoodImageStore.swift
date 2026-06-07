import UIKit

// Persists food photos on disk and resolves them back. Food.imagePath stores a
// RELATIVE path under Documents (the absolute container path changes between app
// installs), so always resolve through here at read time.
enum FoodImageStore {
    private static let subdir = "FoodImages"

    private static var directory: URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return docs.appendingPathComponent(subdir, isDirectory: true)
    }

    // Saves a compressed JPEG and returns the relative path to store on Food.
    static func save(_ image: UIImage, maxBytes: Int = 800_000) -> String? {
        guard let data = image.compressedJPEG(maxBytes: maxBytes) else { return nil }
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let name = "\(UUID().uuidString).jpg"
        do {
            try data.write(to: directory.appendingPathComponent(name))
            return "\(subdir)/\(name)"
        } catch {
            return nil
        }
    }

    static func url(for relativePath: String) -> URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return docs.appendingPathComponent(relativePath)
    }

    static func image(for relativePath: String) -> UIImage? {
        UIImage(contentsOfFile: url(for: relativePath).path)
    }
}
