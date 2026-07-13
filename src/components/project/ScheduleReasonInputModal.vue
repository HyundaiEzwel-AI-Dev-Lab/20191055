<script setup>
// POP-S-INF-04 일정 변동 사유 입력
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  scheduledOpenDate: { type: String, default: '' },
  actualOpenDate: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'save'])

const reason = ref('')

const charCount = computed(() => reason.value.length)

watch(
  () => props.modelValue,
  (open) => {
    if (open) reason.value = ''
  },
)

function close() {
  emit('update:modelValue', false)
}

function save() {
  if (!reason.value.trim()) return
  emit('save', reason.value.trim())
  close()
}
</script>

<template>
  <BaseModal title="일정 변동 사유 입력" :visible="modelValue" @close="close">
    <p class="notice">
      오픈일이 오픈예정일을 경과하였습니다.<br />
      사유를 입력해 주세요.
    </p>

    <dl class="info-dl">
      <div class="info-dl__row">
        <dt>오픈예정일</dt>
        <dd>{{ scheduledOpenDate }}</dd>
      </div>
      <div class="info-dl__row">
        <dt>오픈일</dt>
        <dd class="info-dl__late">{{ actualOpenDate }}</dd>
      </div>
    </dl>

    <div class="reason-field">
      <textarea
        v-model="reason"
        class="reason-field__input"
        rows="4"
        maxlength="200"
        placeholder="일정 변동 사유를 입력하세요"
      />
      <span class="reason-field__count">{{ charCount }} / 200자</span>
    </div>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button
        type="button"
        class="btn btn--primary"
        :disabled="!reason.trim()"
        @click="save"
      >
        저장
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.notice {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--lnb-txt);
}

.info-dl {
  margin: 0 0 14px;
  background: var(--lnb-hover);
  border-radius: 10px;
  overflow: hidden;
}

.info-dl__row {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 8px 12px;
  padding: 11px 14px;
  font-size: 12px;
  border-bottom: 1px solid var(--lnb-line);
}

.info-dl__row:last-child {
  border-bottom: none;
}

.info-dl__row dt {
  color: var(--lnb-muted);
  font-weight: 500;
}

.info-dl__row dd {
  margin: 0;
  font-weight: 600;
}

.info-dl__late {
  color: var(--red) !important;
}

.reason-field {
  position: relative;
}

.reason-field__input {
  width: 100%;
  min-height: 96px;
  padding: 10px 12px;
  border: 1px solid var(--lnb-line);
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
}

.reason-field__input:focus {
  outline: none;
  border-color: var(--teal);
}

.reason-field__count {
  display: block;
  margin-top: 6px;
  text-align: right;
  font-size: 11px;
  color: var(--lnb-muted);
}
</style>
