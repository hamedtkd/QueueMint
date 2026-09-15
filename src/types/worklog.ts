import type { JiraUser } from "./jira-core"

export interface JiraWorklog {
  id: string
  issueKey: string
  started: string
  timeSpentSeconds: number
  comment?: string
  author?: JiraUser
}

export interface WorklogDraftEntry {
  issueKey: string
  summary: string
  minutes: number
  comment: string
}

export interface WorklogApplyResult {
  issueKey: string
  ok: boolean
  worklogId?: string
  error?: string
}

export interface WorklogDaySummary {
  totalMinutes: number
  worklogs: JiraWorklog[]
  source?: "jira" | "tempo" | "mixed" | "scope"
}

export interface WorklogSettings {
  dailyTargetMinutes: number
}
