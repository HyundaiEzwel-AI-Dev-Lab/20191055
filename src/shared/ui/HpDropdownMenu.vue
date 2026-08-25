<script setup>
/**
 * 버튼에 붙는 드롭다운 메뉴. 흰 패널 + 얇은 테두리 + 그림자, 항목은 왼쪽 정렬 한 줄, hover에
 * 배경만 들어오고, 구분선으로 묶음을 가른다.
 *
 * 좌표는 Teleport to="body" + position: fixed다. 표·카드 안에서 열리는 메뉴인데
 * overflow: auto 조상이 있으면 absolute 패널은 그 안에 갇혀 잘린다.
 *
 * 닫는 조건: 바깥 pointerdown, Esc, 스크롤·리사이즈(fixed라 좌표가 어긋난다. 따라 옮기지
 * 않고 닫는다), 탭 비활성.
 */
import { computed, nextTick, onScopeDispose, onDeactivated, ref, watch } from 'vue'
import { useEscapeToClose } from '@/shared/lib/useEscapeToClose'

const props = defineProps({
  open: { type: Boolean, required: true },
  anchor: { type: Object, default: null },
  items: { type: Array, required: true },
  align: { type: String, default: 'right' },
  ariaLabel: { type: String, default: '' },
})

const emit = defineEmits(['select', 'close'])

const panelEl = ref(null)
const panelStyle = ref({})
const activeIndex = ref(-1)

const enabledIndexes = computed(() =>
  props.items.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0),
)

const ITEM_HEIGHT = 34
const PANEL_PADDING = 8
const MIN_WIDTH = 160

function place() {
  const anchor = props.anchor
  if (!anchor) return
  const rect = anchor.getBoundingClientRect()
  const height = props.items.length * ITEM_HEIGHT + PANEL_PADDING * 2
  const flipUp = rect.bottom + height > window.innerHeight && rect.top > height
  const width = Math.max(MIN_WIDTH, rect.width)

  const desiredLeft = props.align === 'right' ? rect.right - width : rect.left
  const left = Math.max(8, Math.min(desiredLeft, window.innerWidth - width - 8))
  const style = { minWidth: `${width}px`, left: `${left}px` }
  style[flipUp ? 'bottom' : 'top'] = flipUp
    ? `${window.innerHeight - rect.top + 4}px`
    : `${rect.bottom + 4}px`
  panelStyle.value = style
}

function close() {
  emit('close')
}

function onDocumentPointerDown(event) {
  const target = event.target
  if (props.anchor?.contains(target) || panelEl.value?.contains(target)) return
  close()
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      activeIndex.value = -1
      place()
      void nextTick(place)
      document.addEventListener('pointerdown', onDocumentPointerDown, true)
      window.addEventListener('scroll', close, true)
      window.addEventListener('resize', close)
    } else {
      document.removeEventListener('pointerdown', onDocumentPointerDown, true)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  },
  { immediate: true },
)

onScopeDispose(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  window.removeEventListener('scroll', close, true)
  window.removeEventListener('resize', close)
})

useEscapeToClose(() => props.open, close)
onDeactivated(close)

function select(item) {
  if (item.disabled) return
  emit('select', item.id)
  close()
}

function move(delta) {
  const list = enabledIndexes.value
  if (!list.length) return
  const current = list.indexOf(activeIndex.value)
  const next = current === -1 ? (delta > 0 ? 0 : list.length - 1) : (current + delta + list.length) % list.length
  activeIndex.value = list[next]
}

function onKeydown(event) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    move(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    move(-1)
  } else if (event.key === 'Home') {
    event.preventDefault()
    activeIndex.value = enabledIndexes.value[0] ?? -1
  } else if (event.key === 'End') {
    event.preventDefault()
    activeIndex.value = enabledIndexes.value.at(-1) ?? -1
  } else if (event.key === 'Enter' || event.key === ' ') {
    const item = props.items[activeIndex.value]
    if (item) {
      event.preventDefault()
      select(item)
    }
  } else if (event.key === 'Tab') {
    close()
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      ref="panelEl"
      class="hp-dropdown"
      :style="panelStyle"
      role="menu"
      :aria-label="ariaLabel || undefined"
      tabindex="-1"
      @keydown="onKeydown"
      @vue:mounted="panelEl?.focus()"
    >
      <template v-for="(item, i) in items" :key="item.id">
        <div v-if="item.separatorBefore && i > 0" class="hp-dropdown__separator"></div>
        <button
          type="button"
          class="hp-dropdown__item"
          :class="{
            'is-active': activeIndex === i,
            'is-danger': item.danger,
          }"
          role="menuitem"
          :disabled="item.disabled"
          @click="select(item)"
          @mousemove="activeIndex = item.disabled ? activeIndex : i"
        >
          {{ item.label }}
        </button>
      </template>
    </div>
  </Teleport>
</template>

<style scoped>
.hp-dropdown {
  position: fixed;
  z-index: 1000;
  padding: 4px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md, 0 8px 20px rgba(0, 0, 0, 0.12));
  outline: none;
}

.hp-dropdown__item {
  display: flex;
  width: 100%;
  align-items: center;
  height: 34px;
  padding: 0 10px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--font-size-sm);
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
}

.hp-dropdown__item:hover:not(:disabled),
.hp-dropdown__item.is-active:not(:disabled) {
  background: var(--teal-50);
  color: var(--teal-600);
}

.hp-dropdown__item.is-danger {
  color: var(--red);
}

.hp-dropdown__item.is-danger:hover:not(:disabled),
.hp-dropdown__item.is-danger.is-active:not(:disabled) {
  background: var(--red-bg);
  color: var(--red);
}

.hp-dropdown__item:disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.hp-dropdown__separator {
  height: 1px;
  margin: 4px 2px;
  background: var(--color-border);
}
</style>
