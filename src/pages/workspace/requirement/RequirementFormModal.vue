<script setup>
// PAG-S-REQ-04/06 요구사항 등록·상세
// v1.0: 상세 수정 가능: 접수·수용(확정여부 무관) / 불가: 반려만 (SB p.98~101)
import { computed, reactive, ref, watch } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import BaseTooltip from '@/shared/ui/BaseTooltip.vue'
import RequirementScreenSearchModal from '@/pages/workspace/requirement/RequirementScreenSearchModal.vue'
import RequirementChangeReasonModal from '@/pages/workspace/requirement/RequirementChangeReasonModal.vue'
import RequirementIssuePanel from '@/pages/workspace/requirement/RequirementIssuePanel.vue'
import {
  requirementTypes,
  systemOptions,
  bizCategoryMap,
  emptyScope,
  normalizeScopes,
  changeReasonLabel,
} from '@/entities/requirement/mock/requirement'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'register' },
  data: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'save', 'issue-added', 'count-change'])

const form = reactive({
  reqId: '자동 채번',
  name: '',
  original: '',
  analysis: '',
  reqType: '최초 요건',
  system: 'FO',
  bizCategory: '',
  screenMenu: '',
  screenPath: '',
  screenName: '',
  taskTypes: [],
  status: '접수',
  priority: '보통',
  confirmRequester: false,
  confirmTech: false,
  memo: '',
  attachments: [],
  scopes: [emptyScope({ bizCategory: '법인숙박' })],
})

const isEdit = computed(() => props.mode === 'edit')
const isCopy = computed(() => props.mode === 'copy')
const isRegister = computed(() => props.mode === 'register')

const title = computed(() => {
  if (isCopy.value) return '요구사항 등록 (복사)'
  return isEdit.value ? '요구사항 상세' : '요구사항 등록'
})

/** 반려 상태만 본문 수정 불가 — 확정 후에도 요구사항은 계속 수정 가능 */
const isReadOnly = computed(() => {
  if (!isEdit.value) return false
  return props.data?.status === '반려'
})

/** BR-10 — 요청자·테크 양측 확정(최종확정) 후에는 상태(반려 전이 제외) 등 일반 필드를 잠근다.
 *  확정 자체는 되돌릴 수 없되, 반려만은 최종확정 후에도 가능하다(canSelectStatus 참고). */
const isFinallyConfirmed = computed(() => isEdit.value && !!form.confirmRequester && !!form.confirmTech)

const canEditFields = computed(() => {
  if (isRegister.value || isCopy.value) return true
  return isEdit.value && !isReadOnly.value && !isFinallyConfirmed.value
})

/** 원안: 등록만 입력, 상세/복사는 잠금 (SB 96·98) */
const originalLocked = computed(() => isEdit.value || isCopy.value)

/** 구분: 등록·복사만 변경, 상세는 잠금 */
const reqTypeLocked = computed(() => isEdit.value)

const showSaveButton = computed(() => canEditFields.value)

/** BR-100 — 최종확정 후에도 확정 당시 "화면없음"으로 남겨 둔 업무범주만 화면 선택을 열어 준다.
 *  noScreen 체크박스 자체는 canEditFields로 잠기므로, 여기서 scope.noScreen은 곧 확정 당시 값이다. */
function canFillScreenFor(scope) {
  if (canEditFields.value) return true
  if (!isFinallyConfirmed.value) return false
  return !!scope?.noScreen
}

const memoCount = computed(() => form.memo.length)
const showScreenSearch = ref(false)
const showChangeReasonModal = ref(false)
const confirmTipOpen = ref(false)

const confirmTooltip =
  '요청자와 테크담당 모두 확정 시 WBS 업무가 생성됩니다.\n- 확정 : 최종 개발 요구사항 확인 완료 (확정 후에도 요구사항은 계속 수정 가능하며, 확정 자체는 되돌릴 수 없음)\n- 미확정 : 최종 개발 요구사항 확정 전'

function screenDisplayFor(block) {
  if (block.noScreen) return '화면없음'
  if (block.screenName && block.screenPath) return `${block.screenName} (${block.screenPath})`
  if (block.screenName) return block.screenName
  return block.screenMenu || ''
}

