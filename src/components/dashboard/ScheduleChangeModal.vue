<script setup>
// POP-M-DAS-03 일정변동 사유 팝업
import { computed } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  data: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const latest = computed(() => {
  if (!props.data?.history?.length) return null
  return props.data.history[props.data.history.length - 1]
})

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    title="일정변동 사유"
    :visible="modelValue && !!data"
    wide
    @close="close"
  >
    <template v-if="data">
      <dl class="info-dl">
        <div class="info-dl__row">
          <dt>프로젝트명</dt>
          <dd>{{ data.projectName }}</dd>
        </div>
        <div class="info-dl__row info-dl__row--dates">
          <dt>오픈예정일</dt>
          <dd>{{ data.scheduledOpenDate }}</dd>
          <dt>오픈일</dt>
          <dd class="info-dl__late">
            {{ data.actualOpenDate }}
            <span class="delay-badge">+{{ data.delayDays }}일 지연</span>
          </dd>
        </div>
      </dl>

      <div v-if="latest" class="reason-box">
        <p class="reason-box__label">변동 사유</p>
        <p class="reason-box__text">{{ latest.reason }}</p>
        <p class="reason-box__meta">
          {{ latest.registeredBy }} · {{ latest.registeredAt }}
        </p>
      </div>

      <div class="history">
        <p class="history__title">변동 이력</p>
        <div class="history__table-wrap">
          <table class="history__table">
            <thead>
              <tr>
                <th>No.</th>
                <th>변경 전 오픈예정일</th>
                <th>변경 후 오픈예정일</th>
                <th>변동 사유</th>
                <th>등록자</th>
                <th>등록일시</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in data.history" :key="row.no">
                <td>{{ row.no }}</td>
                <td>{{ row.scheduledOpenDate }}</td>
                <td>{{ row.changedOpenDate }}</td>
                <td class="history__reason">{{ row.reason }}</td>
                <td>{{ row.registeredBy }}</td>
                <td class="history__time">{{ row.registeredAt }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn--primary" @click="close">확인</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.info-dl {
  margin: 0 0 16px;
  padding: 0;
  background: var(--lnb-hover);
  border-radius: 10px;
  overflow: hidden;
}

.info-dl__row {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 8px 12px;
  padding: 11px 14px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  border-bottom: 1px solid var(--lnb-line);
}

.info-dl__row:last-child {
  border-bottom: none;
}

.info-dl__row--dates {
  grid-template-columns: 100px 1fr 72px 1fr;
}

.info-dl__row dt {
  color: var(--lnb-muted);
  font-weight: 500;
}

.info-dl__row dd {
  margin: 0;
  color: var(--lnb-txt);
  font-weight: 600;
  word-break: break-all;
}

.info-dl__late {
  color: var(--red) !important;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.delay-badge {
  font-size: calc(10px + var(--font-size-offset, 0px));
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  background: var(--red-bg);
  color: var(--red);
}

.reason-box {
  background: var(--teal-50);
  border: 1px solid var(--teal-100);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.reason-box__label {
  margin: 0 0 8px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--teal-600);
}

.reason-box__text {
  margin: 0;
  font-size: calc(13px + var(--font-size-offset, 0px));
  line-height: 1.6;
  color: var(--lnb-txt);
}

.reason-box__meta {
  margin: 10px 0 0;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.history__title {
  margin: 0 0 10px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--lnb-txt);
}

.history__table-wrap {
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
  overflow: hidden;
}

.history__table {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.history__table thead th {
  background: var(--lnb-side);
  color: var(--lnb-muted);
  font-weight: 600;
  text-align: left;
  padding: 9px 11px;
  border-bottom: 1px solid var(--lnb-line);
  white-space: nowrap;
}

.history__table tbody td {
  padding: 10px 11px;
  border-bottom: 1px solid var(--lnb-line);
  color: var(--lnb-txt);
  vertical-align: top;
}

.history__table tbody tr:last-child td {
  border-bottom: none;
}

.history__reason {
  max-width: 200px;
  line-height: 1.5;
}

.history__time {
  white-space: nowrap;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}
</style>
