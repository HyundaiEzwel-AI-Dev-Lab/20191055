import * as XLSX from 'xlsx'

/** 파일명용 타임스탬프 (YYYYMMDD_HHmm) */
function timestamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`
}

/** 셀 값을 엑셀용 문자열로 변환 */
export function excelCellValue(value) {
  if (value == null || value === '') return ''
  if (typeof value === 'boolean') return value ? 'Y' : 'N'
  if (typeof value === 'number') return value
  if (value instanceof Date) return value.toISOString().slice(0, 19).replace('T', ' ')
  if (Array.isArray(value)) {
    if (!value.length) return ''
    if (typeof value[0] === 'object') {
      return value
        .map((item) => item?.name || item?.label || item?.title || item?.id || '')
        .filter(Boolean)
        .join(', ')
    }
    return value.join(', ')
  }
  if (typeof value === 'object') {
    return value.name || value.label || value.title || JSON.stringify(value)
  }
  return value
}

/**
 * 인력×프로젝트 그룹 행을 평탄화
 * @param {object[]} records
 * @param {(person: object, project: object, index: number) => object} mapRow
 */
export function flattenPersonProjects(records, mapRow) {
  const out = []
  ;(records || []).forEach((person) => {
    const projects = person.projects?.length ? person.projects : [null]
    projects.forEach((project, index) => {
      out.push(mapRow(person, project, index))
    })
  })
  return out
}

/**
 * 컬럼 정의 + 행 데이터로 워크시트를 만들어 다운로드
 * @param {{ fileName?: string, sheetName?: string, columns?: {key:string,label:string,value?:Function}[], rows?: object[] }} options
 */
export function downloadExcel({
  fileName,
  sheetName = 'Sheet1',
  columns,
  rows = [],
} = {}) {
  const safeSheet = String(sheetName || 'Sheet1').slice(0, 31)
  const list = Array.isArray(rows) ? rows : []

  let cols = columns
  if (!cols?.length) {
    const keySet = new Set()
    list.forEach((row) => {
      if (row && typeof row === 'object') {
        Object.keys(row).forEach((k) => {
          if (typeof row[k] !== 'function' && k !== 'id') keySet.add(k)
        })
      }
    })
    cols = [...keySet].map((key) => ({ key, label: key }))
  }

  if (!cols.length) {
    cols = [{ key: '_empty', label: '내용' }]
  }

  const aoa = [
    cols.map((c) => c.label),
    ...list.map((row) =>
      cols.map((c) => {
        if (c.key === '_empty') return '조회된 데이터가 없습니다.'
        if (typeof c.value === 'function') return excelCellValue(c.value(row))
        return excelCellValue(row?.[c.key])
      }),
    ),
  ]

  if (list.length === 0) {
    aoa.push(cols.map((_, i) => (i === 0 ? '(데이터 없음)' : '')))
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = cols.map((c) => ({
    wch: Math.min(40, Math.max(10, String(c.label).length + 4)),
  }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, safeSheet)

  const name = (fileName || `${safeSheet}_${timestamp()}.xlsx`).replace(/[\\/:*?"<>|]/g, '_')
  const finalName = name.endsWith('.xlsx') ? name : `${name}.xlsx`
  XLSX.writeFile(wb, finalName)
}

/**
 * 화면별 엑셀 다운로드
 * @param {string} screenName 화면명(파일명·시트명)
 * @param {object[]|number} rowsOrCount 행 배열(권장) 또는 건수(레거시)
 * @param {{key:string,label:string,value?:Function}[]} [columns] 컬럼 정의
 */
export function mockExcelDownload(screenName, rowsOrCount, columns) {
  const rows = Array.isArray(rowsOrCount) ? rowsOrCount : []
  downloadExcel({
    fileName: `${screenName}_${timestamp()}.xlsx`,
    sheetName: screenName,
    columns,
    rows,
  })
}
