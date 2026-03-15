# Design: admin-dashboard

## Overview
비밀번호 보호 기반의 관리자 대시보드. 전체 데이터셋 현황(이벤트 수, 마지막 이벤트 시간)을 한눈에 파악하고 데이터셋 삭제를 수행한다.

---

## 1. 파일 구조

```
src/
├── app/
│   ├── admin/
│   │   ├── layout.tsx                  # Admin 레이아웃 (공통 헤더/로그아웃)
│   │   ├── login/
│   │   │   └── page.tsx                # 비밀번호 로그인 폼
│   │   └── dashboard/
│   │       └── page.tsx                # 메인 대시보드 (Server Component)
│   └── api/
│       └── admin/
│           ├── login/
│           │   └── route.ts            # POST: 로그인 → 쿠키 발급
│           ├── logout/
│           │   └── route.ts            # POST: 로그아웃 → 쿠키 삭제
│           └── datasets/
│               ├── route.ts            # GET: 전체 데이터셋 + 통계
│               └── [id]/
│                   └── route.ts        # DELETE: 데이터셋 삭제
├── lib/
│   └── admin/
│       ├── auth.ts                     # 세션 토큰 생성/검증
│       └── queries.ts                  # 관리자 전용 DB 쿼리
└── middleware.ts                       # /admin/** 경로 보호
```

---

## 2. 인증 설계

### 환경변수
```
# .env.local
ADMIN_PASSWORD=your-secure-password
ADMIN_SESSION_SECRET=random-32-char-secret   # 세션 서명용
```

### 세션 토큰 구조
- 형식: HMAC-SHA256 서명 토큰 (JWT 불필요, 단순 구현)
- 페이로드: `{ role: "admin", exp: <unix_ts> }`
- 직렬화: `base64(payload) + "." + hmac(base64(payload), ADMIN_SESSION_SECRET)`
- 만료: 24시간

### 쿠키
```
Name:     admin_session
Value:    <signed_token>
HttpOnly: true
SameSite: Lax
Path:     /admin
MaxAge:   86400 (24시간)
```

### lib/admin/auth.ts
```typescript
export function createAdminToken(): string
export function verifyAdminToken(token: string): boolean
export function getAdminSession(cookies: ReadonlyRequestCookies): boolean
```

### middleware.ts 로직
```
요청 경로가 /admin/** 이면:
  쿠키 admin_session 존재 && verifyAdminToken() === true
    → 통과
  아니면 → /admin/login?redirect=<원래경로> 로 리다이렉트
/admin/login 은 보호에서 제외
/api/admin/** 은 쿠키 검증 (API 라우트 내부에서 처리)
```

---

## 3. API 설계

### POST /api/admin/login
**Request**
```json
{ "password": "string" }
```
**Logic**
1. `password === process.env.ADMIN_PASSWORD` 비교 (constant-time)
2. 일치하면 `createAdminToken()` → Set-Cookie
3. 불일치하면 401

**Response**
```json
// 200
{ "ok": true }

// 401
{ "ok": false, "error": "Invalid password" }
```

### POST /api/admin/logout
**Logic**: admin_session 쿠키 삭제 (MaxAge=0)

**Response**: `{ "ok": true }`

### GET /api/admin/datasets
**Auth**: 쿠키 검증

**Logic**: SQL 쿼리로 datasets + events 집계

**Response**
```json
{
  "ok": true,
  "data": {
    "summary": {
      "totalDatasets": 12,
      "totalEvents": 48320
    },
    "datasets": [
      {
        "id": "ds_01kkh6sx2kx3y6e36cttff07fx",
        "name": "My App Events",
        "description": "...",
        "createdAt": "2026-03-01T00:00:00Z",
        "eventCount": 1024,
        "lastEventAt": "2026-03-13T14:22:00Z"   // null if no events
      }
    ]
  }
}
```

**SQL (raw SQLite)**
```sql
SELECT
  d.id,
  d.name,
  d.description,
  d.created_at,
  COUNT(e.id)           AS event_count,
  MAX(e.occurred_at)    AS last_event_at
FROM datasets d
LEFT JOIN events e ON e.dataset_id = d.id
WHERE d.archived_at IS NULL
GROUP BY d.id
ORDER BY d.created_at DESC
```

### DELETE /api/admin/datasets/[id]
**Auth**: 쿠키 검증

**Logic**: 트랜잭션으로 cascade 삭제
1. `dataset_access_logs` WHERE dataset_id = id
2. `dataset_schema_fields` WHERE dataset_id = id
3. `api_keys` WHERE dataset_id = id
4. `events` WHERE dataset_id = id
5. `datasets` WHERE id = id

**Response**
```json
// 200
{ "ok": true }

// 404
{ "ok": false, "error": "Dataset not found" }
```

---

## 4. DB 쿼리 설계 (lib/admin/queries.ts)

