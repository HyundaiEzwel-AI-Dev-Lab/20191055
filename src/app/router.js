import { createRouter, createWebHistory } from 'vue-router'
import { useProjectStore } from '@/app/stores/project'
import { showProjectRegisterModal } from '@/app/composables/useProjectRegister'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/auth/LoginView.vue'),
    meta: { title: '로그인' },
  },
  {
    path: '/',
    redirect: '/login',
  },

  // 대시보드 (통합)
  {
    path: '/integrated/dashboard/main',
    name: 'main-dashboard',
    component: () => import('@/pages/integrated/dashboard/MainDashboardView.vue'),
    meta: { title: '전체 프로젝트 현황' },
  },
  {
    path: '/integrated/dashboard/performance',
    name: 'performance',
    component: () => import('@/pages/integrated/dashboard/PerformanceView.vue'),
    meta: { title: '실적관리' },
  },
  {
    path: '/integrated/dashboard/tech-resource',
    name: 'tech-resource',
    component: () => import('@/pages/integrated/dashboard/TechResourceView.vue'),
    meta: { title: '테크 리소스관리' },
  },

  // 내업무
  {
    path: '/integrated/my-work',
    name: 'my-work',
    component: () => import('@/pages/integrated/my-work/InboxView.vue'),
    meta: { title: '내업무' },
  },

  // 통합관리
  {
    path: '/integrated/project/register',
    name: 'project-register',
    redirect: () => {
      showProjectRegisterModal.value = true
      return '/integrated/my-work'
    },
  },
  {
    path: '/integrated/project/status',
    name: 'project-status',
    component: () => import('@/pages/integrated/project-status/ProjectStatusView.vue'),
    meta: { title: '프로젝트 현황' },
  },
  {
    path: '/integrated/project/history',
    name: 'project-history',
    component: () => import('@/pages/workspace/info/ProjectHistoryView.vue'),
    meta: { title: '프로젝트 변경이력' },
  },
  {
    path: '/integrated/test-library',
    name: 'test-library',
    component: () => import('@/pages/integrated/test-library/TestCaseView.vue'),
    meta: { title: '테스트 라이브러리' },
  },

  // 시스템관리
  {
    path: '/system/users',
    name: 'user-mgmt',
    component: () => import('@/pages/system/user-mgmt/UserMgmtView.vue'),
    meta: { title: '사용자 관리' },
  },
  {
    path: '/system/approval',
    name: 'approval',
    component: () => import('@/pages/system/approval/ApprovalView.vue'),
    meta: { title: '신청승인 관리' },
  },
  {
    path: '/system/menus',
    name: 'menu-mgmt',
    component: () => import('@/pages/system/menu-mgmt/MenuMgmtView.vue'),
    meta: { title: '화면(메뉴) 관리' },
  },
  {
    path: '/system/common-code',
    name: 'common-code',
    component: () => import('@/pages/system/common-code/CommonCodeView.vue'),
    meta: { title: '공통코드 관리' },
  },
  {
    path: '/system/holiday',
    name: 'holiday-mgmt',
    component: () => import('@/pages/system/holiday/HolidayMgmtView.vue'),
    meta: { title: '휴무일 관리' },
  },
  {
    path: '/system/org-mgmt',
    name: 'org-mgmt',
    component: () => import('@/pages/system/org-mgmt/OrgMgmtView.vue'),
    meta: { title: '조직 관리' },
  },

  // 프로젝트 관리 (개별) — /workspace/*
  {
    path: '/workspace/info',
    name: 'project-info',
    component: () => import('@/pages/workspace/info/ProjectInfoView.vue'),
    meta: { title: '프로젝트 정보', requiresProject: true },
  },
  {
    path: '/workspace/history',
    name: 'project-history-detail',
    component: () => import('@/pages/workspace/info/ProjectHistoryView.vue'),
    meta: { title: '프로젝트 변경이력', requiresProject: true },
  },
  {
    path: '/workspace/dashboard',
    name: 'project-dashboard',
    component: () => import('@/pages/workspace/dashboard/ProjectDashboardView.vue'),
    meta: { title: '프로젝트 대시보드', requiresProject: true },
  },
  {
    path: '/workspace/requirement',
    name: 'requirement',
    component: () => import('@/pages/workspace/requirement/RequirementView.vue'),
    meta: { title: '요구사항 관리', requiresProject: true },
  },
  {
    path: '/workspace/wbs',
    name: 'wbs',
    component: () => import('@/pages/workspace/wbs/WbsView.vue'),
    meta: { title: 'WBS 관리', requiresProject: true },
  },
  {
    path: '/workspace/unit-test',
    name: 'unit-test',
    component: () => import('@/pages/workspace/unit-test/UnitTestView.vue'),
    meta: { title: '단위테스트', requiresProject: true },
  },
  {
    path: '/workspace/unit-test/progress',
    name: 'unit-test-progress',
    component: () => import('@/pages/workspace/unit-test/UnitTestProgressView.vue'),
    meta: { title: '진척관리', requiresProject: true },
  },
  {
    path: '/workspace/test/:mode(dev|uat)/scenario',
    name: 'scenario',
    component: () => import('@/pages/workspace/test/scenario/ScenarioView.vue'),
    meta: { title: '테스트시나리오', requiresProject: true },
  },
  {
    path: '/workspace/test/:mode(dev|uat)/scenario/edit',
    name: 'scenario-edit',
    component: () => import('@/pages/workspace/test/scenario/ScenarioEditView.vue'),
    meta: { title: '시나리오편집', requiresProject: true },
  },
  {
    path: '/workspace/test/perform',
    redirect: '/workspace/test/dev/perform',
  },
  {
    path: '/workspace/test/:mode(dev|uat)/perform',
    name: 'test-run',
    component: () => import('@/pages/workspace/test/perform/TestRunView.vue'),
    meta: { title: '테스트 수행', requiresProject: true },
  },
  {
    path: '/workspace/test/:mode(dev|uat)/defects',
    name: 'defect',
    component: () => import('@/pages/workspace/test/defects/DefectView.vue'),
    meta: { title: '결함관리', requiresProject: true },
  },
  {
    path: '/workspace/test/:mode(dev|uat)/progress',
    name: 'progress',
    component: () => import('@/pages/workspace/test/progress/ProgressView.vue'),
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
    return '/workspace/info'
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} | H-PMS` : 'H-PMS'
})

export default router
