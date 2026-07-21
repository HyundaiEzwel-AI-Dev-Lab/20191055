<script setup>
// POP-S-REQ-02 이슈관리 (요구사항 관련 이슈 등록 및 처리 현황)
import BaseModal from '@/components/ui/BaseModal.vue'
import { computed, ref, watch } from 'vue'

const CURRENT_USER_NAME = '김현대'
const CURRENT_USER_DEPT = '웹기획팀'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  requirement: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const rootIssues = computed(() => props.requirement?.issues || [])
const totalCount = computed(() => rootIssues.value.length)

const showIssueForm = ref(false)
const issueDraft = ref('')
const editingIssueId = ref(null)
const replyTargetId = ref(null)
const replyDraft = ref('')

const title = computed(() => {
  if (!props.requirement) return '이슈관리'
  return `이슈관리 — ${props.requirement.reqId}`
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    showIssueForm.value = false
    issueDraft.value = ''
    editingIssueId.value = null
    replyTargetId.value = null
    replyDraft.value = ''
  },
)

function close() {
  emit('update:modelValue', false)
}

function formatTime(issue) {
  if (!issue?.createdAt) return ''
  if (issue.editedAt) return `${issue.createdAt} (${issue.editedAt})`
  return issue.createdAt
}

function nowStamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

function openIssueForm() {
  editingIssueId.value = null
  replyTargetId.value = null
  showIssueForm.value = true
  issueDraft.value = ''
}

function startEditIssue(issue) {
  if (issue.author !== CURRENT_USER_NAME) return
  editingIssueId.value = issue.id
  replyTargetId.value = null
  showIssueForm.value = true
  issueDraft.value = issue.body
}

function cancelIssueForm() {
  showIssueForm.value = false
  editingIssueId.value = null
  issueDraft.value = ''
}

function saveIssue() {
  if (!issueDraft.value.trim() || !props.requirement) return
  if (editingIssueId.value) {
    const target = rootIssues.value.find((i) => i.id === editingIssueId.value)
    if (target) {
      target.body = issueDraft.value.trim()
      target.editedAt = nowStamp()
    }
  } else {
    if (!props.requirement.issues) props.requirement.issues = []
    props.requirement.issues.unshift({
      id: `iss-${Date.now()}`,
      author: CURRENT_USER_NAME,
      dept: CURRENT_USER_DEPT,
      createdAt: nowStamp(),
      body: issueDraft.value.trim(),
      replies: [],
    })
  }
  cancelIssueForm()
}

function startReplyIssue(issue) {
  editingIssueId.value = null
  showIssueForm.value = false
  replyTargetId.value = issue.id
  replyDraft.value = ''
}

function cancelReply() {
  replyTargetId.value = null
  replyDraft.value = ''
}

function saveReply(issue) {
  if (!replyDraft.value.trim()) return
  if (!issue.replies) issue.replies = []
  issue.replies.push({
    id: `rep-${Date.now()}`,
    author: CURRENT_USER_NAME,
    dept: CURRENT_USER_DEPT,
    createdAt: nowStamp(),
    body: replyDraft.value.trim(),
  })
  cancelReply()
}
</script>

