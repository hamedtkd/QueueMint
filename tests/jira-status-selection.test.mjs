import assert from "node:assert/strict"
import test from "node:test"
import { dragSelection, eligibleStatusMoveKeys, selectBoardIssue } from "../src/features/jira-status/jira-status-selection.ts"

const issues = [
  { key:"SLID-1", status:"To Do", statusId:"1" },
  { key:"SLID-2", status:"To Do", statusId:"1" },
  { key:"SLID-3", status:"Done", statusId:"3" },
  { key:"SLID-4", status:"In Progress", statusId:"2" },
]
const status = {name:"Done",statusIds:["3"]}

test("dragging selected card moves only selected visible cards, not hidden selections", () => {
  assert.deepEqual(dragSelection(issues, new Set(["SLID-1","SLID-2","HIDDEN-9"]), "SLID-1"), ["SLID-1","SLID-2"])
  assert.deepEqual(dragSelection(issues, new Set(["SLID-1","SLID-2"]), "SLID-4"), ["SLID-4"])
})
test("already in target column and duplicate keys excluded", () => {
  assert.deepEqual(eligibleStatusMoveKeys(issues,["SLID-1","SLID-3","SLID-1","SLID-9"],status),["SLID-1"])
})
test("status-name fallback protects no-op transitions without status IDs", () => {
  assert.deepEqual(eligibleStatusMoveKeys(issues,["SLID-1","SLID-3"],{name:"Done",statusIds:[]}),["SLID-1"])
})
test("Ctrl click toggles and Shift click extends a range", () => {
  const order=issues.map(x=>x.key)
  assert.deepEqual([...selectBoardIssue(order,new Set(["SLID-1"]),"SLID-2",null,false)],["SLID-1","SLID-2"])
  assert.deepEqual([...selectBoardIssue(order,new Set(["SLID-1"]),"SLID-3","SLID-1",true)],["SLID-1","SLID-2","SLID-3"])
})
