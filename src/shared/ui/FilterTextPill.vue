<script setup>
/**
 * 검색 영역용 텍스트 입력. role=textbox인 입력은 검색 영역 어디서나 메인 검색창
 * (`SearchFilterBar`의 `.sfb__search-input`)과 같은 형태(돋보기 아이콘 + 테두리 박스)로
 * 통일한다. 이전엔 `FilterSelectPill`과 같은 "라벨 | 값" 알약이었으나, role=textbox
 * 입력만 이 필로 갈아탔다 — 셀렉트 필은 그대로다.
 *
 * `label`은 화면에 보이는 라벨이 아니라 접근성 `aria-label`로만 쓴다. 어떤 필드인지는
 * `placeholder`로 구분한다(메인 검색창과 동일한 관례). 호출부가 placeholder를 안 주면
 * label을 그대로 보여준다.
 *
 * `trailing` 슬롯은 화면검색 팝업 버튼처럼 칸 우측에 붙는 아이콘 자리다.
 */
import { computed, useSlots } from 'vue'

defineProps({
  label: { type: String, required: true },
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  fill: { type: Boolean, default: false },
  type: { type: String, default: 'text' },
  readonly: { type: Boolean, default: false },
  list: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'enter', 'focus', 'click'])

const slots = useSlots()
const hasTrailing = computed(() => !!slots.trailing)
</script>

<template>
  <div
    class="sfb__search"
    :class="{ 'sfb__search--fill': fill, 'sfb__search--trailing': hasTrailing }"
    @click="emit('click', $event)"
  >
    <svg class="sfb__search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </svg>
    <input
      class="sfb__search-input"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder || label"
      :readonly="readonly"
      :list="list || undefined"
      :aria-label="label"
      @input="emit('update:modelValue', $event.target.value)"
      @keyup.enter="emit('enter')"
      @focus="emit('focus')"
    />
    <span v-if="hasTrailing" class="sfb__search-trailing">
      <slot name="trailing" />
    </span>
  </div>
</template>
