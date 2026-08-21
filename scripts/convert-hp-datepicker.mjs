import fs from 'fs'
import { execSync } from 'child_process'

const hPmsRoot = execSync(
  'find "/Users/parkyoungmin/Desktop" -maxdepth 3 -type d -name "h-pms" 2>/dev/null | head -1',
  { encoding: 'utf8' },
).trim()
const src = fs.readFileSync(`${hPmsRoot}/frontend/src/shared/ui/HpDatePicker.vue`, 'utf8')

const scriptStart = src.indexOf('<script setup lang="ts">') + '<script setup lang="ts">'.length
const scriptEnd = src.indexOf('</script>')
const templateStart = src.indexOf('<template>', scriptEnd) + '<template>'.length
const templateEnd = src.lastIndexOf('</template>')
const styleStart = src.indexOf('<style scoped>', templateEnd) + '<style scoped>'.length
const styleEnd = src.lastIndexOf('</style>')

let script = src.slice(scriptStart, scriptEnd)
const templateInner = src.slice(templateStart, templateEnd)
const styleInner = src.slice(styleStart, styleEnd)

script = script.replace(/import type \{[^}]+\} from '[^']+'\n/g, '')
script = script.replace(/export interface [\s\S]*?\n\}\n\n/g, '')
script = script.replace(
  /const props = withDefaults\([\s\S]*?\)\s*\n\nconst emit = defineEmits<\{ 'update:modelValue': \[string\] \}>\(\)/,
  `const props = withDefaults(
  defineProps({
    modelValue: { type: String, default: '' },
    min: { type: String, default: '' },
    max: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    inputClass: { type: String, default: '' },
    ariaLabel: { type: String, default: '' },
    elevated: { type: Boolean, default: false },
    granularity: { type: String, default: 'day' },
  }),
  { min: '', max: '', disabled: false, inputClass: '', ariaLabel: '', elevated: false, granularity: 'day' },
)

const emit = defineEmits(['update:modelValue'])`,
)
script = script.replace(/ref<[^>]+>/g, 'ref')
script = script.replace(/computed<[^>]+>/g, 'computed')
script = script.replace(/ as [A-Za-z0-9_|<>[\]'\" ]+/g, '')
script = script.replace(/\)\s*:\s*\{[^}]+\}\s*\{/g, ') {')
script = script.replace(/\)\s*:\s*[^{;\n]+\{/g, ') {')
script = script.replace(/^function ([a-zA-Z0-9_]+)\(([^)]*)\)/gm, (_, name, params) => {
  const cleaned = params
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.replace(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*.+$/, '$1'))
    .join(', ')
  return `function ${name}(${cleaned})`
})

const out =
  `<script setup>${script}</script>\n\n` +
  `<template>${templateInner}</template>\n\n` +
  `<style scoped>${styleInner}</style>\n`

fs.writeFileSync('src/shared/ui/HpDatePicker.vue', out)
console.log('HpDatePicker converted')
