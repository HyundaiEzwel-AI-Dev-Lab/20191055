<script setup>
// POP-S-UAT-02 테스트 참고사항 (포스트잇형 팝업) — 시나리오관리/테스트수행 공용
// 2026-09-02 h-pms 이식:
// - 배경을 어둡게 덮지 않는다. 이 팝업을 띄운 채로 뒤 화면을 계속 조작할 수 있어야 한다 —
//   오버레이는 pointer-events:none으로 클릭을 통과시키고, 포스트잇에만 pointer-events:auto를
//   되돌린다. 그래서 바깥을 클릭해도 닫히지 않고, X 버튼으로만 닫힌다.
// - 글자수 제한(200자)과 카운터를 없앴다.
// - history를 주면 기존 참고사항을 읽기 전용으로 위에 보여준다. 참고사항 저장은 덮어쓰기가
//   아니라 누적 추가라, 이미 쌓인 내용을 draft에 미리 채우면 저장할 때 같은 글이 중복된다 —
//   그래서 이력은 보여주기만 하고 입력칸은 비워 둔다. (호출부가 아직 history를 넘기지 않아도
//   무방 — 안 주면 이력 영역 자체가 나타나지 않는다.)
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  note: { type: String, default: '' },
  history: { type: String, default: '' },
  /** h-pms는 항상 우상단에 고정한다(위치가 화면마다 다르면 안 된다는 확정 사항). 이 mockup의
      두 호출부는 이미 항상 true로 넘기고 있어 실제 동작은 그대로다 — 값과 무관하게 항상
      우상단에 뜨도록 통일하되, prop 자체는 기존 호출부 호환을 위해 남겨 둔다. */
  anchorTopRight: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'save'])

const draft = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (open) draft.value = props.note || ''
  },
)

/** 적던 내용이 남아 있으면 '저장하지 않고 닫을까요?' 확인창을 띄운다. 자동 저장은 하지 않는다.
    빈 채로 닫는 것은 잃을 것이 없어 확인창이 방해라 묻지 않는다. */
const DISCARD_CONFIRM_MESSAGE = '저장하지 않고 닫을까요?'

function closeNow() {
  emit('update:modelValue', false)
}

function close() {
  if (draft.value.trim() && !window.confirm(DISCARD_CONFIRM_MESSAGE)) return
  closeNow()
}

function save() {
  emit('save', draft.value.trim())
  // 저장한 뒤에는 묻지 않는다 — 방금 저장했는데 '저장하지 않고 닫을까요?'는 앞뒤가 안 맞는다.
  closeNow()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="postit-overlay">
      <div class="postit">
        <!-- 바깥을 클릭해도 안 닫히고 이 X 버튼으로만 닫힌다. -->
        <button type="button" class="postit__close" @click="close">×</button>
        <p class="postit__label">테스트 참고사항</p>
        <pre v-if="history" class="postit__history">{{ history }}</pre>
        <textarea
          v-model="draft"
          class="postit__textarea"
          :placeholder="history ? '추가할 내용을 입력하세요' : '참고사항을 입력하세요'"
        />
        <div class="postit__footer">
          <button type="button" class="postit__save" @click="save">저장</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.postit-overlay {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 76px 24px 0 0;
  /* 배경을 덮지 않는다 — 클릭이 뒤 화면으로 그대로 통과한다. */
  pointer-events: none;
}

.postit {
  position: relative;
  pointer-events: auto;
  width: 364px;
  min-height: 220px;
  padding: 20px 18px;
  background: #fff6a8;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.postit__close {
  position: absolute;
  top: 8px;
  right: 10px;
  border: none;
  background: none;
  font-size: calc(16px + var(--font-size-offset, 0px));
  cursor: pointer;
  color: #6b6b30;
  line-height: 1;
}

.postit__label {
  margin: 0;
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: #6b6b30;
}

.postit__history {
  margin: 0;
  max-height: 120px;
  overflow: auto;
  padding: 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.06);
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  line-height: 1.5;
  color: #4a4a1f;
  white-space: pre-wrap;
  word-break: break-word;
}

.postit__textarea {
  flex: 1;
  width: 100%;
  min-height: 120px;
  border: none;
  background: transparent;
  resize: none;
  font-family: inherit;
  font-size: calc(13px + var(--font-size-offset, 0px));
  line-height: 1.6;
  color: #4a4a1f;
  box-sizing: border-box;
}

.postit__textarea:focus {
  outline: none;
}

.postit__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.postit__save {
  border: none;
  border-radius: var(--radius-sm, 6px);
  padding: 6px 14px;
  background: #4a4a1f;
  color: #fff6a8;
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 700;
  cursor: pointer;
}
</style>
