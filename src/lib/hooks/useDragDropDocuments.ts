import type { Document } from '@/types/dms'
import { fetchData } from '@/lib/api/crud'
import toast from 'react-hot-toast'

/**
 * Hook to handle document drag-drop reordering within departments
 * 
 * Features:
 * - Only allows reordering within same department
 * - Optimistic UI updates
 * - API persistence with error rollback
 */
export async function handleDocumentReorder(
  sourceDoc: Document,
  destinationDoc: Document,
  allDocuments: Document[],
  onReorder: (docs: Document[]) => void,
  onError: () => void
) {
  // Check if both documents are in the same department
  if (sourceDoc.department_id !== destinationDoc.department_id) {
    toast.error('Can only reorder documents within the same department')
    return
  }

  // Check if it's the same document (no-op)
  if (sourceDoc.id === destinationDoc.id) {
    return
  }

  try {
    // Get documents in the same department
    const deptDocs = allDocuments.filter(d => d.department_id === sourceDoc.department_id)
    const sourceIdx = deptDocs.findIndex(d => d.id === sourceDoc.id)
    const destIdx = deptDocs.findIndex(d => d.id === destinationDoc.id)

    if (sourceIdx === -1 || destIdx === -1) {
      toast.error('Invalid document selection')
      return
    }

    // Create optimistic update: move source item to destination position
    const reordered = [...deptDocs]
    const [moved] = reordered.splice(sourceIdx, 1)
    reordered.splice(destIdx, 0, moved)

    // Update sort_order for affected documents
    const updates = reordered.map((doc, idx) => ({
      ...doc,
      sort_order: idx,
    }))

    // Apply optimistic update
    onReorder(updates)

    // Persist to backend
    try {
      await Promise.all(
        updates.map(doc =>
          fetchData('DOCUMENT_UPDATE', 'PATCH', { id: doc.id }, { sort_order: doc.sort_order })
        )
      )
      toast.success('Document reordered')
    } catch (err) {
      // Revert on API error
      onError()
      toast.error('Failed to save reorder. Changes reverted.')
    }
  } catch (err) {
    toast.error('Error reordering documents')
    onError()
  }
}

/**
 * Get sort_order for a document
 * If not set, calculate based on position in department
 */
export function getSortOrder(doc: Document, allDocs: Document[]): number {
  if (doc.sort_order !== undefined && doc.sort_order !== null) {
    return doc.sort_order
  }
  // Fallback: use creation date
  const deptDocs = allDocs
    .filter(d => d.department_id === doc.department_id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  return deptDocs.findIndex(d => d.id === doc.id)
}
