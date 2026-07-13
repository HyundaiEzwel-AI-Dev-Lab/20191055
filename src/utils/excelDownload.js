/** 목록 엑셀 다운로드 (목업) */
export function mockExcelDownload(screenName, count) {
  const countLine =
    count != null && count !== '' ? `\n조회된 ${count}건을 다운로드합니다.` : ''
  window.alert(`엑셀 다운로드\n${screenName}${countLine}`)
}