function scopesFromRow(row, { clearScreen = false } = {}) {
  return normalizeScopes(row).map((scope, index) =>
    emptyScope({
      ...scope,
      seq: scope.seq || index + 1,
      screenMenu: clearScreen ? '' : scope.screenName || '',
      screenPath: clearScreen ? '' : scope.screenPath || '',
      screenName: clearScreen ? '' : scope.screenName || '',
      screenCode: clearScreen ? '' : scope.screenCode || '',
      noScreen: clearScreen ? false : !!scope.noScreen,
      taskTypes: [...(scope.taskTypes || [])],
    }),
  )
}

function syncAliasesFromScopes() {
  const primary = form.scopes[0]
  if (!primary) return
  form.system = primary.system
  form.bizCategory = primary.bizCategory
  form.screenPath = primary.noScreen ? '-' : primary.screenPath || ''
  form.screenName = primary.noScreen ? '화면없음' : primary.screenName || ''
  form.screenMenu = primary.noScreen ? '' : primary.screenName || ''
  form.taskTypes = [...new Set(form.scopes.flatMap((scope) => scope.taskTypes || []))]
}

const metaLine = computed(() => {
  if (!isEdit.value || !props.data) return ''
  const reg = `등록 ${props.data.registeredAt || '-'} (${props.data.registeredBy || '-'})`
  const upd = props.data.updatedAt
    ? `최종수정 ${props.data.updatedAt} (${props.data.updatedBy || '-'})`
    : '최종수정 -'
  return `${reg}  |  ${upd}`
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    confirmTipOpen.value = false
    if (isCopy.value && props.data) {
      Object.assign(form, {
        reqId: '자동 채번',
        name: props.data.name,
        original: props.data.original,
        analysis: props.data.analysis || '',
        reqType: '최초 요건',
        system: props.data.system,
        bizCategory: props.data.bizCategory,
        screenMenu: '',
        screenPath: '',
        screenName: '',
        taskTypes: [],
        status: '접수',
        priority: '보통',
        confirmRequester: false,
        confirmTech: false,
        memo: '',
        attachments: [],
        scopes: scopesFromRow(props.data, { clearScreen: true }),
      })
    } else if (props.data && isEdit.value) {
      Object.assign(form, {
        reqId: props.data.reqId,
        name: props.data.name,
        original: props.data.original,
        analysis: props.data.analysis || '',
        reqType: props.data.reqType === '추가' ? '추가 요구사항' : '최초 요건',
        system: props.data.system,
        bizCategory: props.data.bizCategory,
        screenMenu: props.data.screenMenu || props.data.screenName || '',
        screenPath: props.data.screenPath || '',
        screenName: props.data.screenName || props.data.screenMenu || '',
        taskTypes: [...(props.data.taskTypes || [])],
        status: props.data.status,
        priority: props.data.priority,
        confirmRequester: props.data.confirmRequester === '확정',
        confirmTech: props.data.confirmTech === '확정',
        memo: props.data.memo || '',
        attachments: [...(props.data.attachments || [])],
        scopes: scopesFromRow(props.data),
      })
    } else {
      Object.assign(form, {
        reqId: '자동 채번',
        name: '',
        original: '',
        analysis: '',
        reqType: '최초 요건',
        system: 'FO',
        bizCategory: '법인숙박',
        screenMenu: '',
        screenPath: '',
        screenName: '',
        taskTypes: [],
        status: '접수',
        priority: '보통',
        confirmRequester: false,
        confirmTech: false,
        memo: '',
        attachments: [],
        scopes: [emptyScope({ system: 'FO', bizCategory: '법인숙박' })],
      })
    }
  },
)

function close() {
  emit('update:modelValue', false)
}

const screenSearchScopeIndex = ref(0)

const activeScreenSystem = computed(
  () => form.scopes[screenSearchScopeIndex.value]?.system || 'FO',
)

function openScreenSearch(index = 0) {
  const scope = form.scopes[index]
  if (!canFillScreenFor(scope)) return
  screenSearchScopeIndex.value = index
  showScreenSearch.value = true
}

function onScreenSelect(screen) {
  const target = form.scopes[screenSearchScopeIndex.value]
  if (!target) return
  if (screen.system) target.system = screen.system
  target.screenName = screen.name
  target.screenPath = screen.path
  target.screenMenu = screen.name
  target.screenCode = screen.screenCode || ''
  target.noScreen = false
  syncAliasesFromScopes()
}

function bizOptionsFor(system) {
  return bizCategoryMap[system] || []
}

