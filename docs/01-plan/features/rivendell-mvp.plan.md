# Plan: Rivendell MVP — 범용 사용 이력 수집 및 조회/내보내기 서비스

- 문서 버전: v1.0
- 작성일: 2026-03-11
- PDCA 단계: Plan
- 참조 문서:
  - `docs/prd_v1_1.md`
  - `docs/usage-log-service-wireframes.md`
  - `docs/design-sample/` (Google Stitch 디자인)

---

## 1. 목표 요약

**Rivendell**은 사내/개인 개발자가 자신의 툴·서비스 사용 이력을 손쉽게 수집하고, 웹 UI에서 표 형태로 조회하며, JSON/Excel로 내보낼 수 있는 **범용 로그 수집 서비스**다.

### 핵심 설계 원칙
- **무계정형(no-account)**: 로그인/회원가입 없이 `dataset_id + API key`로만 접근
- **Dataset 중심 멀티테넌트**: 공용 `events` 테이블을 `dataset_id`로 논리 분리
- **혼합형 스키마**: 고정 컬럼 + `dim1~10` + `metric1~3` + `payload_json`
- **키 기반 권한 분리**: `ingest_key`(쓰기 전용) / `admin_key`(읽기·관리 전용)

---

## 2. 제품 범위 (MVP)

### In-Scope

| # | 기능 | 설명 |
|---|------|------|
| 1 | 데이터셋 생성 | 이름·설명 입력 → `dataset_id`, `ingest_key`, `admin_key` 즉시 발급 |
| 2 | 이벤트 적재 API | `ingest_key`로 단건/배치 이벤트 REST 적재 |
| 3 | 데이터셋 접근 | `dataset_id + admin_key`로 대시보드 진입 |
| 4 | 이벤트 조회 테이블 | 필터·정렬·컬럼 선택 포함한 표 조회 |
| 5 | 이벤트 상세 Drawer | 개별 이벤트 payload JSON 확인 |
| 6 | JSON / Excel export | 현재 필터 기준 다운로드, 컬럼 alias 적용 |
| 7 | 컬럼 alias 관리 | `dim1~10`, `metric1~3` 표시명 변경 |
| 8 | 키 재발급 | 기존 키 폐기 후 신규 발급, `last_used_at` 추적 |
| 9 | KPI 요약 카드 | 총 이벤트 수, 7일 이벤트, 고유 actor 수, 마지막 적재 시각 |

### Out-of-Scope (MVP 제외)

- 사용자 로그인/회원가입/SSO
- 실시간 차트 고도화
- 데이터셋 간 조인·통합 분석
- 비동기 대용량 export, CSV export
- read-only key, 팀 공유·권한 관리

---

## 3. 기술 스택

| 레이어 | 기술 | 이유 |
|--------|------|------|
| Frontend + API | Next.js 15 App Router | UI와 REST API 단일 프로젝트 운영 |
| UI 컴포넌트 | shadcn/ui | 대시보드·테이블·설정 화면에 최적, Rivendell 디자인과 일치 |
| DB | SQLite | 초기 저용량 운영, 파일 단위 백업 |
| ORM | Drizzle ORM + better-sqlite3 | TypeScript 친화적, SQLite 경량 시작 |
| 유효성 검증 | Zod | 타입 안전 요청 검증 |
| Excel export | SheetJS (xlsx) | XLSX 생성 |
| 키 해시 | Node.js crypto (SHA-256 + salt) | 키 원문 미저장 |
| 배포 | Docker (Node.js self-hosting) | SQLite 파일 영속성 보장 |

---

## 4. 화면 구성 및 디자인 방향

Google Stitch 디자인에서 확정된 서비스명은 **Rivendell**이며, 다음 비주얼 방향을 따른다.

### 4.1 브랜딩
- 서비스명: **Rivendell**
- 주 색상: 딥 네이비/인디고 (`#1e1b8b` 계열)
- 스타일: B2B SaaS 관리형 UI, 정보 밀도 중간 이상, 테이블 중심
- 반응형: Desktop 우선, Tablet 대응, Mobile 최소 대응

### 4.2 화면 목록 (P0)

| 화면 | 경로 | 설명 |
|------|------|------|
| 랜딩 페이지 | `/` | Hero + 3-step 흐름 + CTA 2개 |
| 데이터셋 생성 | `/datasets/new` | 이름·설명 입력 + Advanced Settings accordion |
| 생성 완료 | `/datasets/new/success` | 키 표시 + Quick Start 코드 탭 |
| 데이터셋 접근 | `/access` | `dataset_id + admin_key` 입력 |
| 대시보드 | `/datasets/[id]` | KPI 카드 + 필터 바 + 이벤트 테이블 + 컬럼 선택 |
| 이벤트 상세 | Drawer (대시보드 위) | 공통 필드 + dim/metric + payload JSON |
| Export Modal | Modal (대시보드 위) | 포맷·범위·옵션 선택 |
| 데이터셋 설정 | `/datasets/[id]/settings` | Dataset Info + Column Aliases + Key Management + Danger Zone |

### 4.3 화면별 디자인 참조 (Google Stitch)

| 화면 | 참조 파일 |
|------|-----------|
| 랜딩 | `design-sample/minimal_landing_page_internal/` |
| 데이터셋 생성 | `design-sample/create_dataset/` |
| 생성 완료 | `design-sample/dataset_creation_success/` |
| 대시보드 | `design-sample/dashboard_with_column_customization/` |
| 설정 | `design-sample/dataset_settings/` |

