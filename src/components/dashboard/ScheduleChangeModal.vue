<script setup>
// POP-M-DAS-03 일정변동 사유 팝업
import { computed } from 'vue'

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
  <Teleport to="body">
    <div
      v-if="modelValue && data"
      class="modal-scrim"
      @mousedown.self="close"
    >
      <div class="modal" role="dialog" aria-labelledby="schedule-change-title">
        <div class="modal__head">
          <span id="schedule-change-title" class="modal__title">일정변동 사유</span>
          <button type="button" class="modal__close" aria-label="닫기" @click="close">✕</button>
        </div>

        <div class="modal__body">
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
        </div>

        <div class="modal__foot">
          <button type="button" class="btn btn--primary" @click="close">확인</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-scrim {
  --teal: #119a8a;
  --teal-600: #0e8275;
  --teal-50: #e6f4f2;
  --teal-100: #cfe9e5;
  --ink: #1f2a30;
  --ink-2: #48565e;
  --muted: #7c8a92;
  --line: #e3e8eb;
  --line-2: #eef1f3;
  --red: #e0524a;
  --red-bg: #fdecea;
  --shadow: 0 6px 24px rgba(20, 40, 50, 0.12);

  position: fixed;
  inset: 0;
  background: rgba(18, 30, 34, 0.34);
  z-index: 1200;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 70px 16px;
  font-family: var(--font-family);
  color: var(--ink);
}

.modal {
  width: 640px;
  max-width: 92vw;
  max-height: 84vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 14px;
  box-shadow: var(--shadow);
}

.modal__head {
  display: flex;
  align-items: center;
  padding: 15px 18px;
  border-bottom: 1px solid var(--line-2);
  flex-shrink: 0;
}

.modal__title {
  font-weight: 800;
  font-size: 14px;
  color: var(--ink);
}

.modal__close {
  margin-left: auto;
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 14px;
}

.modal__close:hover {
  background: var(--line-2);
  color: var(--ink);
}

.modal__body {
  padding: 18px;
  overflow-y: auto;
  flex: 1;
}

.modal__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 18px;
  border-top: 1px solid var(--line-2);
  flex-shrink: 0;
}

.btn {
  height: 32px;
  padding: 0 18px;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn--primary {
  background: var(--teal);
  color: #fff;
}

.btn--primary:hover {
  background: var(--teal-600);
}

.info-dl {
  margin: 0 0 16px;
  padding: 0;
  background: var(--line-2);
  border-radius: 10px;
  overflow: hidden;
}

.info-dl__row {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 8px 12px;
  padding: 11px 14px;
  font-size: 12px;
  border-bottom: 1px solid var(--line);
}

.info-dl__row:last-child {
  border-bottom: none;
}

.info-dl__row--dates {
  grid-template-columns: 100px 1fr 72px 1fr;
}

.info-dl__row dt {
  color: var(--muted);
  font-weight: 500;
}

.info-dl__row dd {
  margin: 0;
  color: var(--ink);
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
  font-size: 10px;
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
  font-size: 11px;
  font-weight: 700;
  color: var(--teal-600);
}

.reason-box__text {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--ink);
}

.reason-box__meta {
  margin: 10px 0 0;
  font-size: 11px;
  color: var(--muted);
}

.history__title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
}

.history__table-wrap {
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
}

.history__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.history__table thead th {
  background: #fafbfc;
  color: var(--muted);
  font-weight: 600;
  text-align: left;
  padding: 9px 11px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}

.history__table tbody td {
  padding: 10px 11px;
  border-bottom: 1px solid var(--line-2);
  color: var(--ink-2);
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
  font-size: 11px;
  color: var(--muted);
}
</style>
