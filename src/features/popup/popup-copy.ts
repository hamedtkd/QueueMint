import type { AppLocale } from "@/types"

export type PopupCopy = {
  capture: string
  captureHint: string
  quickIssue: string
  quickIssueHint: string
  workspace: string
  workspaceHint: string
  connected: string
  disconnected: string
  currentPage: string
  captureVisible: string
  captureFull: string
  capturePro: string
  captureAgain: string
  reportBug: string
  savePng: string
  createIssue: string
  createBug: string
  project: string
  issueType: string
  priority: string
  summary: string
  description: string
  includeContext: string
  includeScreenshot: string
  creating: string
  created: string
  openInJira: string
  createAnother: string
  noJira: string
  noJiraHint: string
  openWorkspace: string
  loadingJira: string
  captureFailed: string
  issueFailed: string
  required: string
  pageContext: string
  screenshotReady: string
  back: string
  fullScreenEditor: string
  board: string
  sprint: string
  backlog: string
  assignee: string
  epic: string
  estimate: string
  storyPoints: string
  labels: string
  labelSearch: string; labelEmpty: string; loadingLabels: string; createLabel: string
  component: string
  fixVersion: string
  dueDate: string
  moreFields: string
  jiraDefault: string
  unassigned: string
  noBoard: string
  noSprint: string
  none: string
  smartDraft: string
  smartDraftHint: string
  applySuggestions: string
  smartTemplate: string
  templateAuto: string
  templateFrontend: string
  templateRegression: string
  templateBackend: string
  templatePerformance: string
  preflight: string
  smartApplied: string
  contextFields: string
  planningFields: string
  peopleFields: string
  detailsFields: string
  advancedFields: string
  theme: string
  language: string
  evidence: string
  screenshotCopied: string
  removeEvidence: string
  recordScreen: string
  stopRecording: string
  microphone: string
  noMicrophone: string
  recordFullscreenHint: string
  recordingReady: string
  attachments: string
  attachmentsHint: string
  addAttachment: string
  includeDiagnostics: string
  diagnostics: string
  diagnosticsHint: string
  addEvidence: string
  resetCapture: string
  captureRestored: string
  reconnectSource: string
  emptyEvidence: string
  emptyEvidenceHint: string
}
export const POPUP_COPY: Record<AppLocale, PopupCopy> = {
  en: {
    capture: "Capture & report",
    captureHint: "Screenshot the current page, annotate it, and create a Jira bug.",
    quickIssue: "Quick issue",
    quickIssueHint: "Create a Jira issue without opening the full workspace.",
    workspace: "Full workspace",
    workspaceHint: "Bulk edit, review, import, and manage Jira in the full QueueMint app.",
    connected: "Connected",
    disconnected: "Not connected",
    currentPage: "Current page",
    captureVisible: "Capture visible area",
    captureFull: "Capture full page",
    capturePro: "Open Capture Pro",
    captureAgain: "Retake",
    reportBug: "Report bug",
    savePng: "Save PNG",
    createIssue: "Create issue",
    createBug: "Create bug",
    project: "Project",
    issueType: "Issue type",
    priority: "Priority",
    summary: "Summary",
    description: "Description",
    includeContext: "Include page context",
    includeScreenshot: "Attach screenshot",
    creating: "Creating...",
    created: "Issue created",
    openInJira: "Open in Jira",
    createAnother: "Create another",
    noJira: "Connect Jira first",
    noJiraHint: "QueueMint Capture uses your existing Jira session. Open the workspace and connect a Jira tab once.",
    openWorkspace: "Open workspace",
    loadingJira: "Loading Jira fields...",
    captureFailed: "Screenshot failed",
    issueFailed: "Could not create issue",
    required: "Summary is required.",
    pageContext: "Page context",
    screenshotReady: "Screenshot ready",
    back: "Back",
    fullScreenEditor: "Open full-screen editor",
    board: "Board",
    sprint: "Sprint",
    backlog: "Backlog",
    assignee: "Assignee",
    epic: "Epic link",
    estimate: "Original estimate",
    storyPoints: "Story points",
    labels: "Labels",
    labelSearch: "Search or create a label…", labelEmpty: "No matching labels. Type a label and press Enter to create it.",
    loadingLabels: "Loading Jira labels…", createLabel: "Create label",
    component: "Component",
    fixVersion: "Fix version",
    dueDate: "Due date",
    moreFields: "More Jira fields",
    jiraDefault: "Jira default",
    unassigned: "Unassigned",
    noBoard: "No board",
    noSprint: "No active/future sprint",
    none: "None",
    smartDraft: "Smart draft",
    smartDraftHint: "Build a structured bug draft from this page locally. Nothing is sent to another AI service.",
    applySuggestions: "Apply suggestions",
    smartTemplate: "Template",
    templateAuto: "Auto detect",
    templateFrontend: "UI / frontend",
    templateRegression: "Regression",
    templateBackend: "API / backend",
    templatePerformance: "Performance",
    preflight: "Preflight",
    smartApplied: "Smart suggestions applied",
    contextFields: "Where it belongs",
    planningFields: "Plan and classify",
    peopleFields: "Ownership",
    detailsFields: "Issue details",
    advancedFields: "Additional Jira fields",
    theme: "Theme",
    language: "Language",
    evidence: "Evidence",
    screenshotCopied: "Screenshot copied",
    removeEvidence: "Remove evidence",
    recordScreen: "Record screen",
    stopRecording: "Stop recording",
    microphone: "Microphone on",
    noMicrophone: "Microphone off",
    recordFullscreenHint: "Screen recording runs in the full-screen capture workspace.",
    recordingReady: "Recording added to evidence",
    attachments: "Evidence files",
    attachmentsHint: "Attach screenshots, recordings, logs, documents, or other supporting files to the Jira issue.",
    addAttachment: "Add evidence files",
    includeDiagnostics: "Include page diagnostics",
    diagnostics: "Page diagnostics",
    diagnosticsHint: "Opt in to attach recent runtime errors and failed network entries. QueueMint does not request Chrome debugger access.",
    addEvidence: "Add screenshot",
    resetCapture: "Reset capture session",
    captureRestored: "Capture session restored",
    reconnectSource: "The source page changed. Open QueueMint from the toolbar on that page once, then retry.",
    emptyEvidence: "No screenshot in this capture yet",
    emptyEvidenceHint: "Add a screenshot from the linked source page to continue editing or report the bug.",
  },
  fa: {
    capture: "ثبت و گزارش",
    captureHint: "از صفحه فعلی عکس بگیر، روی آن علامت بزن و باگ Jira بساز.",
    quickIssue: "ساخت سریع تسک",
    quickIssueHint: "بدون باز کردن محیط کامل QueueMint یک تسک Jira بساز.",
    workspace: "محیط کامل",
    workspaceHint: "ویرایش گروهی، مرور، ورود اطلاعات و مدیریت Jira را در محیط کامل انجام بده.",
    connected: "متصل",
    disconnected: "قطع",
    currentPage: "صفحه فعلی",
    captureVisible: "عکس از بخش قابل مشاهده",
    captureFull: "عکس از کل صفحه",
    capturePro: "باز کردن Capture Pro",
    captureAgain: "عکس دوباره",
    reportBug: "ثبت باگ",
    savePng: "ذخیره PNG",
    createIssue: "ساخت تسک",
    createBug: "ساخت باگ",
    project: "پروژه",
    issueType: "نوع تسک",
    priority: "اولویت",
    summary: "عنوان",
    description: "توضیحات",
    includeContext: "اطلاعات صفحه اضافه شود",
    includeScreenshot: "عکس پیوست شود",
    creating: "در حال ساخت...",
    created: "تسک ساخته شد",
    openInJira: "باز کردن در Jira",
    createAnother: "ساخت مورد دیگر",
    noJira: "اول Jira را متصل کن",
    noJiraHint: "QueueMint Capture از نشست فعلی Jira استفاده می‌کند. یک بار محیط کامل را باز کن و تب Jira را متصل کن.",
    openWorkspace: "باز کردن محیط کامل",
    loadingJira: "در حال دریافت فیلدهای Jira...",
    captureFailed: "گرفتن تصویر ناموفق بود",
    issueFailed: "ساخت تسک انجام نشد",
    required: "عنوان تسک الزامی است.",
    pageContext: "اطلاعات صفحه",
    screenshotReady: "تصویر آماده است",
    back: "برگشت",
    fullScreenEditor: "ویرایش در صفحه کامل",
    board: "بورد",
    sprint: "اسپرینت",
    backlog: "بک‌لاگ",
    assignee: "مسئول",
    epic: "اپیک",
    estimate: "زمان تخمینی",
    storyPoints: "استوری پوینت",
    labels: "برچسب‌ها",
    labelSearch: "جستجو یا ساخت برچسب…", labelEmpty: "برچسبی پیدا نشد؛ نام را بنویس و Enter بزن تا ساخته شود.",
    loadingLabels: "در حال دریافت برچسب‌های Jira…", createLabel: "ساخت برچسب",
    component: "کامپوننت",
    fixVersion: "نسخه انتشار",
    dueDate: "تاریخ سررسید",
    moreFields: "فیلدهای بیشتر Jira",
    jiraDefault: "پیش‌فرض Jira",
    unassigned: "بدون مسئول",
    noBoard: "بدون بورد",
    noSprint: "اسپرینت فعال یا آینده‌ای نیست",
    none: "هیچ‌کدام",
    smartDraft: "پیش‌نویس هوشمند",
    smartDraftHint: "بر اساس همین صفحه یک گزارش باگ ساختاریافته می‌سازد. داده به سرویس هوش مصنوعی دیگری فرستاده نمی‌شود.",
    applySuggestions: "اعمال پیشنهادها",
    smartTemplate: "الگو",
    templateAuto: "تشخیص خودکار",
    templateFrontend: "رابط کاربری",
    templateRegression: "بازگشت خطا",
    templateBackend: "ای‌پی‌آی / سرور",
    templatePerformance: "کارایی",
    preflight: "بررسی پیش از ساخت",
    smartApplied: "پیشنهادهای هوشمند اعمال شد",
    contextFields: "محل ثبت",
    planningFields: "برنامه‌ریزی و دسته‌بندی",
    peopleFields: "مسئولیت",
    detailsFields: "جزئیات تسک",
    advancedFields: "فیلدهای تکمیلی Jira",
    theme: "پوسته",
    language: "زبان",
    evidence: "شواهد",
    screenshotCopied: "تصویر کپی شد",
    removeEvidence: "حذف مدرک",
    recordScreen: "ضبط صفحه",
    stopRecording: "توقف ضبط",
    microphone: "میکروفن روشن",
    noMicrophone: "میکروفن خاموش",
    recordFullscreenHint: "ضبط صفحه در محیط تمام‌صفحه Capture اجرا می‌شود.",
    recordingReady: "ویدیو به شواهد اضافه شد",
    attachments: "فایل‌های شواهد",
    attachmentsHint: "تصویر، ویدیو، لاگ، سند یا فایل‌های کمکی را به تسک Jira پیوست کن.",
    addAttachment: "افزودن فایل شواهد",
    includeDiagnostics: "اطلاعات خطاهای صفحه اضافه شود",
    diagnostics: "اطلاعات فنی صفحه",
    diagnosticsHint: "در صورت انتخاب، خطاهای اجرایی اخیر و درخواست‌های شبکه ناموفق اضافه می‌شوند. QueueMint دسترسی Debugger کروم نمی‌خواهد.",
    addEvidence: "افزودن اسکرین‌شات",
    resetCapture: "ریست نشست ثبت باگ",
    captureRestored: "نشست ثبت باگ بازیابی شد",
    reconnectSource: "صفحه مبدا تغییر کرده است. یک بار QueueMint را از نوار مرورگر روی همان صفحه باز کن و دوباره تلاش کن.",
    emptyEvidence: "هنوز تصویری در این نشست نیست",
    emptyEvidenceHint: "از صفحه مبدا یک تصویر جدید اضافه کن تا ویرایش یا ثبت باگ را ادامه بدهی.",
  },
}
