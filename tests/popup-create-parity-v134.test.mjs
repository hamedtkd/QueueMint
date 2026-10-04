import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(path, import.meta.url), "utf8")

test("popup Labels matches the main create flow with Jira-backed options and search", async () => {
  const [form, extra, view, popup] = await Promise.all([
    read("../src/features/popup/use-popup-jira-form.ts"),
    read("../src/features/popup/PopupIssueExtraFields.tsx"),
    read("../src/features/popup/PopupIssueView.tsx"),
    read("../src/Popup.tsx"),
  ])

  assert.match(form, /getProjectLabels\(nextProject\)/)
  assert.match(form, /projectLabels/)
  assert.match(extra, /LabelsCombobox/)
  assert.match(extra, /projectKey=\{projectKey\}/)
  assert.match(extra, /options=\{labelOptions\}/)
  assert.match(extra, /onValueChange=\{\(nextLabels\) => props\.onLabels\(nextLabels\.join\(", "\)\)\}/)
  assert.doesNotMatch(extra, /placeholder="frontend, regression"/)
  assert.match(view, /labels: availableLabels/)
  assert.match(popup, /labelOptions=\{form\.projectLabels\}/)
})

test("rich text toolbar preserves the editor selection before applying formatting", async () => {
  const editor = await read("../src/components/rich-text-editor.tsx")

  assert.match(editor, /const savedRange = useRef<Range \| null>\(null\)/)
  assert.match(editor, /function rangeInsideEditor/)
  assert.match(editor, /const restoreSelection = useCallback/)
  assert.match(editor, /onMouseDown=\{\(event\) => \{ rememberSelection\(\); event\.preventDefault\(\) \}\}/)
  assert.match(editor, /if \(!restoreSelection\(\)\) return/)
  assert.doesNotMatch(editor, /queryCommandState/)
})
