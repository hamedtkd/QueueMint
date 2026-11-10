import { JiraStatusMoveDialog } from "@/features/jira-status/JiraStatusMoveDialog"
import { useJiraStatusMove } from "@/features/jira-status/useJiraStatusMove"
import { useWorklogBoardColumns } from "@/features/worklog/useWorklogBoardColumns"
import type { ManageJiraScreenProps } from "./manage-types"
import { useManageJiraModel } from "./useManageJiraModel"
import { ManageJiraView } from "./ManageJiraView"

export function ManageJiraScreen(props: ManageJiraScreenProps) {
  const model = useManageJiraModel(props)
  const columns = useWorklogBoardColumns(props.selectedBoardId, props.issues)
  const statusMove = useJiraStatusMove(props.locale, props.issues, props.onTransitionStatuses)
  return (
    <>
      <ManageJiraView {...props} {...model} statusColumns={columns.columns} onRequestStatusMove={statusMove.request} />
      <JiraStatusMoveDialog locale={props.locale} state={statusMove} />
    </>
  )
}
