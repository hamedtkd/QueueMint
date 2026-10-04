import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(path, import.meta.url), "utf8")

test("popup field shell does not wrap interactive children in a native label", async () => {
  const shell = await read("../src/features/popup/PopupFieldShell.tsx")
  const editor = await read("../src/components/rich-text-editor.tsx")

  assert.doesNotMatch(shell, /<label className=\{cn\("qm-popup-field-shell"/)
  assert.match(shell, /role="group"/)
  assert.match(shell, /synthetic activation to the first labelable descendant/)
  assert.match(editor, /onMouseUp=\{\(\) => \{ rememberSelection\(\); refreshActiveState\(\) \}\}/)
  assert.doesNotMatch(editor, /onMouseUp=.*runCommand/)
})
