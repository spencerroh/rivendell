---
feature: grafana-metrics
status: plan
created: 2026-04-01
---

# Plan: Grafana 연동 집계 API

## 배경 및 목적

현재 events API는 원시 로우를 페이지네이션으로 반환한다.
Grafana는 **시계열(time series)**, **분포(breakdown)**, **요약(KPI)** 형태의 집계 데이터를 필요로 한다.

Grafana Infinity Datasource 플러그인과 연동 가능한 REST API 엔드포인트 3개를 추가해
관리자 키(또는 NO_SECURE_DATASETS) 인증 하에 Grafana 대시보드를 구축할 수 있도록 한다.

## 추가할 엔드포인트 3개

### 1. 시계열 집계 — `/api/v1/datasets/[id]/metrics/timeseries`

시간 구간별 이벤트 수 또는 metric 집계값을 반환한다.

**Query Params**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `from` | ISO8601 | 시작 시각 |
| `to` | ISO8601 | 종료 시각 |
| `interval` | `1h` \| `6h` \| `1d` \| `7d` | 버킷 단위 (기본 `1d`) |
| `aggregate` | `count` \| `sum` \| `avg` \| `min` \| `max` | 집계 방식 (기본 `count`) |
| `metric_col` | `metric1`~`metric10` | aggregate≠count 일 때 대상 컬럼 |
| `event_name` | string | 필터 |
| `source` | string | 필터 |
| `status` | string | 필터 |

**Response**

```json
{
  "ok": true,
  "data": {
    "interval": "1d",
    "aggregate": "count",
    "datapoints": [
      { "time": "2026-03-12T00:00:00.000Z", "value": 23 },
      { "time": "2026-03-13T00:00:00.000Z", "value": 17 }
    ]
  }
}
```

**SQLite 구현**: `strftime()` + `GROUP BY`
```sql
SELECT strftime('%Y-%m-%dT%H:00:00.000Z', occurred_at) as time, count(*) as value
FROM events
WHERE dataset_id = ? AND occurred_at BETWEEN ? AND ?
GROUP BY time ORDER BY time
```

---

### 2. 분포 집계 — `/api/v1/datasets/[id]/metrics/breakdown`

특정 차원(dim, event_name, status, source)으로 그룹화한 이벤트 수를 반환한다.
Grafana 파이 차트, 바 차트에 활용.

**Query Params**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `group_by` | `event_name` \| `status` \| `source` \| `dim1`~`dim10` | 그룹 기준 (필수) |
| `from` | ISO8601 | 시작 시각 |
| `to` | ISO8601 | 종료 시각 |
| `limit` | number | 최대 행 수 (기본 20, 최대 100) |
| `event_name` / `status` / `source` | string | 필터 (group_by와 별개) |

**Response**

```json
{
  "ok": true,
  "data": {
    "group_by": "event_name",
    "rows": [
      { "label": "purchase", "count": 31 },
      { "label": "page_view", "count": 18 },
      { "label": "click", "count": 5 }
    ]
  }
}
```

---

### 3. 요약 KPI — `/api/v1/datasets/[id]/metrics/summary`

총 이벤트 수, 고유 액터 수, 기간 내 이벤트 수 등 단일 숫자 KPI를 반환한다.
Grafana Stat 패널에 활용.

**Query Params**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `from` | ISO8601 | 시작 시각 |
| `to` | ISO8601 | 종료 시각 |
| `event_name` / `status` / `source` | string | 필터 |

**Response**

```json
{
  "ok": true,
  "data": {
    "total_events": 54,
    "unique_actors": 8,
    "unique_sessions": 12,
    "first_event_at": "2026-03-13T01:16:47Z",
    "last_event_at": "2026-03-14T03:55:47Z"
  }
}
```

---

## 인증

- 기본 모드: `Authorization: Bearer adm_xxx` 헤더 필수
- `NO_SECURE_DATASETS=1`: 인증 생략 (기존 `isNoSecureMode()` 패턴 동일 적용)

## 파일 목록

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `src/lib/validation/metricsSchemas.ts` | 신규 | 3개 엔드포인트 Zod 스키마 |
| `src/app/api/v1/datasets/[datasetId]/metrics/timeseries/route.ts` | 신규 | 시계열 집계 |
| `src/app/api/v1/datasets/[datasetId]/metrics/breakdown/route.ts` | 신규 | 분포 집계 |
| `src/app/api/v1/datasets/[datasetId]/metrics/summary/route.ts` | 신규 | 요약 KPI |

## 구현 순서

1. `metricsSchemas.ts` — Zod 스키마 3종 정의
2. `summary/route.ts` — 가장 단순, 먼저 구현
3. `breakdown/route.ts` — GROUP BY 패턴
4. `timeseries/route.ts` — strftime 인터벌 버킷 처리
5. `npm run build` 확인

## Grafana 연동 방법 (구현 후 사용법)

### Infinity Datasource 설정
```
Base URL: https://your-host.com/api/v1/datasets/{dataset_id}/metrics
Auth: Bearer Token → adm_xxx
```

| 패널 종류 | 엔드포인트 | URL 예시 |
|----------|-----------|---------|
| Time Series | `/timeseries` | `?from=${__from:date:iso}&to=${__to:date:iso}&interval=1d` |
| Pie / Bar | `/breakdown` | `?group_by=event_name&from=...&to=...` |
| Stat (KPI) | `/summary` | `?from=...&to=...` |

Grafana 변수 `${__from:date:iso}`, `${__to:date:iso}`로 시간 범위 자동 연동됨.

## 고려 사항

- `interval` 구현은 SQLite `strftime()`만 사용 — 외부 의존성 없음
- `breakdown`의 `group_by`가 `dim1`~`dim10`일 때 NULL 값은 결과에서 제외
- `aggregate=sum|avg|min|max`는 `metric_col`이 없으면 400 에러
- 모든 엔드포인트는 기존 `buildEventConditions` 필터 로직 재사용