<template>
  <BaseModal
    :title="title"
    :visible="modelValue && !!requirement"
    wide
    @close="close"
  >
    <template v-if="requirement">
      <p class="issue-guide">요구사항 관련 이슈 등록 및 처리 현황 관리</p>
      <div class="issue-summary">
        총 <b>{{ totalCount }}</b>건
        <button
          v-if="!showIssueForm"
          type="button"
          class="btn btn--primary btn--sm issue-summary__add"
          @click="openIssueForm"
        >
          이슈등록
        </button>
      </div>

      <div v-if="showIssueForm" class="issue-form">
        <textarea
          v-model="issueDraft"
          class="issue-form__input"
          rows="3"
          maxlength="2000"
          :placeholder="editingIssueId ? '이슈 내용을 수정하세요' : '이슈 내용을 입력하세요'"
        />
        <div class="issue-form__actions">
          <button type="button" class="btn btn--ghost btn--sm" @click="cancelIssueForm">취소</button>
          <button
            type="button"
            class="btn btn--primary btn--sm"
            :disabled="!issueDraft.trim()"
            @click="saveIssue"
          >
            {{ editingIssueId ? '수정' : '등록' }}
          </button>
        </div>
      </div>

      <div v-if="!rootIssues.length" class="empty">등록된 이슈/협의가 없습니다.</div>

      <div v-else class="issue-list">
        <article v-for="issue in rootIssues" :key="issue.id" class="issue">
          <header class="issue__head">
            <span class="issue__author">{{ issue.author }} / {{ issue.dept }}</span>
            <span class="issue__time">{{ formatTime(issue) }}</span>
            <span v-if="issue.mention" class="issue__mention">
              @{{ issue.mention.name }} / {{ issue.mention.dept }}
            </span>
          </header>

          <p class="issue__body">{{ issue.body }}</p>

          <div v-if="issue.collaborator || issue.details?.length" class="issue__meta">
            <p v-if="issue.collaborator" class="issue__collab">
              - 협의자 : {{ issue.collaborator }}
            </p>
            <template v-if="issue.details?.length">
              <p class="issue__collab">- 협의내용</p>
              <ol class="issue__details">
                <li v-for="(line, idx) in issue.details" :key="idx">{{ line }}</li>
              </ol>
            </template>
          </div>

          <div class="issue__actions">
            <button
              v-if="issue.author === CURRENT_USER_NAME"
              type="button"
              class="link-btn"
              @click="startEditIssue(issue)"
            >
              수정
            </button>
            <button type="button" class="link-btn" @click="startReplyIssue(issue)">답글</button>
          </div>

          <div v-if="replyTargetId === issue.id" class="issue-form issue-form--reply">
            <textarea
              v-model="replyDraft"
              class="issue-form__input"
              rows="2"
              maxlength="2000"
              placeholder="답글 내용을 입력하세요"
            />
            <div class="issue-form__actions">
              <button type="button" class="btn btn--ghost btn--sm" @click="cancelReply">취소</button>
              <button
                type="button"
                class="btn btn--primary btn--sm"
                :disabled="!replyDraft.trim()"
                @click="saveReply(issue)"
              >
                답글 등록
              </button>
            </div>
          </div>

          <div v-if="issue.replies?.length" class="issue__replies">
            <article
              v-for="reply in issue.replies"
              :key="reply.id"
              class="issue issue--reply"
            >
              <header class="issue__head">
                <span class="issue__author">{{ reply.author }} / {{ reply.dept }}</span>
                <span class="issue__time">{{ reply.createdAt }}</span>
              </header>
              <p class="issue__body">{{ reply.body }}</p>
            </article>
          </div>
        </article>
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn--primary" @click="close">확인</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.issue-guide {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--lnb-muted);
}

.issue-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-size: 12px;
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
  border-radius: var(--radius-md, 8px);
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
  border-radius: var(--radius-sm, 6px);
  font-family: inherit;
  font-size: 12.5px;
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
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  padding: 0;
}

.empty {
  text-align: center;
  padding: 32px;
  color: var(--lnb-muted);
  font-size: 12px;
}

.issue-list {
  max-height: 420px;
  overflow: auto;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md, 8px);
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
  border-radius: var(--radius-sm, 6px);
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
  font-size: 12px;
  font-weight: 700;
  color: var(--lnb-logo);
}

.issue__time {
  font-size: 11px;
  color: var(--lnb-muted);
}

.issue__mention {
  font-size: 11px;
  font-weight: 600;
  color: var(--teal-600);
}

.issue__body {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--lnb-txt);
  white-space: pre-wrap;
}

.issue__meta {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: var(--radius-sm, 6px);
  background: var(--teal-50);
}

.issue__collab {
  margin: 0 0 4px;
  font-size: 12px;
  color: var(--lnb-txt);
}

.issue__details {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--lnb-txt);
}

.issue__replies {
  margin-top: 4px;
}
</style>
