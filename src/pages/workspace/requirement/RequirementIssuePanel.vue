<script setup>
// 요구사항 상세(REQ-06) 안의 이슈관리 영역 — 목록 이슈 숫자 클릭 모달과 동일 UI.
// 이슈 초안·목록은 요건 폼 state와 분리한다. 저장은 이 영역의 등록/수정/답글만 반영한다.
import { computed, ref, watch } from 'vue'
import { searchMentions } from '@/entities/project/mock/projectInfo'
import { notifyMentionsInBody } from '@/app/layouts/headerPopups'
import { useProjectStore } from '@/app/stores/project'

const CURRENT_USER_NAME = '김현대'
const CURRENT_USER_DEPT = '웹기획팀'

// h-pms attachmentPolicy와 같은 제약값 — 서버 검증은 없으므로 화면 안내·클라이언트 판정 용도.
const ATTACH_MAX_SIZE = 10 * 1024 * 1024
const ATTACH_ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
const ATTACH_ACCEPT = '.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.ppt,.pptx'
const ATTACH_HINT = 'jpg, png, word, excel, ppt 형식만 첨부할 수 있고 파일당 최대 10MB입니다.'

const props = defineProps({
  requirement: { type: Object, default: null },
})

const emit = defineEmits(['count-change', 'issue-added'])

const projectStore = useProjectStore()

const issues = computed(() => props.requirement?.issues || [])
const totalCount = computed(() => issues.value.length)

const showIssueForm = ref(false)
const issueDraft = ref('')
const editingIssueId = ref(null)
const issueMentionUsers = ref([])

const replyTargetId = ref(null)
const replyDraft = ref('')
const replyMentionUsers = ref([])

const mentionTarget = ref(null)
const mentionQuery = ref('')
const mentionResults = computed(() => (mentionTarget.value ? searchMentions(mentionQuery.value) : []))

watch(
  () => props.requirement?.id,
  () => {
    cancelIssueForm()
    cancelReply()
    syncCount()
  },
  { immediate: true },
)

function syncCount() {
  const count = issues.value.length
  if (props.requirement) props.requirement.issueCount = count
  emit('count-change', count)
}

function extractMentionQuery(text, cursorPos) {
  const upToCursor = text.slice(0, cursorPos)
  const match = upToCursor.match(/@([^\s@]*)$/)
  return match ? match[1] : null
}

function onIssueDraftInput(e) {
  const query = extractMentionQuery(issueDraft.value, e.target.selectionStart)
  mentionTarget.value = query !== null ? 'issue' : null
  mentionQuery.value = query || ''
}

function onReplyDraftInput(e) {
  const query = extractMentionQuery(replyDraft.value, e.target.selectionStart)
  mentionTarget.value = query !== null ? 'reply' : null
  mentionQuery.value = query || ''
}

function closeMentionList() {
  mentionTarget.value = null
}

function selectMention(user) {
  const draftRef = mentionTarget.value === 'reply' ? replyDraft : issueDraft
  const mentionUsers = mentionTarget.value === 'reply' ? replyMentionUsers : issueMentionUsers
  draftRef.value = draftRef.value.replace(/@([^\s@]*)$/, `@${user.name} `)
  // 같은 사람을 여러 번 골라도 한 번만 태그한다 — 본문 `@이름`은 최종 저장 시 다시 걸러낸다.
  if (!mentionUsers.value.some((m) => m.name === user.name)) {
    mentionUsers.value.push({ name: user.name, dept: user.dept })
  }
  mentionTarget.value = null
}

/** 저장 직전 최종 멘션 — 자동완성으로 고른 사람 중 본문에 `@이름`이 남아있는 사람만 남긴다. */
function finalMentionUsers(content, candidates) {
  return candidates.filter((user) => content.includes(`@${user.name}`))
}

function isAuthor(issue) {
  return issue.author === CURRENT_USER_NAME
}

function formatTime(issue) {
  if (!issue?.createdAt) return ''
  if (issue.editedAt) return `${issue.createdAt} (${issue.editedAt})`
  return issue.createdAt
}

function nowStamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

function issueMentions(issue) {
  if (issue.mentions?.length) return issue.mentions
  return issue.mention ? [issue.mention] : []
}

