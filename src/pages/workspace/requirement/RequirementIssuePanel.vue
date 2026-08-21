<script setup>
// 요구사항 상세(REQ-06) 안의 이슈관리 영역 — 목록 이슈 숫자 클릭 모달과 동일 UI.
// 이슈 초안·목록은 요건 폼 state와 분리한다. 저장은 이 영역의 등록/수정/답글만 반영한다.
import { computed, ref, watch } from 'vue'
import { searchMentions } from '@/entities/project/mock/projectInfo'
import { notifyMentionsInBody } from '@/app/layouts/headerPopups'
import { useProjectStore } from '@/app/stores/project'

const CURRENT_USER_NAME = '김현대'
const CURRENT_USER_DEPT = '웹기획팀'

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
const issueMentionUser = ref(null)

const replyTargetId = ref(null)
const replyDraft = ref('')
const replyMentionUser = ref(null)

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
  const mentionUser = mentionTarget.value === 'reply' ? replyMentionUser : issueMentionUser
  draftRef.value = draftRef.value.replace(/@([^\s@]*)$/, `@${user.name} `)
  mentionUser.value = { name: user.name, dept: user.dept }
  mentionTarget.value = null
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

function notifyMentions(body) {
  notifyMentionsInBody(body, {
    projectName: projectStore.currentProject?.name || props.requirement?.reqId,
    route: '/workspace/requirement',
    scope: 'requirement',
  })
}

function openIssueForm() {
  editingIssueId.value = null
  issueMentionUser.value = null
  replyTargetId.value = null
  showIssueForm.value = true
  issueDraft.value = ''
}

function startEditIssue(issue) {
  if (!isAuthor(issue)) return
  editingIssueId.value = issue.id
  issueMentionUser.value = issue.mention ? { ...issue.mention } : null
  replyTargetId.value = null
  showIssueForm.value = true
  issueDraft.value = issue.body
}

function cancelIssueForm() {
  showIssueForm.value = false
  editingIssueId.value = null
  issueDraft.value = ''
  issueMentionUser.value = null
}

function saveIssue() {
  if (!issueDraft.value.trim() || !props.requirement) return
  if (!props.requirement.issues) props.requirement.issues = []
  const body = issueDraft.value.trim()
  if (editingIssueId.value) {
    const issue = props.requirement.issues.find((item) => item.id === editingIssueId.value)
    if (issue) {
      issue.body = body
      issue.editedAt = nowStamp()
      if (issueMentionUser.value) issue.mention = issueMentionUser.value
    }
  } else {
    props.requirement.issues.unshift({
      id: `iss-${Date.now()}`,
      author: CURRENT_USER_NAME,
      dept: CURRENT_USER_DEPT,
      createdAt: nowStamp(),
      body,
      mention: issueMentionUser.value || undefined,
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
  replyMentionUser.value = null
}

function cancelReply() {
  replyTargetId.value = null
  replyDraft.value = ''
  replyMentionUser.value = null
}

function saveReply(issue) {
  if (!replyDraft.value.trim()) return
  if (!issue.replies) issue.replies = []
  const body = replyDraft.value.trim()
  issue.replies.push({
    id: `rep-${Date.now()}`,
    author: CURRENT_USER_NAME,
    dept: CURRENT_USER_DEPT,
    createdAt: nowStamp(),
    body,
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

        <p class="issue__body">{{ issue.body }}</p>

        <div class="issue__actions">
          <button v-if="isAuthor(issue)" type="button" class="link-btn" @click.stop="startEditIssue(issue)">
            수정
          </button>
          <button type="button" class="link-btn" @click.stop="startReplyIssue(issue)">답글</button>
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
            </header>
            <p class="issue__body">{{ reply.body }}</p>
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

.issue__replies {
  margin-top: 4px;
}
</style>
