# Rivendell

범용 사용 이력 수집 및 조회/내보내기 서비스.

계정 없이 **데이터셋 ID + API 키** 만으로 이벤트를 수집하고, 대시보드에서 조회·필터·내보내기까지 할 수 있습니다.

---

## 주요 기능

- **이벤트 수집** — REST API로 단건/배치(최대 500개) 전송
- **대시보드** — KPI 카드, 필터, 페이지네이션, payload JSON 뷰어
- **내보내기** — JSON / Excel(.xlsx) 다운로드, 필터 연동
- **설정** — 컬럼 별칭, API 키 교체, 위험 구역(아카이브·전체 삭제)
- **API 도움말** — curl / JavaScript / Python 예제 내장

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| UI | Tailwind CSS v4, shadcn/ui |
| DB | SQLite + Drizzle ORM + better-sqlite3 |
| 유효성 검사 | Zod v4 |
| 내보내기 | SheetJS (xlsx) |
| ID 생성 | ULID |
| 컨테이너 | Docker + docker-compose |

---

## 빠른 시작

### 로컬 실행

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 에서 KEY_SALT_SECRET 값을 반드시 변경하세요

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### Docker

```bash
cd docker
docker-compose up -d
```

기본 포트: `3000`

---

## 환경변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `PORT` | 서버 포트 | `3000` |
| `DATABASE_URL` | SQLite DB 파일 경로 | `./data/rivendell.db` |
| `KEY_SALT_SECRET` | API 키 HMAC 서명 시크릿 (32자 이상 권장) | — |
| `EXPORT_MAX_ROWS` | 내보내기 최대 행 수 | `10000` |
| `NEXT_PUBLIC_BASE_URL` | 도움말 코드 예시에 표시될 서버 주소 | `https://your-host.com` |

> ⚠️ `KEY_SALT_SECRET` 은 운영 환경에서 반드시 강력한 랜덤 값으로 설정하세요. 변경 시 기존 API 키가 모두 무효화됩니다.

---

## API 개요

### 인증

| 키 종류 | 접두사 | 용도 |
|---------|--------|------|
| 수집 키 | `ing_...` | 이벤트 수집 전용 |
| 관리자 키 | `adm_...` | 조회·내보내기·설정 |

모든 요청은 `Authorization: Bearer <key>` 헤더를 사용합니다.

---

### 이벤트 수집

```
POST /api/v1/ingest/events
Authorization: Bearer ing_...
```

```json
{
  "dataset_id": "ds_xxxx",
  "events": [
    {
      "event_name": "purchase",
      "actor_id": "user_123",
      "source": "web",
      "status": "success",
      "dim1": "home",
      "metric1": 49900,
      "payload": { "product_id": "prod_001" }
    }
  ]
}
```

- 한 번의 요청으로 최대 **500개** 이벤트 전송 가능
- 개별 이벤트 실패 시 나머지는 정상 저장

---

### 이벤트 조회

```
GET /api/v1/datasets/{dataset_id}/events
Authorization: Bearer adm_...
```

| 파라미터 | 설명 | 기본값 |
|----------|------|--------|
| `from` | 시작 시각 (ISO 8601) | — |
| `to` | 종료 시각 (ISO 8601) | — |
| `event_name` | 이벤트 이름 정확 일치 | — |
| `actor_id` | 액터 ID 정확 일치 | — |
| `source` | 소스 정확 일치 | — |
| `status` | 상태 정확 일치 | — |
| `dim_col` | 검색할 dim 컬럼 (`dim1`~`dim10`) | — |
| `dim_val` | dim 컬럼 부분 일치 검색값 | — |
| `page` | 페이지 번호 | `1` |
| `page_size` | 페이지당 항목 수 (최대 200) | `50` |

---

### 내보내기

```
GET /api/v1/datasets/{dataset_id}/export.json
GET /api/v1/datasets/{dataset_id}/export.xlsx
Authorization: Bearer adm_...
```

조회 파라미터와 동일한 필터 사용 가능. 추가 파라미터:

| 파라미터 | 설명 | 기본값 |
|----------|------|--------|
| `include_payload` | payload_json 컬럼 포함 여부 | `false` |
| `visible_only` | 표시 설정된 컬럼만 포함 | `true` |

---

## 이벤트 필드

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `event_name` | string | ✅ | 이벤트 이름 |
| `actor_id` | string | | 행위자 ID |
| `session_id` | string | | 세션 ID |
| `source` | string | | 발생 소스 (web, app 등) |
| `status` | string | | 상태 (success, error 등) |
| `occurred_at` | ISO 8601 | | 발생 시각 (미입력 시 수신 시각) |
| `dim1`~`dim10` | string | | 문자열 차원 필드 (대시보드에서 별칭 설정 가능) |
| `metric1`~`metric3` | number | | 숫자 지표 필드 |
| `payload` | object | | 자유 형식 JSON. 필터 불가, 뷰어·내보내기로 확인 |

---

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                     # 랜딩
│   ├── access/                      # 데이터셋 접근
│   ├── datasets/
│   │   ├── new/                     # 데이터셋 생성
│   │   └── [datasetId]/             # 대시보드 & 설정
│   ├── help/                        # API 도움말
│   └── api/
│       ├── auth/logout/             # 세션 종료
│       └── v1/
│           ├── datasets/            # 데이터셋 CRUD
│           └── ingest/events/       # 이벤트 수집
├── components/
│   ├── dashboard/                   # 대시보드 컴포넌트
│   ├── settings/                    # 설정 컴포넌트
│   ├── layout/                      # 헤더 등 레이아웃
│   └── ui/                          # shadcn/ui 기본 컴포넌트
├── db/
│   ├── schema.ts                    # Drizzle 스키마
│   └── migrations/                  # DB 마이그레이션
├── lib/
│   ├── auth/                        # API 키 생성·검증
│   ├── export/                      # xlsx 빌더
│   └── validation/                  # Zod 스키마
└── types/index.ts                   # 공통 타입
```

---

## 라이선스

MIT