function addScope() {
  if (!canEditFields.value) return
  form.scopes.push(emptyScope({ system: systemOptions[0] || 'FO' }))
}

function removeScope(index) {
  if (form.scopes.length <= 1) {
    window.alert('업무범위는 최소 1개가 필요합니다.')
    return
  }
  form.scopes.splice(index, 1)
  syncAliasesFromScopes()
}

function clearScopeScreen(scope) {
  scope.screenCode = ''
  scope.screenName = ''
  scope.screenPath = ''
  scope.screenMenu = ''
}

function setNoScreen(scope, checked) {
  scope.noScreen = checked
  if (checked) clearScopeScreen(scope)
  syncAliasesFromScopes()
}

function onScopeSystemChange(scope) {
  const opts = bizOptionsFor(scope.system)
  if (!opts.includes(scope.bizCategory)) scope.bizCategory = opts[0] || ''
  if (!scope.noScreen) clearScopeScreen(scope)
  syncAliasesFromScopes()
}

// 첨부 제약 — h-pms shared/lib/attachmentPolicy(BR-44)와 같은 값. 실제 업로드는 없고
// 파일명만 로컬 상태에 담으므로 확장자·용량만 클라이언트에서 그대로 검증한다.
const ATTACH_ACCEPT = '.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.ppt,.pptx'
const ATTACH_HINT = 'jpg, png, word, excel, ppt 형식만 첨부할 수 있고 파일당 최대 10MB입니다.'
const ATTACH_MAX_SIZE = 10 * 1024 * 1024
const ATTACH_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']

function validateAttachment(file) {
  const lower = file.name.toLowerCase()
  if (!ATTACH_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    return `${file.name}: jpg, png, word, excel, ppt 형식만 첨부할 수 있습니다.`
  }
  if (file.size > ATTACH_MAX_SIZE) {
    return `${file.name}: 파일 용량은 최대 10MB까지 첨부할 수 있습니다.`
  }
  return null
}

function onAttachmentChange(event) {
  const files = Array.from(event.target.files || [])
  for (const file of files) {
    const invalid = validateAttachment(file)
    if (invalid) {
      window.alert(invalid)
      continue
    }
    form.attachments.push(file.name)
  }
  event.target.value = ''
}

function removeAttachment(idx) {
  if (!canEditFields.value) return
  form.attachments.splice(idx, 1)
}

/** 최종확정 후에도 반려로의 전이만은 허용한다(BR-10). 반려 상태 자체는 잠금(isReadOnly)이라
 *  더 이상 전이할 수 없다. */
function canSelectStatus(s) {
  if (isRegister.value || isCopy.value) return true
  if (isReadOnly.value) return false
  if (isFinallyConfirmed.value) return s === '반려'
  return true
}

function onStatusChange(next) {
  if (!canSelectStatus(next)) return
  form.status = next
}

function toSavePayload(extra = {}) {
  syncAliasesFromScopes()
  return {
    ...form,
    scopes: form.scopes.map((scope, index) => ({
      ...scope,
      seq: index + 1,
    })),
    ...extra,
  }
}

/** 등록 검증(원안 필수) / 수정 검증(원안은 잠금 필드라 값이 이미 있어 재검증하지 않음) — h-pms
 *  validateCreateForm/validateEditForm과 같은 문구·순서. */
function save() {
  if (!form.name.trim()) {
    window.alert('요구사항명을 입력해 주세요.')
    return
  }
  if (!isEdit.value && !form.original.trim()) {
    window.alert('요구사항원안을 입력해 주세요.')
    return
  }
  if (!form.scopes.length) {
    window.alert('업무범위를 1개 이상 등록해 주세요.')
    return
  }
  for (const scope of form.scopes) {
    if (!scope.system) {
      window.alert('업무범위마다 시스템을 선택해 주세요.')
      return
    }
    if (!scope.bizCategory) {
      window.alert('업무범위마다 업무구분을 선택해 주세요.')
      return
    }
    if (!scope.noScreen && !String(scope.screenName || '').trim()) {
      window.alert('업무범위마다 화면을 선택하거나 화면없음을 명시해 주세요.')
      return
    }
  }

  // 신규 등록(복사 포함)은 h-pms와 동일하게 확인 팝업 없이 바로 저장한다.
  // 수정만 "저장하시겠습니까?" → 변경사유 순서를 거친다.
  if (isEdit.value) {
    if (!window.confirm('저장하시겠습니까?')) return
    showChangeReasonModal.value = true
    return
  }
  emit('save', toSavePayload())
}

