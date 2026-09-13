const COMMAND_PALETTE_COMMANDS = new Set(["open-command-palette", "open-command-palette-fallback"])

async function revealCommandPalette() {
  try {
    await chrome.runtime.openOptionsPage()
  } catch {
    // The workspace may already be open in an extension tab.
  }
  const notify = () => chrome.runtime.sendMessage({ type: "QUEUEMINT_OPEN_COMMAND_PALETTE" }).catch(() => undefined)
  await notify()
  setTimeout(notify, 180)
  setTimeout(notify, 500)
}

chrome.commands?.onCommand.addListener((command) => {
  if (!COMMAND_PALETTE_COMMANDS.has(command)) return
  void revealCommandPalette()
})
