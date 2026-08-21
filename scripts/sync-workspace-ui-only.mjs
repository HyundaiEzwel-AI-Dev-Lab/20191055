#!/usr/bin/env node
/** Sync template+style from h-pms; keep HPMS script (mock). */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const HPMS_ROOT = path.resolve(__dirname, '..')

function findHpmsFrontend() {
  const desktop = path.join(process.env.HOME || '', 'Desktop')
  for (const name of fs.readdirSync(desktop)) {
    const candidate = path.join(desktop, name, 'h-pms', 'frontend')
    if (fs.existsSync(path.join(candidate, 'src', 'pages', 'workspace'))) return candidate
  }
  throw new Error('h-pms frontend not found')
}

const H_PMS = findHpmsFrontend()
const H_WS = path.join(H_PMS, 'src', 'pages', 'workspace')
const HPMS_WS = path.join(HPMS_ROOT, 'src/pages/workspace')

const PAGE_MAP = {
  'dashboard/ProjectDashboardPage.vue': 'dashboard/ProjectDashboardView.vue',
  'info/ProjectInfoPage.vue': 'info/ProjectInfoView.vue',
  'info/ProjectHistoryPage.vue': 'info/ProjectHistoryView.vue',
  'requirement/RequirementPage.vue': 'requirement/RequirementView.vue',
  'wbs/WbsPage.vue': 'wbs/WbsView.vue',
  'unit-test/UnitTestPage.vue': 'unit-test/UnitTestView.vue',
  'unit-test/UnitTestProgressPage.vue': 'unit-test/UnitTestProgressView.vue',
  'test/scenario/ScenarioPage.vue': 'test/scenario/ScenarioView.vue',
  'test/scenario/ScenarioEditPage.vue': 'test/scenario/ScenarioEditView.vue',
  'test/perform/TestRunPage.vue': 'test/perform/TestRunView.vue',
  'test/progress/ProgressPage.vue': 'test/progress/ProgressView.vue',
  'test/defects/DefectPage.vue': 'test/defects/DefectView.vue',
}

const MODAL_SYNC = [
  'requirement/RequirementChangeReasonModal.vue',
  'requirement/RequirementIssueModal.vue',
  'requirement/RequirementIssuePanel.vue',
  'requirement/RequirementScreenSearchModal.vue',
  'wbs/ScheduleReasonInputModal.vue',
  'wbs/WbsBulkScheduleModal.vue',
  'wbs/WbsCalendar.vue',
  'wbs/WbsPlanChangeRequestDetailModal.vue',
  'wbs/WbsRestartModal.vue',
  'wbs/WbsScheduleModal.vue',
  'wbs/WbsScheduleReasonModal.vue',
  'unit-test/UnitTestDetailModal.vue',
  'test/defects/ErrorDetailModal.vue',
  'test/perform/TestRunInfoModal.vue',
  'test/perform/TestRunTesterChangeModal.vue',
  'test/scenario/ScenarioCopyFromLibraryModal.vue',
  'test/scenario/ScenarioLoadFromWbsModal.vue',
  'test/scenario/ScenarioRequirementSearchModal.vue',
  'test/scenario/ScenarioScreenSearchModal.vue',
  'test/scenario/ScenarioWbsTargetModal.vue',
  'test/scenario/TestNoteModal.vue',
  'info/ProjectHistoryDetailModal.vue',
]