function onChangeReasonSave(payload) {
  const reason =
    typeof payload === 'string'
      ? payload
      : payload?.etc || changeReasonLabel(payload?.code)
  emit(
    'save',
    toSavePayload({
      changeReason: reason,
      changeReasonCode: typeof payload === 'object' ? payload?.code : '',
      changeReasonEtc: typeof payload === 'object' ? payload?.etc : null,
    }),
  )
}

const HISTORY_FIELD_LABELS = {
  name: '요구사항명',
  analysis: '요구사항 분석',
  status: '상태',
  priority: '우선순위',
  taskTypes: '업무유형',
  memo: '비고',
}

const historyList = computed(() => props.data?.changeHistory || [])
const historyTotal = computed(() => historyList.value.length)
const showAllHistory = ref(false)
const expandedHistoryId = ref(null)

const visibleHistory = computed(() => {
  const ordered = historyList.value.slice().reverse()
  return showAllHistory.value ? ordered : ordered.slice(0, 5)
})

function toggleHistoryDetail(id) {
  expandedHistoryId.value = expandedHistoryId.value === id ? null : id
}

function diffFields(entry) {
  const before = entry.before || {}
  const after = entry.after || {}
  return Object.keys(HISTORY_FIELD_LABELS)
    .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .map((key) => ({
      label: HISTORY_FIELD_LABELS[key],
      before: Array.isArray(before[key]) ? before[key].join(', ') : before[key] ?? '-',
      after: Array.isArray(after[key]) ? after[key].join(', ') : after[key] ?? '-',
    }))
}
</script>

