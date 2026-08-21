<script setup>
// POP-S-WBS-04 요청 내용 상세 — 일정 관리 팝업의 이력 행에서 연다.
import { computed } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'

const props = defineProps({
  request: { type: Object, default: null },
})

const emit = defineEmits(['close', 'cancel'])

const canCancel = computed(() => props.request?.status === 'PENDING')

function onCancelClick() {
  const current = props.request
  if (!current || !canCancel.value) return
  if (
    !window.confirm(
      "취소된 요청은 승인 대상에서 제외되며, 진행상태가 '취소'로 변경됩니다. 취소하시겠습니까?",
    )
  ) {
    return
  }
  emit('cancel', current)
}
</script>

<template>
  <BaseModal
    title="일정 변경 요청 상세정보"
    :visible="!!request"
    wide
    @close="emit('close')"
  >
    <template v-if="request">
      <dl class="info-dl">
        <div class="info-dl__row">
          <dt>현재일정</dt>
          <dd>{{ request.beforeStart }} ~ {{ request.beforeEnd }}</dd>
        </div>
        <div class="info-dl__row">
          <dt>변경일정</dt>
          <dd>{{ request.afterStart }} ~ {{ request.afterEnd }}</dd>
        </div>
      </dl>
      <div class="reason-box">
        <p class="reason-box__label">변경사유</p>
        <p class="reason-box__text">{{ request.reason }}</p>
        <p class="reason-box__meta">{{ request.registeredBy }} · {{ request.registeredAt }}</p>
      </div>
    </template>
    <template #footer>
      <button v-if="canCancel" type="button" class="btn btn--ghost" @click="onCancelClick">
        요청취소
      </button>
      <button type="button" class="btn btn--primary" @click="emit('close')">확인</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.info-dl {
  margin: 0 0 14px;
  background: var(--lnb-hover);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.info-dl__row {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 8px 12px;
  padding: 11px 14px;
  font-size: calc(12px + var(--font-size-offset, 0px));
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
  font-weight: 700;
}

.reason-box {
  background: var(--teal-50);
  border: 1px solid var(--teal-100);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
}

.reason-box__label {
  margin: 0 0 6px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--teal);
}

.reason-box__text {
  margin: 0;
  font-size: calc(13px + var(--font-size-offset, 0px));
  line-height: 1.6;
  color: var(--lnb-txt);
}

.reason-box__meta {
  margin: 8px 0 0;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}
</style>
