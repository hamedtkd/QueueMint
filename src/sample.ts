import type { BulkPayload } from "@/types"

export const EMPTY_PAYLOAD: BulkPayload = {
  project: "",
  defaults: {},
  issues: [],
}

export const EMPTY_JSON = JSON.stringify(EMPTY_PAYLOAD, null, 2)

const LEGACY_SAMPLE_PAYLOAD: BulkPayload = {
  project: "SLID",
  defaults: {
    priority: "Low",
    sprint: null,
    labels: ["phase-2"],
  },
  issues: [
    {
      ref: "phase-2-field-metadata",
      type: "Task",
      summary: "Add editable field metadata",
      description: "Define editable field metadata for Dynamic HTML templates, initially supporting text and asset fields.",
      labels: ["metadata", "ux"],
    },
    {
      ref: "phase-2-preview-mapping",
      type: "Task",
      summary: "Map preview elements to content fields",
      description: "Support data-slider-field mapping between rendered elements and slide content.",
      labels: ["frontend"],
    },
    {
      ref: "phase-2-inline-editing",
      type: "Task",
      summary: "Add inline text editing",
      description: "Allow presentation authors to edit Dynamic HTML text directly from the slide canvas.",
      labels: ["frontend", "ux"],
    },
  ],
}

export const LEGACY_SAMPLE_JSON = JSON.stringify(LEGACY_SAMPLE_PAYLOAD, null, 2)

export const SAMPLE_PAYLOAD: BulkPayload = {
  project: "PROJECT_KEY",
  defaults: {
    priority: "Medium",
    sprint: null,
    estimate: "3h",
    labels: ["example"],
  },
  issues: [
    {
      ref: "feature-foundation",
      type: "Task",
      summary: "Implement feature foundation",
      description: "Create the smallest end-to-end implementation slice for the requested feature.",
      labels: ["implementation"],
    },
    {
      ref: "validation-error-handling",
      type: "Task",
      summary: "Add validation and error handling",
      description: "Cover expected validation, recoverable failures, and clear user feedback.",
      labels: ["quality"],
    },
    {
      ref: "tests-docs",
      type: "Task",
      summary: "Add tests and documentation",
      description: "Add focused regression coverage and concise usage documentation.",
      labels: ["tests", "docs"],
    },
  ],
}

export const SAMPLE_JSON = JSON.stringify(SAMPLE_PAYLOAD, null, 2)

export const AI_PROMPT_TEMPLATE = `Create Jira issues as JSON for QueueMint.

Return ONLY valid JSON. Do not wrap it in markdown fences.

Use this structure:
{
  "project": "PROJECT_KEY",
  "defaults": {
    "priority": "Medium",
    "sprint": null,
    "labels": ["phase-2"]
  },
  "issues": [
    {
      "ref": "unique-local-reference",
      "type": "Task",
      "summary": "Short Jira summary",
      "description": "Clear implementation description",
      "priority": "High",
      "sprint": null,
      "estimate": "2d",
      "worklog": { "minutes": 90, "comment": "Implemented the first working slice" },
      "assignee": "jira-username",
      "labels": ["frontend", "ux"],
      "epic": "PROJECT-123"
    }
  ]
}

Rules:
- project is required.
- issues must be a non-empty array.
- type must be a Jira issue type available in the project, usually Task, Story, Bug, or Epic.
- summary should be concise and actionable.
- priority must use a priority available in the target Jira.
- sprint is either a positive Jira sprint ID, null for Backlog, or omitted to inherit the batch default.
- estimate uses Jira time-tracking syntax such as 30m, 3h, 2d, or 1d 4h; omit it to inherit defaults.estimate.
- worklog is optional. Use it only for work that was actually done: minutes is a positive integer, comment is optional, and started may be an ISO date/time. QueueMint creates the issue first, then adds the worklog after review.
- assignee is the Jira username/key, or omit it for unassigned/default behavior.
- labels is an array of strings.
- epic may be an existing Jira Epic key such as PROJECT-123 or a ref of an Epic created earlier in the same JSON.
- Do not invent customfield IDs unless I explicitly provide them.

My request:
[DESCRIBE THE WORK HERE]
`
