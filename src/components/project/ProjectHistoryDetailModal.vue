<script setup>
import BaseModal from '@/components/ui/BaseModal.vue'

defineProps({
  visible: { type: Boolean, default: false },
  record: { type: Object, default: null },
})

defineEmits(['close'])
</script>

<template>
  <BaseModal
    :visible="visible"
    :title="record?.detail?.title || '변경이력 상세'"
    wide
    @close="$emit('close')"
  >
    <template v-if="record">
      <div class="meta">
        <span class="meta__badge">{{ record.category }}</span>
        <span>{{ record.item }}</span>
        <span class="meta__muted">{{ record.changedAt }} · {{ record.changedBy }}</span>
      </div>

      <p v-if="record.detail?.body" class="body">{{ record.detail.body }}</p>

      <table v-if="record.detail?.fields?.length" class="detail-table">
        <tbody>
          <tr v-for="(field, idx) in record.detail.fields" :key="idx">
            <th>{{ field.label }}</th>
            <td>{{ field.value }}</td>
          </tr>
        </tbody>
      </table>

      <div v-if="record.changeLines?.length" class="changes">
        <h4>변경 내용</h4>
        <p v-for="(line, idx) in record.changeLines" :key="idx" class="change-line">
          <span class="change-line__label">{{ line.label }}</span>
          <span class="change-line__before">{{ line.before }}</span>
          <span class="change-line__arrow">→</span>
          <span class="change-line__after">{{ line.after }}</span>
        </p>
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn--primary" @click="$emit('close')">확인</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.meta__badge {
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--teal-50);
  color: var(--teal-600);
  font-weight: 700;
}

.meta__muted {
  color: var(--muted);
}

.body {
  margin: 0 0 14px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  line-height: 1.5;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(12px + var(--font-size-offset, 0px));
  margin-bottom: 14px;
}

.detail-table th,
.detail-table td {
  border: 1px solid var(--line);
  padding: 8px 10px;
  text-align: left;
}

.detail-table th {
  width: 120px;
  background: var(--lnb-hover);
  color: var(--ink-2);
  font-weight: 600;
}

.changes h4 {
  margin: 0 0 8px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 700;
}

.change-line {
  margin: 0 0 6px;
  font-size: calc(13px + var(--font-size-offset, 0px));
}

.change-line__label {
  font-weight: 600;
  margin-right: 6px;
}

.change-line__before {
  color: var(--muted);
}

.change-line__arrow {
  margin: 0 6px;
  color: var(--muted);
}

.change-line__after {
  color: var(--teal-600);
  font-weight: 600;
}
</style>
