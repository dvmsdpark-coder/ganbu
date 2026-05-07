# Supabase 연결 절차

1. Supabase에서 무료 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase-schema.sql` 내용을 실행합니다.
3. Project Settings > API에서 Project URL과 anon public key를 확인합니다.
4. 앱을 열면 기본 Supabase 정보로 자동 연결됩니다. 연결 정보를 바꿀 때는 `app.js`의 `DEFAULT_SUPABASE_CONFIG` 값을 수정합니다.

현재 앱에는 다음 프로젝트 정보가 기본값으로 들어가 있습니다.

- Project URL: `https://jitleoweloogqflgspnx.supabase.co`
- Anon key: 앱 코드에 입력됨

SQL Editor에서 `supabase-schema.sql`을 실행한 뒤 앱을 새로고침하면 Supabase DB로 자동 연결됩니다.

현재 SQL은 시험 운영용 정책입니다. anon key만 있으면 등록과 수정이 가능하도록 열어둔 상태라, 실제 운영 전에는 Supabase Auth와 국별 RLS 정책으로 바꿔야 합니다.

운영 전 권장 보강 항목:

- 사용자 로그인
- 사용자별 소속 국 저장
- 국별 조회/수정 제한 RLS
- 관리자만 장관·차관·실장 일정 수정 가능하도록 서버 검증
- 정기 백업
- 변경 이력 삭제 금지
