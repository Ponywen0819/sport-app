import SwiftUI
import UniformTypeIdentifiers

// Owns the per-section drag-to-reorder UI state. Holds the dragged source
// block and a local preview ordering that shifts as the user hovers over
// drop targets, then commits the new order back through the caller's
// onCommit hook when the drop lands. Lives outside the views so the two
// DropDelegate types don't need bindings into a SwiftUI struct.
@Observable
final class BlockReorderCoordinator {
    var draggedBlock: WorkoutBlock? = nil
    var previewBlocks: [WorkoutBlock] = []

    var isReordering: Bool {
        draggedBlock != nil && !previewBlocks.isEmpty
    }

    func begin(dragging block: WorkoutBlock, snapshot: [WorkoutBlock]) {
        draggedBlock  = block
        previewBlocks = snapshot
    }

    func moveOver(_ target: WorkoutBlock) {
        guard let dragged = draggedBlock,
              dragged.id != target.id,
              let from = previewBlocks.firstIndex(where: { $0.id == dragged.id }),
              let to   = previewBlocks.firstIndex(where: { $0.id == target.id }),
              previewBlocks[to].id != dragged.id
        else { return }

        withAnimation(.spring(response: 0.25, dampingFraction: 0.85)) {
            let item = previewBlocks.remove(at: from)
            previewBlocks.insert(item, at: to)
        }
    }

    func commit() -> [WorkoutBlock] {
        let result = previewBlocks
        withAnimation(.spring(response: 0.25, dampingFraction: 0.85)) {
            draggedBlock  = nil
            previewBlocks = []
        }
        return result
    }

    func cancel() {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
            draggedBlock  = nil
            previewBlocks = []
        }
    }
}

// Per-row drop target. dropEntered shifts the preview order so the dragged
// row makes space at this row's position; performDrop hands the final order
// to the caller (which writes orderIndex back to SwiftData).
struct BlockReorderDropDelegate: DropDelegate {
    let target: WorkoutBlock
    let coordinator: BlockReorderCoordinator
    let onCommit: ([WorkoutBlock]) -> Void

    func dropEntered(info: DropInfo) {
        coordinator.moveOver(target)
    }

    func dropUpdated(info: DropInfo) -> DropProposal? {
        DropProposal(operation: .move)
    }

    func performDrop(info: DropInfo) -> Bool {
        onCommit(coordinator.commit())
        return true
    }
}

// Catch-all attached to the container. Fires when the user drops on the
// card's whitespace (between rows, on the header) — resets the preview state
// so the UI snaps back to the on-disk order instead of staying in the
// hovered-but-not-committed arrangement.
struct BlockReorderCancelDropDelegate: DropDelegate {
    let coordinator: BlockReorderCoordinator

    func dropUpdated(info: DropInfo) -> DropProposal? {
        DropProposal(operation: .move)
    }

    func performDrop(info: DropInfo) -> Bool {
        coordinator.cancel()
        return false
    }
}
