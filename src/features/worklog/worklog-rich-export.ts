import type { JiraIssueAttachment } from "@/types"

const IMAGE_TYPE = /^image\/(?:png|jpeg|gif|webp)$/i
const IMAGE_FILE = /\.(?:png|jpe?g|gif|webp)$/i
const MAX_IMAGE_BYTES = 1536 * 1024
const MAX_TOTAL_BYTES = 10 * 1024 * 1024
const MAX_IMAGES = 20

type IssueDetails = { description?: string; attachments: JiraIssueAttachment[] }
type BasePackage = { issues: Array<{ issueKey: string }> }
export type ExportProgress = { phase: "details" | "images"; completed: number; total: number }
export type ExportedImage = { id: string; filename: string; mimeType: string; sizeBytes: number; dataUrl: string }
export type SkippedImage = { issueKey: string; filename: string; reason: "size-limit" | "count-limit" | "unavailable" }

type ExportOptions = {
  includeImages: boolean
  loadDetails: (key: string) => Promise<IssueDetails>
  loadImage: (url: string) => Promise<string | null>
  onProgress?: (progress: ExportProgress) => void
}

function imageAttachment(item: JiraIssueAttachment) {
  return IMAGE_TYPE.test(item.mimeType ?? "") || (IMAGE_FILE.test(item.filename) && (!item.mimeType || item.mimeType === "application/octet-stream"))
}

function imageData(dataUrl: string | null) {
  const matched = /^data:(image\/(?:png|jpeg|gif|webp));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(dataUrl ?? "")
  if (!matched) return null
  const bytes = Math.floor(matched[2].length * 3 / 4) - (matched[2].endsWith("==") ? 2 : matched[2].endsWith("=") ? 1 : 0)
  return bytes > 0 ? { mimeType: matched[1], bytes } : null
}

export async function enrichWorklogAiPackage<T extends BasePackage>(base: T, options: ExportOptions) {
  const details: IssueDetails[] = new Array(base.issues.length)
  let next = 0
  let finished = 0
  await Promise.all(Array.from({ length: Math.min(4, base.issues.length) }, async () => {
    while (next < base.issues.length) {
      const index = next++
      const issueKey = base.issues[index].issueKey
      try {
        details[index] = await options.loadDetails(issueKey)
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Unknown Jira error"
        throw new Error("Could not read " + issueKey + " description: " + reason)
      }
      finished++
      options.onProgress?.({ phase: "details", completed: finished, total: base.issues.length })
    }
  }))

  const issues = base.issues.map((issue, index) => ({ ...issue, description: details[index].description ?? "", images: undefined as ExportedImage[] | undefined }))
  const skipped: SkippedImage[] = []
  let included = 0
  let totalBytes = 0

  if (options.includeImages) {
    const candidates = details.flatMap((item, index) => item.attachments.filter(imageAttachment).map((attachment) => ({ index, attachment })))
    for (const [index, candidate] of candidates.entries()) {
      const { attachment } = candidate
      const issueKey = base.issues[candidate.index].issueKey
      const skip = (reason: SkippedImage["reason"]) => skipped.push({ issueKey, filename: attachment.filename, reason })
      if (included >= MAX_IMAGES) skip("count-limit")
      else if ((attachment.size ?? 0) > MAX_IMAGE_BYTES || totalBytes + (attachment.size ?? 0) > MAX_TOTAL_BYTES) skip("size-limit")
      else if (!attachment.content) skip("unavailable")
      else {
        let dataUrl: string | null = null
        try { dataUrl = await options.loadImage(attachment.content) } catch { /* A single inaccessible image must not discard descriptions. */ }
        const data = imageData(dataUrl)
        if (!data) skip("unavailable")
        else if (data.bytes > MAX_IMAGE_BYTES || totalBytes + data.bytes > MAX_TOTAL_BYTES) skip("size-limit")
        else {
          included++
          totalBytes += data.bytes
          const image: ExportedImage = { id: attachment.id, filename: attachment.filename, mimeType: data.mimeType, sizeBytes: data.bytes, dataUrl: dataUrl! }
          issues[candidate.index].images ??= []
          issues[candidate.index].images.push(image)
        }
      }
      options.onProgress?.({ phase: "images", completed: index + 1, total: candidates.length })
    }
  }

  const outputIssues = issues.map((issue) => {
    if (!issue.images) { const { images: _unused, ...withoutImages } = issue; return withoutImages }
    return issue
  })
  return {
    payload: {
      ...base,
      issues: outputIssues,
      ...(options.includeImages ? { imageExport: { requested: true, included, skipped } } : {}),
    },
    skipped,
  }
}
