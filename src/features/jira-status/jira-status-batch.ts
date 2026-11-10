export type JiraTransitionFailure = { key: string; error: string }

// Jira exposes per-issue transitions; process a bounded number of independent calls.
export async function executeStatusTransitions(
  keys: readonly string[],
  transition: (key: string) => Promise<unknown>,
  formatError: (error: unknown) => string,
) {
  const moved: string[] = []
  const failed: JiraTransitionFailure[] = []
  let cursor = 0
  const workers = Math.min(3, keys.length)
  await Promise.all(Array.from({ length: workers }, async () => {
    while (cursor < keys.length) {
      const key = keys[cursor++]
      try { await transition(key); moved.push(key) }
      catch (error) { failed.push({ key, error: formatError(error) }) }
    }
  }))
  return { moved, failed }
}