---

## 5. 데이터 모델 요약

### 핵심 테이블

```
datasets          - 논리 데이터셋 단위
api_keys          - 키 해시 저장, key_type(ingest/admin), last_used_at
dataset_schema_fields - dim/metric alias 및 visible 설정
events            - 실제 이벤트 저장소 (dataset_id + 공통 필드 + dim1~10 + metric1~3 + payload_json)
dataset_access_logs   - 관리 감사 로그 (선택)
```

### 이벤트 스키마 핵심

```
고정: id, dataset_id, event_name, actor_id, session_id, source, status, occurred_at, received_at
슬롯: dim1~dim10 (text), metric1~metric3 (real)
JSON: payload_json (text)
```

---

## 6. API 설계 요약

```
POST   /api/v1/datasets                       데이터셋 생성 (no-auth)
GET    /api/v1/datasets/:id                   데이터셋 조회 (admin_key)
PATCH  /api/v1/datasets/:id/schema            alias 설정 (admin_key)
POST   /api/v1/datasets/:id/keys/rotate       키 재발급 (admin_key)
POST   /api/v1/ingest/events                  이벤트 적재 (ingest_key)
GET    /api/v1/datasets/:id/events            이벤트 조회 (admin_key)
GET    /api/v1/datasets/:id/export.json       JSON export (admin_key)
GET    /api/v1/datasets/:id/export.xlsx       Excel export (admin_key)
```

---

## 7. 보안 정책

- 키 원문은 발급 직후 1회만 노출, DB에는 SHA-256 해시+salt만 저장
- `dataset_id` 단독으로는 어떠한 데이터도 접근 불가
- `ingest_key`: 적재 전용 (조회/export/설정 불가)
- `admin_key`: 조회·export·설정 전용 (이벤트 적재 불가, 기본 정책)
- Rate limiting, 요청 크기 제한, export 행 수 제한 필수
- `last_used_at` 추적으로 이상 사용 탐지 기반 마련

---

## 8. 구현 우선순위

### Phase 1 — MVP (이번 구현 대상)

```
P0: DB 스키마 + Drizzle 마이그레이션
P0: 데이터셋 생성 API + UI
P0: ingest API (단건/배치)
P0: 데이터셋 접근 (admin_key 검증)
P0: 대시보드 (KPI + 이벤트 테이블 + 필터)
P0: JSON / Excel export
P0: 이벤트 상세 Drawer
P0: 설정 페이지 (alias + key 재발급)
```

### Phase 2 — 운영 편의 (추후)

```
P1: 컬럼 표시 설정 영속화
P1: 필터 URL query param 반영
P1: read-only key
P1: access log UI
```

---

## 9. 디렉터리 구조 (예정)

```
src/
  app/
    page.tsx                                  랜딩
    access/page.tsx                           데이터셋 접근
    datasets/
      new/page.tsx                            데이터셋 생성
      new/success/page.tsx                    생성 완료
      [datasetId]/page.tsx                    대시보드
      [datasetId]/settings/page.tsx           설정
    api/v1/
      datasets/route.ts
      ingest/events/route.ts
      datasets/[datasetId]/route.ts
      datasets/[datasetId]/events/route.ts
      datasets/[datasetId]/schema/route.ts
      datasets/[datasetId]/export.json/route.ts
      datasets/[datasetId]/export.xlsx/route.ts
      datasets/[datasetId]/keys/rotate/route.ts

  components/
    ui/                                       shadcn/ui
    dataset/                                  생성·접근 폼
    dashboard/                               KPI 카드, 필터 바, 이벤트 테이블
    event/                                   상세 Drawer, Export Modal
    settings/                                설정 섹션들

  db/
    client.ts
    schema.ts
    migrations/

  lib/
    auth/                                     키 해시·검증
    export/                                   JSON·XLSX 생성
    validation/                               Zod 스키마
    utils/
```

---

## 10. 위험 요소 및 대응

| 위험 | 대응 |
|------|------|
| SQLite 동시 쓰기 한계 | MVP 규모에서 충분, 향후 Postgres 전환 로드맵 확보 |
| 키 유출 | 해시 저장 + 재발급 기능 + last_used_at 추적 |
| 대용량 export 메모리 부담 | export 최대 행 수 제한 필수 (FR-042) |
| payload 민감정보 | 저장 금지 권고 문구 UI에 명시 |
| 무계정형 협업 한계 | MVP는 키 공유 허용, 리스크 명시, Phase 2에서 read-only key 검토 |

---

## 11. 오픈 이슈 (PRD 인계)

1. `read-only key`를 MVP에 포함할지 여부
2. `payload_json` export 기본 포맷: pretty string vs raw string
3. 대용량 export: 동기 vs 비동기 job
4. `actor_id` 개인식별정보 마스킹 정책
5. 데이터셋 생성 공개 범위: 완전 공개 vs 서비스 공용 비밀키 필요

---

## 12. 다음 단계

Plan 완료 후 Design 단계로 진행:
```
/pdca design rivendell-mvp
```

Design 문서에서 다룰 내용:
- 컴포넌트별 상세 인터페이스 명세
- DB 스키마 DDL (Drizzle)
- API 요청/응답 타입 정의
- 페이지별 상태 관리 전략
- 화면 흐름 및 에러 상태 처리
