# 4단계 결과: 회원 탈퇴

## 완료 항목 (1단계에서 통합 구현)

### API: `DELETE /api/account/delete` (`app/api/account/delete/route.ts`)
- Supabase Auth로 사용자 인증 확인
- Supabase Admin API (`auth.admin.deleteUser`)로 `auth.users` 삭제
- CASCADE로 `public.users`, `generations`, `subscriptions` 자동 삭제
- 삭제 후 `supabase.auth.signOut()` 호출
- **TODO**: Stripe 연동 시 활성 구독 먼저 취소 처리 필요

### UI: 계정 탭 - 회원 탈퇴
- **위험 영역 카드**: 빨간색 테두리, 경고 아이콘
- **안내 문구**: 데이터 영구 삭제 및 복구 불가 안내
- **확인 모달**:
  - 이메일 주소 입력으로 본인 확인
  - 입력값이 현재 이메일과 일치해야 탈퇴 버튼 활성화
  - 배경 클릭 또는 취소 버튼으로 닫기
- 삭제 성공 시 홈페이지로 리다이렉트 (`/?deleted=1`)

## 보안 사항
- Service Role Key 사용 (서버 사이드에서만 접근)
- 이메일 확인으로 오조작 방지
- 세션 무효화 처리

## 빌드 상태
- ✅ `next build` 성공
