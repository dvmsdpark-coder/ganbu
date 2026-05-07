# Supabase 연결 절차

1. Supabase에서 무료 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase-schema.sql` 내용을 실행합니다.
3. Project Settings > API에서 Project URL과 anon public key를 확인합니다.
4. 앱을 열면 기본 Supabase 정보로 자동 연결됩니다. 연결 정보를 바꿀 때는 `app.js`의 `DEFAULT_SUPABASE_CONFIG` 값을 수정합니다.
5. 첫 총관리자 계정은 앱에서 회원가입한 뒤 SQL Editor에서 한 번만 승인합니다.

현재 앱에는 다음 프로젝트 정보가 기본값으로 들어가 있습니다.

- Project URL: `https://jitleoweloogqflgspnx.supabase.co`
- Anon key: 앱 코드에 입력됨

SQL Editor에서 `supabase-schema.sql`을 실행한 뒤 앱을 새로고침하면 Supabase DB로 자동 연결됩니다.

## 첫 총관리자 승인

첫 사용자가 앱에서 회원가입을 마친 뒤, Supabase SQL Editor에서 아래 SQL을 실행합니다. 이메일 주소는 실제 총관리자 이메일로 바꿉니다.

```sql
update public.app_profiles
set status = 'approved',
    role = 'super_admin',
    approved_at = now()
where email = 'admin@example.go.kr';
```

그 다음부터는 총관리자가 앱 안의 `사용자 승인` 패널에서 가입자를 승인하고 권한을 부여하면 됩니다.

현재 SQL은 Supabase Auth와 RLS를 사용합니다. 승인된 사용자만 자기 국 일정을 볼 수 있고, 총관리자는 사용자 승인과 권한 부여를 할 수 있습니다.

운영 전 권장 보강 항목:

- 정기 백업
- 변경 이력 삭제 금지