/** 본문 `@이름`을 mentions[]에 있는 이름일 때만 chip 조각으로 나눈다. */
function bodyParts(content, mentions) {
  if (!content) return []
  const names = [...new Set((mentions || []).map((m) => m.name).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  )
  if (!names.length) return [{ kind: 'text', text: content }]

  const parts = []
  let buf = ''
  const flush = () => {
    if (buf) parts.push({ kind: 'text', text: buf })
    buf = ''
  }
  let i = 0
  while (i < content.length) {
    if (content[i] === '@') {
      const hit = names.find((name) => content.startsWith(`@${name}`, i))
      const after = hit ? content[i + hit.length + 1] : undefined
      // `@개발자님`처럼 이름 뒤에 글자가 더 이어지면 그 token은 쓰지 않는다.
      if (hit && (after === undefined || !/[\w가-힣]/.test(after))) {
        flush()
        parts.push({ kind: 'mention', text: `@${hit}` })
        i += hit.length + 1
        continue
      }
    }
    buf += content[i]
    i += 1
  }
  flush()
  return parts
}

function notifyMentions(body) {
  notifyMentionsInBody(body, {
    projectName: projectStore.currentProject?.name || props.requirement?.reqId,
    route: '/workspace/requirement',
    scope: 'requirement',
  })
}

// 첨부파일. 실제 서버 업로드는 없으므로 선택한 File을 그대로 들고 있다가 다운로드 시
// object URL로 그 자리에서 저장한다 — 목업 안에서만 유효하고 새로고침하면 사라진다.
function attachmentsOf(item) {
  return item?.attachments || []
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function validateAttachment(file) {
  if (file.size > ATTACH_MAX_SIZE) {
    return `${file.name}: 파일 용량은 최대 10MB까지 첨부할 수 있습니다.`
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (!ATTACH_ALLOWED_EXT.includes(ext)) {
    return `${file.name}: jpg, png, word, excel, ppt 형식만 첨부할 수 있습니다.`
  }
  return null
}

function onAttachUpload(item, event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  const invalid = validateAttachment(file)
  if (invalid) {
    window.alert(invalid)
    return
  }
  if (!item.attachments) item.attachments = []
  item.attachments.push({ id: `att-${Date.now()}`, name: file.name, size: file.size, file })
}

function onAttachDelete(item, attachment) {
  if (!item.attachments) return
  const idx = item.attachments.findIndex((a) => a.id === attachment.id)
  if (idx !== -1) item.attachments.splice(idx, 1)
}

function onAttachDownload(attachment) {
  if (!attachment.file) {
    window.alert('원본 파일을 찾을 수 없습니다.')
    return
  }
  const url = URL.createObjectURL(attachment.file)
  const link = document.createElement('a')
  link.href = url
  link.download = attachment.name
  link.click()
  URL.revokeObjectURL(url)
}

function openIssueForm() {
  editingIssueId.value = null
  issueMentionUsers.value = []
  replyTargetId.value = null
  showIssueForm.value = true
  issueDraft.value = ''
}

/**
 * 이슈든 답글이든 작성자 본인이면 같은 상단 폼으로 수정한다(BR-62, 2026-08-26 확인).
 * 답글에 별도 인라인 수정폼을 두지 않고 상단 폼을 재사용한다 — 대댓글은 지원하지 않는다.
 */
function startEditIssue(item) {
  if (!isAuthor(item)) return
  editingIssueId.value = item.id
  issueMentionUsers.value = issueMentions(item).map((m) => ({ name: m.name, dept: m.dept || m.department }))
  replyTargetId.value = null
  showIssueForm.value = true
  issueDraft.value = item.body
}

function cancelIssueForm() {
  showIssueForm.value = false
  editingIssueId.value = null
  issueDraft.value = ''
  issueMentionUsers.value = []
}

/** editingIssueId가 이슈 자신인지 어느 이슈의 답글인지 몰라도 되도록 목록 전체에서 찾는다. */
function findEditableTarget(id) {
  for (const issue of issues.value) {
    if (issue.id === id) return issue
    const reply = issue.replies?.find((r) => r.id === id)
    if (reply) return reply
  }
  return null
}

function saveIssue() {
  if (!issueDraft.value.trim() || !props.requirement) return
  if (!props.requirement.issues) props.requirement.issues = []
  const body = issueDraft.value.trim()
  const mentions = finalMentionUsers(body, issueMentionUsers.value)
  if (editingIssueId.value) {
    const target = findEditableTarget(editingIssueId.value)
    if (target) {
      target.body = body
      target.editedAt = nowStamp()
      target.mentions = mentions
    }
  } else {
    props.requirement.issues.unshift({
      id: `iss-${Date.now()}`,
      author: CURRENT_USER_NAME,
      dept: CURRENT_USER_DEPT,
      createdAt: nowStamp(),
      body,
      mentions,
      attachments: [],
      replies: [],
    })
    emit('issue-added', { requirement: props.requirement, body })
    notifyMentions(body)
    syncCount()
  }
  cancelIssueForm()
}

function startReplyIssue(issue) {
  editingIssueId.value = null
  showIssueForm.value = false
  replyTargetId.value = issue.id
  replyDraft.value = ''
  replyMentionUsers.value = []
}

function cancelReply() {
  replyTargetId.value = null
  replyDraft.value = ''
  replyMentionUsers.value = []
}

function saveReply(issue) {
  if (!replyDraft.value.trim()) return
  if (!issue.replies) issue.replies = []
  const body = replyDraft.value.trim()
  const mentions = finalMentionUsers(body, replyMentionUsers.value)
  issue.replies.push({
    id: `rep-${Date.now()}`,
    author: CURRENT_USER_NAME,
    dept: CURRENT_USER_DEPT,
    createdAt: nowStamp(),
    body,
    mentions,
    attachments: [],
  })
  notifyMentions(body)
  cancelReply()
}
</script>

<template>
  <div class="req-issue-panel" data-testid="requirement-issue-panel">
    <p class="issue-guide">요구사항 관련 이슈 등록 및 처리 현황 관리</p>
    <ul class="issue-guide__notes">
      <li>정책 협의 단계에서의 협의/변경 이슈는 처리정보 입력 대상이 아닙니다.</li>
      <li>요건 확정 상태 이후 개발 또는 테스트 중 발생한 요건 관련 이슈/협의 사항만 입력하세요.</li>
    </ul>
    <div class="issue-summary">
      총 <b>{{ totalCount }}</b>건
      <button
        v-if="!showIssueForm"
        type="button"
        class="btn btn--primary btn--sm issue-summary__add"
        @click.stop="openIssueForm"
      >
        이슈등록
      </button>
    </div>

    <div v-if="showIssueForm" class="issue-form">
      <div class="mention-wrap">
        <textarea
          v-model="issueDraft"
          class="issue-form__input"
          rows="3"
          maxlength="2000"
          :placeholder="
            editingIssueId
              ? '이슈 내용을 수정하세요'
              : '이슈 내용을 입력하세요. (처리 필요한 이슈일 경우 담당자 태그(@)하여 입력 ex) @권현대'
          "
          @input="onIssueDraftInput"
          @blur="closeMentionList"
        />
        <ul v-if="mentionTarget === 'issue'" class="mention-list">
          <li v-if="!mentionResults.length" class="mention-list__empty">일치하는 사용자가 없습니다.</li>
          <li v-for="user in mentionResults" :key="user.name">
            <button type="button" class="mention-list__item" @mousedown.prevent="selectMention(user)">
              {{ user.name }} / {{ user.dept }}
            </button>
          </li>
        </ul>
      </div>
      <div class="issue-form__actions">
        <button type="button" class="btn btn--ghost btn--sm" @click.stop="cancelIssueForm">취소</button>
        <button
          type="button"
          class="btn btn--primary btn--sm"
          :disabled="!issueDraft.trim()"
          @click.stop="saveIssue"
        >
          {{ editingIssueId ? '수정' : '등록' }}
        </button>
      </div>
    </div>

    <div v-if="!issues.length" class="empty">등록된 이슈/협의가 없습니다.</div>

    <div v-else class="issue-list">
      <article v-for="issue in issues" :key="issue.id" class="issue">
        <header class="issue__head">
          <span class="issue__author">{{ issue.author }} / {{ issue.dept }}</span>
          <span class="issue__time">{{ formatTime(issue) }}</span>
          <span v-for="mention in issueMentions(issue)" :key="mention.name" class="issue__mention">
            @{{ mention.name }} / {{ mention.dept || mention.department }}
          </span>
        </header>

        <p class="issue__body">
          <template v-for="(part, idx) in bodyParts(issue.body, issueMentions(issue))" :key="idx">
            <span v-if="part.kind === 'mention'" class="issue__body-mention">{{ part.text }}</span>
            <template v-else>{{ part.text }}</template>
          </template>
        </p>

        <div class="issue__actions">
          <button v-if="isAuthor(issue)" type="button" class="link-btn" @click.stop="startEditIssue(issue)">
            수정
          </button>
          <button type="button" class="link-btn" @click.stop="startReplyIssue(issue)">답글</button>
        </div>

        <div v-if="attachmentsOf(issue).length || isAuthor(issue)" class="issue__attach">
          <span v-for="a in attachmentsOf(issue)" :key="a.id" class="attach__chip">
            <button type="button" class="attach__name" @click.stop="onAttachDownload(a)">{{ a.name }}</button>
            <span class="attach__size">{{ formatFileSize(a.size) }}</span>
            <button
              v-if="isAuthor(issue)"
              type="button"
              class="attach__x"
              aria-label="첨부파일 삭제"
              @click.stop="onAttachDelete(issue, a)"
            >
              ×
            </button>
          </span>
          <label v-if="isAuthor(issue)" class="attach__add" :title="ATTACH_HINT">
            ＋ 파일 첨부
            <input type="file" class="attach__input" :accept="ATTACH_ACCEPT" @change="onAttachUpload(issue, $event)" />
          </label>
        </div>

        <div v-if="replyTargetId === issue.id" class="issue-form issue-form--reply">
          <div class="mention-wrap">
            <textarea
              v-model="replyDraft"
              class="issue-form__input"
              rows="2"
              maxlength="2000"
              placeholder="답글 내용을 입력하세요. (@이름 으로 태그 가능)"
              @input="onReplyDraftInput"
              @blur="closeMentionList"
            />
            <ul v-if="mentionTarget === 'reply'" class="mention-list">
              <li v-if="!mentionResults.length" class="mention-list__empty">일치하는 사용자가 없습니다.</li>
              <li v-for="user in mentionResults" :key="user.name">
                <button type="button" class="mention-list__item" @mousedown.prevent="selectMention(user)">
                  {{ user.name }} / {{ user.dept }}
                </button>
              </li>
            </ul>
          </div>
          <div class="issue-form__actions">
            <button type="button" class="btn btn--ghost btn--sm" @click.stop="cancelReply">취소</button>
            <button
              type="button"
              class="btn btn--primary btn--sm"
              :disabled="!replyDraft.trim()"
              @click.stop="saveReply(issue)"
            >
              답글 등록
            </button>
          </div>
        </div>

        <div v-if="issue.replies?.length" class="issue__replies">
          <article v-for="reply in issue.replies" :key="reply.id" class="issue issue--reply">
            <header class="issue__head">
              <span class="issue__author">{{ reply.author }} / {{ reply.dept }}</span>
              <span class="issue__time">{{ formatTime(reply) }}</span>
              <span v-for="mention in issueMentions(reply)" :key="mention.name" class="issue__mention">
                @{{ mention.name }} / {{ mention.dept || mention.department }}
              </span>
            </header>
            <p class="issue__body">
              <template v-for="(part, idx) in bodyParts(reply.body, issueMentions(reply))" :key="idx">
                <span v-if="part.kind === 'mention'" class="issue__body-mention">{{ part.text }}</span>
                <template v-else>{{ part.text }}</template>
              </template>
            </p>

            <div v-if="isAuthor(reply)" class="issue__actions">
              <button type="button" class="link-btn" @click.stop="startEditIssue(reply)">수정</button>
            </div>

            <div v-if="attachmentsOf(reply).length || isAuthor(reply)" class="issue__attach">
              <span v-for="a in attachmentsOf(reply)" :key="a.id" class="attach__chip">
                <button type="button" class="attach__name" @click.stop="onAttachDownload(a)">{{ a.name }}</button>
                <span class="attach__size">{{ formatFileSize(a.size) }}</span>
                <button
                  v-if="isAuthor(reply)"
                  type="button"
                  class="attach__x"
                  aria-label="첨부파일 삭제"
                  @click.stop="onAttachDelete(reply, a)"
                >
                  ×
                </button>
              </span>
              <label v-if="isAuthor(reply)" class="attach__add" :title="ATTACH_HINT">
                ＋ 파일 첨부
                <input type="file" class="attach__input" :accept="ATTACH_ACCEPT" @change="onAttachUpload(reply, $event)" />
              </label>
            </div>
          </article>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.issue-guide {
  margin: 0 0 8px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.issue-guide__notes {
  margin: 0 0 12px;
  padding-left: 18px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  line-height: 1.6;
}

.mention-wrap {
  position: relative;
}

.mention-list {
  position: absolute;
  z-index: 5;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
  max-height: 140px;
  overflow-y: auto;
}

.mention-list__item {
  width: 100%;
  padding: 6px 10px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: calc(11px + var(--font-size-offset, 0px));
  cursor: pointer;
  font-family: inherit;
}

.mention-list__item:hover {
  background: var(--teal-50);
  color: var(--teal-600);
}

.mention-list__empty {
  padding: 8px 10px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.issue-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-txt);
}

.issue-summary b {
  color: var(--teal-600);
}

.issue-summary__add {
  margin-left: auto;
}

.issue-form {
  margin-bottom: 12px;
  padding: 10px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md);
  background: var(--lnb-hover);
}

.issue-form--reply {
  margin-top: 10px;
  margin-bottom: 0;
}

.issue-form__input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  line-height: 1.5;
  resize: vertical;
}

.issue-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 8px;
}