const RENAMES = [
  ['HpModal', 'BaseModal'],
  ['HpTooltip', 'BaseTooltip'],
  ['HpSearchFilterBar', 'SearchFilterBar'],
  ['HpFilterSelectPill', 'FilterSelectPill'],
  ['HpFilterTextPill', 'FilterTextPill'],
  ['HpFilterDateRange', 'FilterDateRange'],
  ['HpLoadingOverlay', 'LoadingOverlay'],
  [':show=', ':visible='],
  ['@/shared/ui/HpModal.vue', '@/shared/ui/BaseModal.vue'],
  ['@/shared/ui/HpTooltip.vue', '@/shared/ui/BaseTooltip.vue'],
  ['@/shared/ui/HpSearchFilterBar.vue', '@/shared/ui/SearchFilterBar.vue'],
  ['@/shared/ui/HpFilterSelectPill.vue', '@/shared/ui/FilterSelectPill.vue'],
  ['@/shared/ui/HpFilterTextPill.vue', '@/shared/ui/FilterTextPill.vue'],
  ['@/shared/ui/HpFilterDateRange.vue', '@/shared/ui/FilterDateRange.vue'],
  ['@/shared/ui/HpLoadingOverlay.vue', '@/shared/ui/LoadingOverlay.vue'],
]

function renameUi(block) {
  let out = block
  for (const [from, to] of RENAMES) out = out.replaceAll(from, to)
  out = out.replace(/\(\$event\.target as HTMLInputElement\)\.checked/g, '$event.target.checked')
  out = out.replace(/\(\$event\.target as HTMLSelectElement\)\.value/g, '$event.target.value')
  out = out.replace(/ as number/g, '')
  out = out.replace(/ as string/g, '')
  out = out.replace(/\(file: File\)/g, '(file)')
  out = out.replace(/\[0\]!\./g, '[0]?.')
  return out
}

function extractBlock(content, tag) {
  if (tag === 'template') {
    const start = content.indexOf('<template')
    const end = content.lastIndexOf('</template>')
    if (start === -1 || end === -1 || end <= start) return null
    const openEnd = content.indexOf('>', start)
    return { attrs: content.slice(start + 9, openEnd), inner: content.slice(openEnd + 1, end) }
  }
  const start = content.indexOf(`<${tag}`)
  const end = content.lastIndexOf(`</${tag}>`)
  if (start === -1 || end === -1 || end <= start) return null
  const openEnd = content.indexOf('>', start)
  return {
    attrs: content.slice(start + tag.length + 1, openEnd),
    inner: content.slice(openEnd + 1, end),
  }
}

function mergeVue(hpmsPath, hSourcePath) {
  if (!fs.existsSync(hpmsPath)) {
    console.warn('  skip (no HPMS target):', hpmsPath)
    return false
  }
  const hpms = fs.readFileSync(hpmsPath, 'utf8')
  const hsrc = fs.readFileSync(hSourcePath, 'utf8')
  const hTemplate = extractBlock(hsrc, 'template')
  const hStyle = extractBlock(hsrc, 'style')
  const hpmsScript = extractBlock(hpms, 'script')
  if (!hTemplate || !hpmsScript) {
    console.warn('  skip (missing blocks):', hpmsPath)
    return false
  }
  const scriptAttrs = hpmsScript.attrs.trim().startsWith('setup')
    ? hpmsScript.attrs
    : ` setup${hpmsScript.attrs}`
  let out = `<script${scriptAttrs}>${hpmsScript.inner}</script>\n\n`
  out += `<template>${renameUi(hTemplate.inner)}</template>\n`
  if (hStyle) out += `\n<style${hStyle.attrs}>${renameUi(hStyle.inner)}</style>\n`
  else {
    const hpmsStyle = extractBlock(hpms, 'style')
    if (hpmsStyle) out += `\n<style${hpmsStyle.attrs}>${hpmsStyle.inner}</style>\n`
  }
  fs.writeFileSync(hpmsPath, out)
  return true
}

const jobs = [
  ...Object.entries(PAGE_MAP).map(([src, dest]) => [path.join(H_WS, src), path.join(HPMS_WS, dest)]),
  ...MODAL_SYNC.map((rel) => [path.join(H_WS, rel), path.join(HPMS_WS, rel)]),
]

let n = 0
for (const [src, dest] of jobs) {
  if (!fs.existsSync(src)) {
    console.warn('  missing source:', src)
    continue
  }
  if (mergeVue(dest, src)) {
    n++
    console.log(' ', path.relative(HPMS_WS, dest))
  }
}
console.log(`Merged UI into ${n} files`)