<template>
  <BaseModal :title="title" :visible="modelValue" wide @close="close">
    <template #title-extra>
      <BaseTooltip text="업무범주는 '업무범주 추가' 버튼으로 여러 개를 조합해 등록할 수 있습니다. (예: 시스템A 화면1 + 시스템B 화면2)" />
    </template>
    <p v-if="metaLine" class="meta-line">{{ metaLine }}</p>
    <section class="section">
      <h3 class="section__title">요구사항 기본 정보</h3>
      <div class="frow">
        <div class="fld fld--reqid">
          <label>요구사항 ID</label>
          <div class="inp inp--ro">{{ form.reqId }}</div>
        </div>
        <div class="fld">
          <label class="fld--req">
            구분
            <BaseTooltip text="최초 요구사항 : 현업에서 발의한 최초 개발 요청사항 · 추가 요구사항 : 최초 발의된 요구사항에 없던 신규 요구사항" />
          </label>
          <div class="seg">
            <button
              v-for="t in requirementTypes"
              :key="t"
              type="button"
              class="seg__btn"
              :class="{ 'seg__btn--on': form.reqType === t }"
              :disabled="reqTypeLocked || !canEditFields"
              @click="form.reqType = t"
            >
              {{ t }}
            </button>
          </div>
        </div>
      </div>

      <div class="fld">
        <label class="fld--req">요구사항명</label>
        <input
          v-model="form.name"
          class="inp"
          type="text"
          maxlength="100"
          :disabled="!canEditFields"
        />
      </div>

      <div class="fld">
        <label class="fld--req">요구사항 원안</label>
        <textarea
          v-model="form.original"
          class="textarea"
          rows="4"
          maxlength="2000"
          placeholder="현업에서 발의한 개발 요청사항 입력"
          :disabled="originalLocked"
        />
      </div>

      <div class="fld">
        <label>요구사항 분석</label>
        <textarea
          v-model="form.analysis"
          class="textarea"
          rows="4"
          maxlength="2000"
          placeholder="테크(기획/개발)에서 상세 분석/정의한 내용 입력"
          :disabled="!canEditFields"
        />
      </div>
    </section>

    <section class="section">
      <h3 class="section__title">업무범주</h3>
      <div
        v-for="(scope, idx) in form.scopes"
        :key="scope.id ?? `new-${idx}`"
        class="scope-block"
        :class="{ 'category-block': idx > 0 }"
      >
        <div class="frow frow--3">
          <div class="fld fld--req">
            <label>시스템구분</label>
            <select
              v-model="scope.system"
              class="inp"
              :disabled="!canEditFields"
              @change="onScopeSystemChange(scope)"
            >
              <option v-for="s in systemOptions" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="fld fld--req">
            <label>업무구분</label>
            <select v-model="scope.bizCategory" class="inp" :disabled="!canEditFields">
              <option value="">선택</option>
              <option v-for="b in bizOptionsFor(scope.system)" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>
          <div class="fld">
            <label>화면(메뉴)</label>
            <div class="screen-search">
              <button
                type="button"
                class="screen-search__field"
                :disabled="!canFillScreenFor(scope)"
                @click="openScreenSearch(idx)"
              >
                <span v-if="screenDisplayFor(scope)" class="screen-search__value">{{ screenDisplayFor(scope) }}</span>
                <span v-else class="screen-search__ph">화면(메뉴) 검색</span>
              </button>
              <button
                type="button"
                class="btn btn--ghost btn--sm screen-search__btn"
                :disabled="!canFillScreenFor(scope)"
                @click="openScreenSearch(idx)"
              >
                검색
              </button>
              <button
                v-if="idx > 0"
                type="button"
                class="btn btn--ghost btn--sm"
                :disabled="!canEditFields"
                @click="removeScope(idx)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
        <label class="checkbox-fld no-screen-choice">
          <input
            type="checkbox"
            :checked="scope.noScreen"
            :disabled="!canEditFields"
            @change="setNoScreen(scope, $event.target.checked)"
          />
          화면없음(API/Batch/신규 메뉴 등 화면과 연결되지 않은 요구사항)
        </label>
      </div>

      <button
        type="button"
        class="btn btn--ghost btn--sm category-add-btn"
        :disabled="!canEditFields"
        @click="addScope"
      >
        ＋ 업무범주 추가
      </button>
    </section>

    <section class="section">
      <h3 class="section__title">추가 정보</h3>
      <div class="frow frow--2">
        <div class="fld">
          <label>
            상태
            <BaseTooltip
              text="접수 : 요건 분석 및 요건 정의 초안 단계 (화면/메뉴 및 업무유형 선택 등록) · 수용 : SB 초안에 반영된 상태 (화면/메뉴 및 업무유형 필수 등록) · 반려 : 현업에서 개발 요건 취소한 상태"
            />
          </label>
          <div class="seg seg--tight">
            <button
              v-for="s in ['접수', '수용', '반려']"
              :key="s"
              type="button"
              class="seg__btn"
              :class="{ 'seg__btn--on': form.status === s }"
              :disabled="!canSelectStatus(s)"
              @click="onStatusChange(s)"
            >
              {{ s }}
            </button>
          </div>
        </div>
        <div class="fld">
          <label>우선순위</label>
          <div class="seg seg--tight">
            <button
              v-for="p in ['낮음', '보통', '높음']"
              :key="p"
              type="button"
              class="seg__btn"
              :class="{ 'seg__btn--on': form.priority === p }"
              :disabled="!canEditFields"
              @click="form.priority = p"
            >
              {{ p }}
            </button>
          </div>
        </div>
      </div>

      <div class="confirm-row">
        <span class="confirm-label">
          요건확정 <span class="confirm-label__star">*</span>
          <button
            type="button"
            class="confirm-tip"
            @click.stop="confirmTipOpen = !confirmTipOpen"
            @blur="confirmTipOpen = false"
          >
            !
          </button>
          <span v-if="confirmTipOpen" class="confirm-tip__bubble">{{ confirmTooltip }}</span>
        </span>
        <label class="confirm-item confirm-item--locked">
          <input type="checkbox" :checked="form.confirmRequester" disabled />
          요청자
          <span v-if="props.data?.confirmRequesterAt" class="confirm-time">{{ props.data.confirmRequesterAt }}</span>
        </label>
        <label class="confirm-item confirm-item--locked">
          <input type="checkbox" :checked="form.confirmTech" disabled />
          테크
          <span v-if="props.data?.confirmTechAt" class="confirm-time">{{ props.data.confirmTechAt }}</span>
        </label>
      </div>

      <div class="fld">
        <label>비고</label>
        <textarea
          v-model="form.memo"
          class="textarea"
          rows="2"
          maxlength="500"
          :disabled="!canEditFields"
        />
        <span class="count">{{ memoCount }} / 500자</span>
      </div>

      <div class="fld">
        <label>첨부파일</label>
        <div class="attach">
          <span v-for="(file, idx) in form.attachments" :key="`${file}-${idx}`" class="attach__chip">
            {{ file }}
            <button
              v-if="canEditFields"
              type="button"
              class="attach__x"
              @click="removeAttachment(idx)"
            >
              ✕
            </button>
          </span>
          <label v-if="canEditFields" class="attach__add">
            ＋ 파일 추가
            <input type="file" multiple class="attach__input" :accept="ATTACH_ACCEPT" @change="onAttachmentChange" />
          </label>
        </div>
        <span class="attach__hint">{{ ATTACH_HINT }}</span>
      </div>

    </section>

    <section v-if="isEdit" class="section">
      <h3 class="section__title">변경 이력 (요구사항 기본정보)</h3>
      <div class="history-summary">총 <b>{{ historyTotal }}</b>건</div>

      <div v-if="!historyList.length" class="history-empty">변경 이력이 없습니다.</div>

      <ul v-else class="history-list">
        <li v-for="entry in visibleHistory" :key="entry.id" class="history-item">
          <div class="history-item__head">
            <span class="history-item__round">{{ entry.round }}차</span>
            <span class="history-item__reason">{{ entry.reason }}</span>
            <span class="history-item__meta">{{ entry.changedBy }} · {{ entry.changedAt }}</span>
            <button type="button" class="link-btn" @click="toggleHistoryDetail(entry.id)">
              {{ expandedHistoryId === entry.id ? '접기' : '상세보기' }}
            </button>
          </div>
          <table v-if="expandedHistoryId === entry.id" class="history-diff">
            <thead>
              <tr>
                <th>항목</th>
                <th>변경 전</th>
                <th>변경 후</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!diffFields(entry).length">
                <td colspan="3">변경된 항목이 없습니다.</td>
              </tr>
              <tr v-for="f in diffFields(entry)" :key="f.label">
                <td>{{ f.label }}</td>
                <td>{{ f.before }}</td>
                <td>{{ f.after }}</td>
              </tr>
            </tbody>
          </table>
        </li>
      </ul>

      <button
        v-if="!showAllHistory && historyTotal > 5"
        type="button"
        class="btn btn--ghost btn--sm history-more"
        @click="showAllHistory = true"
      >
        더보기 ({{ historyTotal - 5 }}건)
      </button>
    </section>

    <section v-if="isEdit && data" class="section">
      <h3 class="section__title">이슈 관리</h3>
      <RequirementIssuePanel
        :key="data.id"
        :requirement="data"
        @count-change="emit('count-change', $event)"
        @issue-added="emit('issue-added', $event)"
      />
    </section>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">
        {{ showSaveButton ? '취소' : '닫기' }}
      </button>
      <button
        v-if="showSaveButton"
        type="button"
        class="btn btn--primary"
        @click="save"
      >
        {{ isEdit ? '수정' : '등록' }}
      </button>
    </template>
  </BaseModal>

  <RequirementScreenSearchModal
    v-model="showScreenSearch"
    :system="activeScreenSystem"
    @select="onScreenSelect"
  />
  <RequirementChangeReasonModal v-model="showChangeReasonModal" @save="onChangeReasonSave" />