.issue__actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.link-btn {
  border: none;
  background: none;
  color: var(--teal-600);
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  padding: 0;
}

.empty {
  text-align: center;
  padding: 32px;
  color: var(--lnb-muted);
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.issue-list {
  max-height: 420px;
  overflow: auto;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md);
  background: var(--lnb-side);
}

.issue {
  padding: 14px 16px;
  border-bottom: 1px solid var(--lnb-line);
}

.issue:last-child {
  border-bottom: none;
}

.issue--reply {
  margin-top: 10px;
  margin-left: 16px;
  padding: 10px 12px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm);
  background: var(--lnb-hover);
  border-bottom: 1px solid var(--lnb-line);
}

.issue__head {
  display: flex;
  gap: 10px;
  margin-bottom: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.issue__author {
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--lnb-logo);
}

.issue__time {
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.issue__mention {
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 600;
  color: var(--teal-600);
}

.issue__body {
  margin: 0;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  line-height: 1.6;
  color: var(--lnb-txt);
  white-space: pre-wrap;
}

/* 본문 내 멘션 — 헤더 chip과 같은 teal로 일반 본문과 구분하는 인라인 태그 */
.issue__body-mention {
  display: inline;
  padding: 0 3px;
  border-radius: 3px;
  font-weight: 600;
  color: var(--teal-600);
  background: var(--teal-50);
}

.issue__replies {
  margin-top: 4px;
}

.issue__attach {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 6px 0 0;
}

.attach__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 6px 0 10px;
  border: 1px solid var(--teal-100, var(--lnb-line));
  background: var(--teal-50, var(--lnb-side));
  border-radius: 20px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--teal-600, var(--lnb-txt));
}

.attach__name {
  border: none;
  background: none;
  padding: 0;
  color: inherit;
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.attach__size {
  opacity: 0.7;
}

.attach__x {
  border: none;
  background: none;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  padding: 0 2px;
}

.attach__x:hover {
  opacity: 1;
}

.attach__add {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border: 1px solid var(--lnb-line);
  border-radius: 20px;
  background: var(--lnb-side);
  font-size: calc(11px + var(--font-size-offset, 0px));
  cursor: pointer;
}

.attach__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
</style>
