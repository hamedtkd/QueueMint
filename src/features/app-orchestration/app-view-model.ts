import type { CSSProperties } from "react"

import type { CommandPaletteItem } from "@/components/command-palette"
import type { AppCopy } from "@/features/app-shell/app-copy"
import type { AssigneeSuggestion, DuplicateMatch } from "@/lib/intelligence"
import type { BulkIssue, BulkPayload, JiraProject } from "@/types"
import type { buildEpicOptions } from "@/components/jira-controls"
import type { useAppState } from "./useAppState"
import type { useDraftActions } from "./useDraftActions"
import type { useLiveBoardOperations } from "./useLiveBoardOperations"
import type { useWorkspaceAutomation } from "./useWorkspaceAutomation"
import type { useBulkEditFlow } from "./useBulkEditFlow"
import type { useProjectContext } from "./useProjectContext"
import type { useJiraConnection } from "./useJiraConnection"
import type { useBatchValidation } from "./useBatchValidation"
import type { useCreateFlow } from "./useCreateFlow"

export type AppStateModel = ReturnType<typeof useAppState>
export type AppActionGroups = {
  draft: ReturnType<typeof useDraftActions>
  live: ReturnType<typeof useLiveBoardOperations>
  automation: ReturnType<typeof useWorkspaceAutomation>
  bulk: ReturnType<typeof useBulkEditFlow>
  project: ReturnType<typeof useProjectContext>
  connection: ReturnType<typeof useJiraConnection>
  validation: ReturnType<typeof useBatchValidation>
  create: ReturnType<typeof useCreateFlow>
}

export type VisibleIssueEntry = { issue: BulkIssue; index: number }
export type EpicOptions = ReturnType<typeof buildEpicOptions>

export type AppDerivedModel = {
  t: AppCopy
  parsedError?: string
  payload?: BulkPayload
  issues: BulkIssue[]
  issueCount: number
  selectedIssue?: BulkIssue
  selectedProjectKey?: string
  issueTypes: NonNullable<JiraProject["issueTypes"]>
  epicOptions: EpicOptions
  liveEpicOptions: EpicOptions
  allLabelOptions: string[]
  liveAssigneeSuggestions: AssigneeSuggestion[]
  quickAssigneeSuggestions: AssigneeSuggestion[]
  quickDuplicateMatches: DuplicateMatch[]
  visibleIssueEntries: VisibleIssueEntry[]
  successCount: number
  failureCount: number
  sprintFailureCount: number
  attachmentFailureCount: number
  estimateFailureCount: number
  worklogFailureCount: number
  progressValue: number
  contextPlacement: string
  creationCount: number
  creationWorklogCount: number
  creationWorklogMinutes: number
  contextualSamplePayload: BulkPayload
  contextualAiPrompt: string
  appStyle: CSSProperties
  commandItems: CommandPaletteItem[]
}