</template>

<style scoped>
.section {
  margin-bottom: 18px;
  padding: 14px 16px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-lg, 10px);
}

.section__title {
  margin: 0 0 12px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 700;
}

.fld--reqid {
  max-width: 200px;
}

.frow {
  display: grid;
  gap: 10px 14px;
  margin-bottom: 12px;
}

.frow--2 {
  grid-template-columns: 1fr 1fr;
}

.frow--3 {
  grid-template-columns: repeat(3, 1fr);
}

.fld {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.fld--wide {
  grid-column: span 2;
}

.fld--req label::after,
label.fld--req::after {
  content: ' *';
  color: var(--red);
}

.fld label {
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  font-weight: 600;
}

.inp {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm, 7px);
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  background: var(--lnb-side);
}

.inp--ro {
  background: var(--field);
  color: var(--lnb-muted);
  display: flex;
  align-items: center;
}

.inp:disabled,
.textarea:disabled {
  background: var(--field);
  cursor: not-allowed;
  opacity: 0.85;
}

.textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md, 8px);
  font-family: inherit;
  font-size: calc(13px + var(--font-size-offset, 0px));
  line-height: 1.5;
  resize: vertical;
}

.count {
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  text-align: right;
}

.seg {
  display: inline-flex;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
}

.seg__btn {
  padding: 6px 12px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  border: none;
  border-right: 1px solid var(--lnb-line);
  background: var(--lnb-side);
  cursor: pointer;
  font-family: inherit;
  color: var(--lnb-txt);
}

