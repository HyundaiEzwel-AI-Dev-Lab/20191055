// 로그인(PAG-M-COM-02) / 비밀번호 재설정(POP-M-COM-03) 검증용 목업 데이터
// status: active(정상) | locked(잠금) | leave(휴직) | retired(퇴직)
// id: 임직원은 사번, 외주는 웹메일 ID 형식

export const mockUsers = [
  {
    id: '2024001',
    password: 'Ezwel123!',
    name: '김현대',
    phone: '01012345678',
    status: 'active',
    failCount: 0,
    dept: 'IT기획팀',
    email: '2024001@ezwel.com',
    role: '개발자',
    position: '책임',
  },
  {
    id: 'partner.park@ezwel.com',
    password: 'Partner1!',
    name: '박외주',
    phone: '01023456789',
    status: 'active',
    failCount: 0,
  },
  {
    id: '2024002',
    password: 'Ezwel123!',
    name: '최잠금',
    phone: '01034567890',
    status: 'locked',
    failCount: 0,
  },
  {
    id: '2024003',
    password: 'Ezwel123!',
    name: '이휴직',
    phone: '01045678901',
    status: 'leave',
    failCount: 0,
  },
  {
    id: '2024004',
    password: 'Ezwel123!',
    name: '정퇴직',
    phone: '01056789012',
    status: 'retired',
    failCount: 0,
  },
  {
    id: '2024005',
    password: 'Ezwel123!',
    name: '오차단',
    phone: '01067890123',
    status: 'active',
    failCount: 5,
  },
]

export function findUserById(id) {
  return mockUsers.find((u) => u.id === id)
}

// 비밀번호 재설정: 이름 + 사번/ID + 휴대전화 일치 여부 체크
export function findUserForReset({ name, empId, phone }) {
  return mockUsers.find((u) => u.id === empId && u.name === name && u.phone === phone)
}
