---
feature: no-secure-mode
status: plan
created: 2026-04-01
---

# Plan: NO_SECURE_DATASETS 비보안 모드

## 배경 및 목적

현재 `/access` 페이지에서 데이터셋 대시보드 진입 시 admin_key를 반드시 입력해야 한다.
사내 시스템처럼 접근 자체가 제한된 환경에서는 키 입력이 불필요한 마찰로 작용한다.

`NO_SECURE_DATASETS=1` 환경변수를 설정하면 키 없이 데이터셋 목록을 바로 보고,
클릭만으로 대시보드에 진입할 수 있도록 한다.

## 목표 동작

| 환경 | `/access` 화면 | 대시보드 진입 |
|------|---------------|--------------|
| 기본 (보안 모드) | admin_key 입력 폼 | URL `?key=` 또는 쿠키 필수 |
| `NO_SECURE_DATASETS=1` | 전체 데이터셋 목록 카드 | 키 없이 바로 진입 |

## 구현 범위

### 1. Access 페이지 (`src/app/access/page.tsx`)
- Server Component에서 `process.env.NO_SECURE_DATASETS` 체크
- `=== "1"`이면 DB에서 전체 데이터셋(archived 제외) 조회 후 목록 렌더링
- 그 외에는 기존 `AccessForm` 유지

### 2. DatasetListView 컴포넌트 (신규)
- `src/components/dataset/DatasetListView.tsx`
- 데이터셋 카드 목록 + 각 카드를 클릭하면 `/datasets/[id]` 로 이동
- 카드에 표시: 이름, 설명, 생성일
- 데이터셋 없을 때 empty state 표시

### 3. 대시보드 페이지 (`src/app/datasets/[datasetId]/page.tsx`)
- `NO_SECURE_DATASETS=1`이면 adminKey 검증 건너뜀
- `adminKey`를 빈 문자열로 DashboardClient에 전달

### 4. API 라우트 인증 바이패스
DashboardClient가 클라이언트 측에서 호출하는 API들에서 `NO_SECURE_DATASETS=1` 시 키 검증 생략:
- `GET /api/v1/datasets/[id]`
- `GET /api/v1/datasets/[id]/events`
- `GET /api/v1/datasets/[id]/export.json`
- `GET /api/v1/datasets/[id]/export.xlsx`
- `GET /api/v1/datasets/[id]/schema`
- `PATCH /api/v1/datasets/[id]` (설정 변경 — 비보안 모드에서도 허용)
- `POST /api/v1/datasets/[id]/keys/rotate` (키 교체 — 비보안 모드에서도 허용)

### 5. 인증 바이패스 헬퍼 (신규)
- `src/lib/auth/noSecureMode.ts`
- `isNoSecureMode(): boolean` — `process.env.NO_SECURE_DATASETS === "1"`
- API 라우트에서 `if (isNoSecureMode()) return`으로 일관되게 사용

## 변경하지 않는 것

- 데이터 수집 API (`POST /api/v1/ingest/events`) — ingest_key 검증 유지
- 데이터셋 생성 API (`POST /api/v1/datasets`) — 변경 없음
- DB 스키마 변경 없음
- 기본(보안) 모드 동작 — 완전히 보존

## 파일 목록

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `src/lib/auth/noSecureMode.ts` | 신규 | `isNoSecureMode()` 헬퍼 |
| `src/components/dataset/DatasetListView.tsx` | 신규 | 데이터셋 목록 카드 UI |
| `src/app/access/page.tsx` | 수정 | 모드에 따른 조건부 렌더 |
| `src/app/datasets/[datasetId]/page.tsx` | 수정 | 비보안 모드 시 키 검증 스킵 |
| `src/app/api/v1/datasets/[datasetId]/route.ts` | 수정 | 인증 바이패스 |
| `src/app/api/v1/datasets/[datasetId]/events/route.ts` | 수정 | 인증 바이패스 |
| `src/app/api/v1/datasets/[datasetId]/export.json/route.ts` | 수정 | 인증 바이패스 |
| `src/app/api/v1/datasets/[datasetId]/export.xlsx/route.ts` | 수정 | 인증 바이패스 |
| `src/app/api/v1/datasets/[datasetId]/schema/route.ts` | 수정 | 인증 바이패스 |
| `src/app/api/v1/datasets/[datasetId]/keys/rotate/route.ts` | 수정 | 인증 바이패스 |

## 구현 순서

1. `isNoSecureMode()` 헬퍼 작성
2. `DatasetListView` 컴포넌트 작성
3. Access 페이지 수정 (조건부 렌더)
4. 대시보드 페이지 수정 (키 검증 스킵)
5. API 라우트 6개 인증 바이패스 적용
6. 빌드 확인 (`npm run build`)

## 고려 사항

- `NO_SECURE_DATASETS`는 서버 전용 env var (NEXT_PUBLIC_ 불필요)
- 비보안 모드에서 admin 작업(키 교체, 설정 변경, 아카이브)도 허용 — 사내 용도이므로 적절
- archived 데이터셋은 목록에서 제외 (`archivedAt IS NULL`)
