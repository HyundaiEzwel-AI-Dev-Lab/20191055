<script setup>
// PAG-S-UAT-16 진척관리 (단위테스트 전용, A11)
import { computed, onMounted, ref } from 'vue'
import { getUnitTestProgressData } from '@/entities/unit-test/mock/unitTest'
import { donutStyle } from '@/entities/test-progress/mock/testProgress'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'
import { useAuthStore } from '@/app/stores/auth'

const authStore = useAuthStore()
const data = ref(null)

function loadData() {
  data.value = getUnitTestProgressData(authStore.user?.id)
}

onMounted(loadData)

const kpi = computed(() => data.value?.kpi)

function onExcelDownload() {
  mockExcelDownload('단위테스트_진척관리_시스템별', data.value?.systemDetail || [], [
    { key: 'system', label: '시스템' },
    { key: 'total', label: '총건수' },
    { key: 'done', label: '완료' },
    { key: 'progressRate', label: '진행률(%)' },
    { key: 'defects', label: '결함건수' },
  ])
}
</script>

<template>
  <div class="progress-page" v-if="data">
    <div class="head">
      <h1 class="title">진척 관리 (단위테스트)</h1>
      <span class="updated">최종 업데이트 {{ data.updatedAt }}</span>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card card">
        <div class="kpi-card__head">
          <span class="kpi-card__ico">📋</span>
          <span>전체 케이스</span>
        </div>
        <div class="kpi-card__val">{{ kpi.total }}건</div>
        <div class="kpi-card__sub">수행완료 {{ kpi.done }}건</div>
      </div>
      <div class="kpi-card card">
        <div class="kpi-card__head">
          <span class="kpi-card__ico" :style="donutStyle(kpi.progressRate)"></span>
          <span>진행률</span>
        </div>
        <div class="kpi-card__val">{{ kpi.progressRate }}%</div>
        <div class="kpi-card__sub">{{ kpi.done }}/{{ kpi.total }}건</div>
      </div>
      <div class="kpi-card card">
        <div class="kpi-card__head">
          <span class="kpi-card__ico">🐞</span>
          <span>결함건수</span>
        </div>
        <div class="kpi-card__val">{{ kpi.defectTotal }}건</div>
        <div class="kpi-card__sub">처리완료 {{ kpi.defectFixed }}건</div>
      </div>
      <div class="kpi-card card">
        <div class="kpi-card__head">
          <span class="kpi-card__ico" :style="donutStyle(kpi.defectFixRate, 'var(--teal-400)')"></span>
          <span>결함처리율</span>
        </div>
        <div class="kpi-card__val">{{ kpi.defectFixRate }}%</div>
      </div>
    </div>

    <section class="card section">
      <h3 class="section__title">시스템별 진척현황</h3>
      <table class="tbl">
        <thead>
          <tr>
            <th>시스템</th>
            <th>총건수</th>
            <th>완료</th>
            <th>진행률</th>
            <th>결함건수</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data.systemDetail" :key="row.system">
            <td>{{ row.system }}</td>
            <td>{{ row.total }}</td>
            <td>{{ row.done }}</td>
            <td>{{ row.progressRate }}%</td>
            <td>{{ row.defects }}</td>
          </tr>
          <tr v-if="!data.systemDetail.length">
            <td colspan="5" class="empty">데이터가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="card section">
      <div class="section__head">
        <h3 class="section__title">담당자별 수행현황</h3>
        <ExcelDownloadButton @click="onExcelDownload" />
      </div>
      <table class="tbl">
        <thead>
          <tr>
            <th>담당자</th>
            <th>배정</th>
            <th>완료</th>
            <th>진행률</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data.byTester" :key="row.name">
            <td>{{ row.name }}</td>
            <td>{{ row.assigned }}</td>
            <td>{{ row.done }}</td>
            <td>{{ row.rate }}%</td>
          </tr>
          <tr v-if="!data.byTester.length">
            <td colspan="4" class="empty">데이터가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.progress-page {
  padding: 14px 18px 28px;
  color: var(--ink);
}

.head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
}

.title {
  margin: 0;
  font-size: calc(19px + var(--font-size-offset, 0px));
  font-weight: 800;
}

.updated {
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.kpi-card {
  padding: 14px 16px;
}

.kpi-card__head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--muted);
  margin-bottom: 8px;
}

.kpi-card__ico {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: inline-block;
}

.kpi-card__val {
  font-size: calc(22px + var(--font-size-offset, 0px));
  font-weight: 800;
}

.kpi-card__sub {
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
  margin-top: 2px;
}

.section {
  padding: 16px;
  margin-bottom: 16px;
}

.section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.section__title {
  margin: 0 0 10px;
  font-size: calc(14px + var(--font-size-offset, 0px));
  font-weight: 700;
}

.section__head .section__title {
  margin-bottom: 0;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
}

.tbl th,
.tbl td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--line);
  text-align: left;
}

.tbl th {
  color: var(--ink);
  font-weight: 600;
  background: var(--field);
}

.empty {
  text-align: center;
  color: var(--muted);
  padding: 20px !important;
}
</style>
