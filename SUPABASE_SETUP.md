# Supabase 연결 절차

1. Supabase에서 무료 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase-schema.sql` 내용을 실행합니다.
3. Project Settings > API에서 Project URL과 anon public key를 확인합니다.
4. 앱을 열면 기본 Supabase 정보로 자동 연결됩니다. 연결 정보를 바꿀 때는 `app.js`의 `DEFAULT_SUPABASE_CONFIG` 값을 수정합니다.
5. 첫 총관리자 계정은 앱에서 회원가입한 뒤 SQL Editor에서 한 번만 승인합니다.

## 이메일 인증 설정

이 앱은 총관리자가 가입자를 직접 승인하므로 Supabase 이메일 인증은 꺼두는 것을 권장합니다.

Supabase Dashboard에서:

1. `Authentication`으로 이동합니다.
2. `Providers` 또는 `Sign In / Providers`에서 `Email`을 엽니다.
3. `Email provider`를 켭니다.
4. `Email signups` 또는 `Allow new users to sign up`을 켭니다.
5. `Confirm email` 또는 `Enable email confirmations`는 끕니다.
6. 이미 가입한 사용자가 이메일 미확인 상태라면 Supabase `Authentication > Users`에서 사용자를 확인 처리하거나, 해당 사용자를 삭제한 뒤 다시 가입합니다.

이메일 인증을 계속 사용할 경우에는 `Authentication > URL Configuration`에서 `Site URL`과 `Redirect URLs`를 실제 배포 주소로 바꿔야 합니다. 기본값이 `localhost:3000`이면 인증 링크가 로컬 주소로 이동해 접속이 거부됩니다.

현재 앱에는 다음 프로젝트 정보가 기본값으로 들어가 있습니다.

- Project URL: `https://jitleoweloogqflgspnx.supabase.co`
- Anon key: 앱 코드에 입력됨

SQL Editor에서 `supabase-schema.sql`을 실행한 뒤 앱을 새로고침하면 Supabase DB로 자동 연결됩니다.

## 첫 총관리자 승인

첫 사용자가 앱에서 회원가입을 마친 뒤, Supabase SQL Editor에서 아래 SQL을 실행합니다. 이메일 주소는 실제 총관리자 이메일로 바꿉니다. 이 SQL은 `app_profiles` 행이 아직 없어도 먼저 만들어준 뒤 승인합니다.

```sql
insert into public.app_profiles (user_id, email, display_name, division_id, role, status, approved_at)
select
  users.id,
  users.email,
  coalesce(users.raw_user_meta_data ->> 'display_name', split_part(users.email, '@', 1)),
  coalesce(users.raw_user_meta_data ->> 'division_id', 'policyPlanningOffice'),
  'super_admin',
  'approved',
  now()
from auth.users
where users.email = 'admin@example.go.kr'
on conflict (user_id) do update
set status = 'approved',
    role = 'super_admin',
    approved_at = now(),
    updated_at = now();
```

그 다음부터는 총관리자가 앱 안의 `사용자 승인` 패널에서 가입자를 승인하고 권한을 부여하면 됩니다.

## 로그인이 안 될 때

- `Email signups are disabled`가 나오면 Supabase `Authentication > Providers > Email`에서 `Email provider`와 `Email signups`를 켜세요.
- 인증 메일 링크가 `localhost:3000`으로 열리면 Supabase `Authentication > Providers > Email`에서 이메일 확인을 끄거나, `Authentication > URL Configuration`의 Site URL을 실제 배포 주소로 바꾸세요.
- `이메일 확인이 완료되지 않았습니다`가 나오면 Supabase에서 보낸 인증 메일을 확인하거나, Supabase Dashboard > Authentication > Providers > Email에서 이메일 확인을 꺼주세요.
- `사용자 프로필을 찾을 수 없습니다`가 나오면 `supabase-schema.sql`을 다시 실행한 뒤 위의 첫 총관리자 승인 SQL을 다시 실행하세요.
- `이메일 또는 비밀번호가 맞지 않습니다`가 나오면 가입한 이메일과 비밀번호를 다시 확인하세요.

현재 SQL은 Supabase Auth와 RLS를 사용합니다. 승인된 사용자만 자기 국 일정을 볼 수 있고, 총관리자는 사용자 승인과 권한 부여를 할 수 있습니다.

## 자동 용량 정리

앱 접속 시 승인된 사용자가 있으면 `prune_old_schedule_data()` 함수가 자동 실행됩니다.

- 일정: 오늘 기준 14일 이전 데이터 삭제
- 변경 이력: 180일 이전 데이터 삭제

이 기준을 바꾸려면 `supabase-schema.sql`의 `prune_old_schedule_data()` 함수에서 `14 days`, `180 days` 값을 수정한 뒤 SQL Editor에서 다시 실행하면 됩니다.

운영 전 권장 보강 항목:

- 정기 백업
- 중요 이력 장기 보존이 필요하면 별도 백업 테이블 또는 다운로드 정책 추가