```typescript
export interface AdminDatasetRow {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  eventCount: number;
  lastEventAt: string | null;
}

export interface AdminSummary {
  totalDatasets: number;
  totalEvents: number;
}

export function getAdminDatasetsWithStats(): {
  summary: AdminSummary;
  datasets: AdminDatasetRow[];
}

export function deleteDatasetCascade(id: string): boolean
// returns false if dataset not found
```

---

## 5. 페이지 설계

### /admin/login (page.tsx — Client Component)

**UI 구성**
```
┌─────────────────────────────────┐
│         Rivendell Admin         │
│                                 │
│  ┌───────────────────────────┐  │
│  │  🔒 Administrator Access  │  │
│  │                           │  │
│  │  Password                 │  │
│  │  [____________________]   │  │
│  │                           │  │
│  │  [     Sign In      ]     │  │
│  │                           │  │
│  │  ⚠ Invalid password       │  │ (오류 시)
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**동작**
- `POST /api/admin/login` 호출
- 성공 → `router.push("/admin/dashboard")`
- 실패 → 에러 메시지 인라인 표시

---

### /admin/dashboard (page.tsx — Server Component)

**UI 구성**
```
┌─────────────────────────────────────────────────────────┐
│  Rivendell Admin Dashboard          [Log out]           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │ 12           │  │ 48,320       │                     │
│  │ Total Datasets│  │ Total Events │                     │
│  └──────────────┘  └──────────────┘                     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Dataset Name    Events   Last Event   Created   │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ My App Events   1,024    2 days ago   Mar 1     │ 🗑 │
│  │ Analytics Test  320      just now     Mar 10    │ 🗑 │
│  │ Beta Users      0        —            Mar 12    │ 🗑 │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**상대 시간 포맷 규칙**
| 경과 시간 | 표시 |
|----------|------|
| < 1분    | just now |
| < 1시간  | N minutes ago |
| < 24시간 | N hours ago |
| < 7일    | N days ago |
| >= 7일   | MMM D, YYYY |
| null     | — |

**삭제 흐름**
1. 🗑 버튼 클릭 → `<AlertDialog>` 표시 (데이터셋 이름 + 이벤트 수 경고)
2. 확인 → `DELETE /api/admin/datasets/[id]` 호출
3. 성공 → `router.refresh()` (Server Component 재렌더)
4. 실패 → toast 에러

---

### /admin/layout.tsx

```typescript
// Server Component
// 쿠키 검증 (미들웨어가 처리하지만 레이아웃에서도 이중 확인)
// 공통 헤더: "Rivendell Admin" + Logout 버튼
export default function AdminLayout({ children }) { ... }
```

---

## 6. 컴포넌트 구조

```
app/admin/dashboard/page.tsx          Server Component
  └─ AdminDashboardClient.tsx         Client Component (삭제 버튼, dialog)
       ├─ SummaryCards                요약 카드 (datasets 수, events 수)
       ├─ DatasetTable                테이블 본체
       │    └─ DatasetRow (반복)      행 1개: 이름/카운트/시간/삭제버튼
       └─ DeleteConfirmDialog         AlertDialog (shadcn/ui)
```

---

## 7. 미들웨어 설계 (middleware.ts)

> 기존 `middleware.ts`가 없으면 신규 생성. 있으면 matcher 추가.

```typescript
// src/middleware.ts
export const config = {
  matcher: ["/admin/:path*"],
};

export function middleware(request: NextRequest) {
  // /admin/login 은 통과
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();

  const token = request.cookies.get("admin_session")?.value;
  if (!token || !verifyAdminToken(token)) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}
```

---

## 8. 구현 순서

1. **환경변수 추가** — `.env.local` + `.env.example`에 `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`
2. **lib/admin/auth.ts** — 토큰 생성/검증 유틸
3. **lib/admin/queries.ts** — DB 쿼리 (집계 + cascade 삭제)
4. **middleware.ts** — `/admin/**` 보호
5. **POST /api/admin/login** — 로그인 API
6. **POST /api/admin/logout** — 로그아웃 API
7. **GET /api/admin/datasets** — 목록 API
8. **DELETE /api/admin/datasets/[id]** — 삭제 API
9. **app/admin/login/page.tsx** — 로그인 UI
10. **app/admin/layout.tsx** — 공통 레이아웃
11. **app/admin/dashboard/page.tsx** + **AdminDashboardClient.tsx** — 대시보드 UI

---

## 9. 의존성

신규 패키지 없음. 기존 스택으로 구현:
- shadcn/ui `AlertDialog` — 삭제 확인 (이미 설치됨 확인 필요)
- shadcn/ui `Card`, `Table`, `Button` — UI 컴포넌트
- `crypto` (Node.js 내장) — HMAC 서명

---

## 10. 보안 고려사항

- 비밀번호 비교: `crypto.timingSafeEqual()` 사용 (타이밍 공격 방지)
- 세션 토큰: HMAC-SHA256 서명, HttpOnly 쿠키
- API 라우트: 모든 `/api/admin/**`에서 쿠키 검증 수행
- ADMIN_PASSWORD 미설정 시: 서버 시작 시 경고 로그 + 모든 로그인 거부