.seg__btn:last-child {
  border-right: none;
}

.seg--tight .seg__btn:last-child {
  width: 50px;
}

.seg__btn--on {
  background: var(--teal);
  color: var(--color-text-inverse);
  font-weight: 700;
}

.seg__btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.confirm-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.confirm-label {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--lnb-txt);
}

.confirm-label__star {
  color: var(--red);
}

.confirm-tip {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: none;
  background: var(--lnb-hover);
  color: var(--lnb-muted);
  font-size: calc(10px + var(--font-size-offset, 0px));
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  font-family: inherit;
  padding: 0;
}

.confirm-tip__bubble {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 20;
  width: 280px;
  padding: 10px 12px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md, 8px);
  background: var(--lnb-side);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.08));
  color: var(--lnb-txt);
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 500;
  line-height: 1.55;
  white-space: pre-line;
}

.confirm-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  cursor: pointer;
}

.confirm-item:has(input:disabled) {
  cursor: not-allowed;
  opacity: 0.7;
}

.confirm-item--locked {
  opacity: 0.7;
}

.confirm-time {
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

:deep(.modal__header) .tooltip {
  margin-left: 6px;
  vertical-align: middle;
}

.meta-line {
  margin: 0 0 10px;
  text-align: right;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.screen-search {
  display: flex;
  gap: 6px;
  align-items: center;
}

.screen-search__field {
  flex: 1;
  min-height: 32px;
  padding: 6px 10px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm, 7px);
  background: var(--lnb-side);
  text-align: left;
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
  color: var(--lnb-txt);
}

.screen-search__field:disabled {
  background: var(--field);
  cursor: not-allowed;
  opacity: 0.7;
}

.screen-search__ph {
  color: var(--lnb-muted);
}

.screen-search__value {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.screen-search__btn {
  flex-shrink: 0;
}

.category-block {
  padding-top: 10px;
  border-top: 1px dashed var(--lnb-line);
}

.category-add-btn {
  margin-bottom: 12px;
}

.scope-block + .scope-block {
  margin-top: 4px;
}

.checkbox-fld {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
  color: var(--lnb-txt);
}

.attach {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.attach__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 6px 0 10px;
  border: 1px solid var(--teal-100, var(--lnb-line));
  background: var(--teal-50, var(--lnb-side));
  border-radius: 20px;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  color: var(--teal-600, var(--lnb-txt));
}

.attach__x {
  border: none;
  background: none;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  font-size: calc(11px + var(--font-size-offset, 0px));
  padding: 0 2px;
}

.attach__x:hover {
  opacity: 1;
}

.attach__add {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--lnb-line);
  border-radius: 20px;
  background: var(--lnb-side);
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
}

.attach__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.attach__hint {
  display: block;
  margin-top: 6px;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  color: var(--lnb-txt);
  opacity: 0.75;
}

.history-summary {
  margin-bottom: 10px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-txt);
}

.history-summary b {
  color: var(--teal-600);
}

.history-empty {
  padding: 20px;
  text-align: center;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  padding: 10px 12px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md, 8px);
  background: var(--lnb-hover);
}

.history-item__head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.history-item__round {
  font-weight: 700;
  color: var(--teal-600);
}

.history-item__reason {
  flex: 1;
  min-width: 120px;
  color: var(--lnb-txt);
}

.history-item__meta {
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.history-item__head .link-btn {
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.history-diff {
  width: 100%;
  margin-top: 10px;
  border-collapse: collapse;
  font-size: calc(12px + var(--font-size-offset, 0px));
  table-layout: fixed;
}

.history-diff th:first-child,
.history-diff td:first-child {
  width: 20%;
}

.history-diff th,
.history-diff td {
  padding: 6px 8px;
  border: 1px solid var(--lnb-line);
  text-align: left;
  word-break: break-all;
  white-space: pre-wrap;
}

.history-diff th {
  background: var(--lnb-side);
  color: var(--lnb-muted);
  font-weight: 600;
  text-align: center;
}

.history-more {
  margin-top: 10px;
}
</style>
