import { createRouter, createWebHistory } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import { showProjectRegisterModal } from '@/composables/useProjectRegister'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '로그인' },
  },
  {
    path: '/',
    redirect: '/login',
  },

  // 대시보드 (통합)
  {
    path: '/dashboard/main',
    name: 'main-dashboard',
    component: () => import('@/views/MainDashboardView.vue'),
    meta: { title: '전체 프로젝트 현황' },
  },
  {
    path: '/dashboard/performance',
    name: 'performance',
    component: () => import('@/views/PerformanceView.vue'),
    meta: { title: '실적관리' },
  },
  {
    path: '/dashboard/tech-resource',
    name: 'tech-resource',
    component: () => import('@/views/TechResourceView.vue'),
    meta: { title: '테크 리소스관리' },
  },

  // 내업무
  {
    path: '/inbox',
    name: 'inbox',
    component: () => import('@/views/InboxView.vue'),
    meta: { title: '내업무' },
  },

  // 통합관리
  {
    path: '/integrated/project/register',
    name: 'project-register',
    redirect: () => {
      showProjectRegisterModal.value = true
      return '/inbox'
    },
  },
  {
    path: '/integrated/project/status',
    name: 'project-status',
    component: () => import('@/views/ProjectStatusView.vue'),
    meta: { title: '프로젝트 현황' },
  },
  {
    path: '/integrated/project/history',
    name: 'project-history',
    component: () => import('@/views/ProjectHistoryView.vue'),
    meta: { title: '프로젝트 변경이력' },
  },
  {
    path: '/integrated/test-library',
    name: 'test-library',
    component: () => import('@/views/TestCaseView.vue'),
    meta: { title: '테스트 라이브러리' },
  },

  // 시스템관리
  {
    path: '/admin/users',
    name: 'user-mgmt',
    component: () => import('@/views/UserMgmtView.vue'),
    meta: { title: '사용자 관리' },
  },
  {
    path: '/admin/approval',
    name: 'approval',
    component: () => import('@/views/ApprovalView.vue'),
    meta: { title: '신청승인 관리' },
  },
  {
    path: '/admin/menus',
    name: 'menu-mgmt',
    component: () => import('@/views/MenuMgmtView.vue'),
    meta: { title: '화면(메뉴) 관리' },
  },
  {
    path: '/admin/common-code',
    name: 'common-code',
    component: () => import('@/views/CommonCodeView.vue'),
    meta: { title: '공통코드 관리' },
  },
  {
    path: '/admin/holiday',
    name: 'holiday-mgmt',
    component: () => import('@/views/HolidayMgmtView.vue'),
    meta: { title: '휴무일 관리' },
  },

  // 프로젝트 관리 (개별)
  {
    path: '/project/info',
    name: 'project-info',
    component: () => import('@/views/ProjectInfoView.vue'),
    meta: { title: '프로젝트 정보', requiresProject: true },
  },
  {
    path: '/project/history',
    name: 'project-history-detail',
    component: () => import('@/views/ProjectHistoryView.vue'),
    meta: { title: '프로젝트 변경이력', requiresProject: true },
  },
  {
    path: '/project/dashboard',
    name: 'project-dashboard',
    component: () => import('@/views/ProjectDashboardView.vue'),
    meta: { title: '프로젝트 대시보드', requiresProject: true },
  },
  {
    path: '/project/requirement',
    name: 'requirement',
    component: () => import('@/views/RequirementView.vue'),
    meta: { title: '요구사항 관리', requiresProject: true },
  },
  {
    path: '/project/wbs',
    name: 'wbs',
    component: () => import('@/views/WbsView.vue'),
    meta: { title: 'WBS 관리', requiresProject: true },
  },
  {
    path: '/project/unit-test',
    name: 'unit-test',
    component: () => import('@/views/UnitTestView.vue'),
    meta: { title: '단위테스트', requiresProject: true },
  },
  {
    path: '/project/scenario/:mode(dev|uat)',
    name: 'scenario',
    component: () => import('@/views/ScenarioView.vue'),
    meta: { title: '테스트시나리오', requiresProject: true },
  },
  {
    path: '/project/scenario/:mode(dev|uat)/edit',
    name: 'scenario-edit',
    component: () => import('@/views/ScenarioEditView.vue'),
    meta: { title: '시나리오편집', requiresProject: true },
  },
  {
    path: '/project/test-run',
    redirect: '/project/test-run/dev',
  },
  {
    path: '/project/test-run/:mode(dev|uat)',
    name: 'test-run',
    component: () => import('@/views/TestRunView.vue'),
    meta: { title: '테스트 수행', requiresProject: true },
  },
  {
    path: '/project/defect/:mode(dev|uat)',
    name: 'defect',
    component: () => import('@/views/DefectView.vue'),
    meta: { title: '결함관리', requiresProject: true },
  },
  {
    path: '/project/progress/:mode(dev|uat)',
    name: 'progress',
    component: () => import('@/views/ProgressView.vue'),
    meta: { title: '진척관리', requiresProject: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  if (!to.meta.requiresProject) return true

  const projectStore = useProjectStore()
  if (!projectStore.requireProject()) return false

  const projectId = projectStore.currentProject?.id
  if (
    projectId &&
    projectStore.isRegistering(projectId) &&
    to.name !== 'project-info'
  ) {
    return '/project/info'
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} | H-PMS` : 'H-PMS'
})

export default router
