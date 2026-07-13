/** LNB v2.3 메뉴 구성 (lnb-v2.html 기준) */

export const pinnedItem = {
  id: 'inbox',
  label: '내업무',
  route: '/inbox',
  name: 'inbox',
  icon: 'inbox',
}

export const integratedMenus = [
  {
    id: 'dashboard',
    label: '대시보드',
    icon: 'grid',
    children: [
      { label: '메인 대시보드', route: '/dashboard/main', name: 'main-dashboard' },
      { label: '실적 관리', route: '/dashboard/performance', name: 'performance' },
      { label: '테크 리소스 관리', route: '/dashboard/tech-resource', name: 'tech-resource' },
    ],
  },
  {
    id: 'project-status',
    label: '프로젝트 현황',
    icon: 'clipboard',
    children: [
      { label: '프로젝트 현황', route: '/integrated/project/status', name: 'project-status' },
      { label: '프로젝트 변경이력', route: '/integrated/project/history', name: 'project-history' },
    ],
  },
  {
    id: 'system',
    label: '시스템관리',
    icon: 'settings',
    children: [
      { label: '신청 승인 관리', route: '/admin/approval', name: 'approval' },
      { label: '화면(메뉴)관리', route: '/admin/menus', name: 'menu-mgmt' },
      { label: '공통코드 관리', route: '/admin/common-code', name: 'common-code' },
      { label: '테스트라이브러리', route: '/integrated/test-library', name: 'test-library' },
      { label: '사용자 관리', route: '/admin/users', name: 'user-mgmt' },
      { label: '휴무일 관리', route: '/admin/holiday', name: 'holiday-mgmt' },
    ],
  },
]

export const projectMenus = [
  {
    id: 'proj-dashboard',
    label: '대시보드',
    icon: 'chart',
    route: '/project/dashboard',
    name: 'project-dashboard',
  },
  {
    id: 'proj-info',
    label: '프로젝트 정보',
    icon: 'folder',
    children: [
      { label: '프로젝트 정보', route: '/project/info', name: 'project-info' },
      { label: '프로젝트 변경이력', route: '/project/history', name: 'project-history-detail' },
    ],
  },
  {
    id: 'requirement',
    label: '요구사항',
    icon: 'diamond',
    route: '/project/requirement',
    name: 'requirement',
  },
  {
    id: 'wbs',
    label: 'WBS',
    icon: 'wbs',
    route: '/project/wbs',
    name: 'wbs',
  },
  {
    id: 'unit-test',
    label: '단위테스트',
    icon: 'check',
    route: '/project/unit-test',
    name: 'unit-test',
  },
  {
    id: 'dev-test',
    label: 'DEV 테스트',
    icon: 'flask',
    children: [
      { label: '시나리오 관리', route: '/project/scenario/dev', name: 'scenario-dev' },
      { label: '테스트 수행', route: '/project/test-run/dev', name: 'test-run-dev' },
      { label: '결함 관리', route: '/project/defect/dev', name: 'defect-dev' },
      { label: '진척 관리', route: '/project/progress/dev', name: 'progress-dev' },
    ],
  },
  {
    id: 'uat-test',
    label: '운영 테스트',
    icon: 'monitor',
    children: [
      { label: '시나리오 관리', route: '/project/scenario/uat', name: 'scenario-uat' },
      { label: '결함 관리', route: '/project/defect/uat', name: 'defect-uat' },
      { label: '진척 관리', route: '/project/progress/uat', name: 'progress-uat' },
    ],
  },
]

export const registerRoute = '/integrated/project/register'
