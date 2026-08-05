<script setup>
// POP-M-DAS-05 경과 업무 상세 팝업
import BaseModal from '@/shared/ui/BaseModal.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  data: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    title="경과 업무 상세"
    :visible="modelValue && !!data"
    side
    @close="close"
  >
    <template v-if="data">
      <p class="sub">
        프로젝트명 : {{ data.projectName }} | 담당자 : {{ data.personName }}({{ data.personEmpId }})
      </p>
      <p class="total">총 <b>{{ data.total }}</b>건</p>
      <div class="delay-list">
        <article v-for="task in data.tasks" :key="task.id" class="delay-item">
          <div class="delay-item__grid">
            <div class="delay-item__field">
              <span class="delay-item__lab">업무구분</span>
              <span>{{ task.workType }}</span>
            </div>
            <div class="delay-item__field delay-item__field--wide">
              <span class="delay-item__lab">업무명</span>
              <span>{{ task.taskName }}</span>
            </div>
            <div class="delay-item__field delay-item__field--wide">
              <span class="delay-item__lab">업무상세</span>
              <span>{{ task.taskDetail }}</span>
            </div>
            <div class="delay-item__field">
              <span class="delay-item__lab">경과일정</span>
              <span class="delay-item__dates">
                {{ task.planEnd }} → {{ task.actualEnd }}
                <b class="delay-item__plus">+{{ task.delayDays }}일</b>
              </span>
            </div>
          </div>
          <div class="delay-item__reason">
            <span class="delay-item__lab">사유</span>
            <p>{{ task.reason }}</p>
          </div>
        </article>
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn--primary" @click="close">닫기</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.sub {
  margin: 0 0 6px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.total {
  margin: 0 0 14px;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  font-weight: 600;
  color: var(--lnb-txt);
}

.total b {
  font-size: calc(15px + var(--font-size-offset, 0px));
  color: var(--teal-600);
}

.delay-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.delay-item {
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
  padding: 12px 14px;
  background: var(--lnb-side);
}

.delay-item__grid {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 8px 12px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  margin-bottom: 10px;
}

.delay-item__field {
  display: contents;
}

.delay-item__field--wide {
  grid-column: span 2;
}

.delay-item__lab {
  color: var(--lnb-txt);
  font-weight: 600;
}

.delay-item__dates {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.delay-item__plus {
  color: var(--red);
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  background: var(--red-bg);
}

.delay-item__reason {
  border-top: 1px solid var(--lnb-line);
  padding-top: 10px;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.delay-item__reason p {
  margin: 4px 0 0;
  line-height: 1.6;
  color: var(--lnb-txt);
}
</style>
