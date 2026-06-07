import UIKit

extension UIImage {
    // Returns JPEG data at the highest quality whose byte size fits under
    // `maxBytes`, stepping quality down until it does. Used to keep base64 image
    // payloads to the LLM small enough for vision requests.
    func compressedJPEG(maxBytes: Int) -> Data? {
        var quality: CGFloat = 0.85
        while quality >= 0.1 {
            if let data = jpegData(compressionQuality: quality), data.count <= maxBytes {
                return data
            }
            quality -= 0.15
        }
        return jpegData(compressionQuality: 0.1)
    }
}
