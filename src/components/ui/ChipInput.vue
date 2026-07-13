<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  placeholder: { type: String, default: '입력 후 Enter' },
})

const emit = defineEmits(['update:modelValue'])

const input = ref('')

function addChip() {
  const value = input.value.trim()
  if (!value) return
  emit('update:modelValue', [...props.modelValue, value])
  input.value = ''
}

function removeChip(index) {
  const next = [...props.modelValue]
  next.splice(index, 1)
  emit('update:modelValue', next)
}

function onKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault()
    addChip()
  }
}
</script>

<template>
  <div class="chip-input">
    <span v-for="(chip, i) in modelValue" :key="i" class="chip-input__chip">
      {{ chip }}
      <button class="tab-bar__close" @click="removeChip(i)">×</button>
    </span>
    <input
      v-model="input"
      class="chip-input__field"
      :placeholder="placeholder"
      @keydown="onKeydown"
    />
  </div>
</template>
