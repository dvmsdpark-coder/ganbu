# Supabase 연결 절차

1. Supabase에서 무료 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase-schema.sql` 내용을 실행합니다.
3. Project Settings > API에서 Project URL과 anon public key를 확인합니다.
4. 앱 화면 왼쪽 `Supabase` 영역에 Project URL과 anon key를 입력하고 `연결`을 누릅니다.

현재 앱에는 다음 프로젝트 정보가 기본값으로 들어가 있습니다.

- Project URL: `https://jitleoweloogqflgspnx.supabase.co`
- Anon key: 앱 코드에 입력됨

연결 테스트 결과 `public.events` 테이블이 아직 없어 `PGRST205` 오류가 확인되었습니다. SQL Editor에서 `supabase-schema.sql`을 실행한 뒤 앱을 새로고침하면 Supabase DB로 연결됩니다.

현재 SQL은 시험 운영용 정책입니다. anon key만 있으면 등록과 수정이 가능하도록 열어둔 상태라, 실제 운영 전에는 Supabase Auth와 국별 RLS 정책으로 바꿔야 합니다.

운영 전 권장 보강 항목:

- 사용자 로그인
- 사용자별 소속 국 저장
- 국별 조회/수정 제한 RLS
- 관리자만 장관·차관·실장 일정 수정 가능하도록 서버 검증
- 정기 백업
- 변경 이력 삭제 금지
