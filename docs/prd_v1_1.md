# PRD: 범용 사용 이력 수집 및 조회/내보내기 서비스

- 문서 버전: v1.1
- 작성일: 2026-03-11
- 문서 상태: Draft
- 작성 대상: 제품 기획, 설계, 초기 구현

---

## 1. 제품 개요

본 서비스는 사내 또는 개인 개발자가 자신이 만든 툴/서비스의 사용 이력을 손쉽게 수집하고, 웹 UI에서 표 형태로 조회하며, JSON 및 Excel(XLSX) 형식으로 내보낼 수 있도록 지원하는 **범용 로그 수집 및 조회 서비스**입니다.

사용자는 서비스 내에서 자신만의 논리적 데이터셋(dataset)을 생성하고, 해당 데이터셋에 대해 발급된 API 키를 사용해 REST API로 이벤트를 적재합니다. 이후 웹에서 데이터셋을 열어 기간, 이벤트명, 사용자, 상태 등으로 필터링한 뒤 표 형태로 확인하고 내보낼 수 있습니다.

이 서비스는 “사용자마다 실제 DB 테이블을 생성하는 방식”이 아니라, **공용 이벤트 저장 구조 안에서 dataset 단위로 분리하는 멀티테넌트 방식**을 채택합니다. 사용자에게는 전용 테이블처럼 보이지만, 내부 구현은 운영성과 확장성을 위해 공용 스키마를 사용합니다.

또한 MVP는 **로그인/회원가입이 없는 무계정형(no-account) 서비스**를 기본 정책으로 채택합니다. 이 서비스의 접근 제어 중심은 사람 계정이 아니라 **dataset과 API key**이며, 조회와 적재 권한은 키 기반으로 분리합니다.

---

## 2. 문제 정의

사내에서 만든 툴의 사용 여부와 활용 정도를 성과로 연결하려면, 최소한 다음이 필요합니다.

1. 사용 이력을 표준화된 방식으로 수집할 수 있어야 합니다.
2. 누가, 언제, 무엇을, 어떤 결과로 사용했는지 조회할 수 있어야 합니다.
3. 성과 보고를 위해 Excel로 쉽게 내보낼 수 있어야 합니다.
4. 이 요구가 특정 1인 개발자만의 니즈가 아니라, 여러 개발자/팀이 재사용 가능한 플랫폼 형태여야 합니다.

기존 방식은 대체로 아래 문제가 있습니다.

- 툴마다 개별 로그 서버를 따로 만듭니다.
- 자유형 JSON만 저장해 Excel 활용성이 떨어집니다.
- 조회 UI가 없거나, 있어도 필터/정렬/export가 약합니다.
- 권한 모델이 약해 dataset ID만 알면 조회 가능한 위험이 생깁니다.
- 로그인/회원관리까지 포함해 초기 구현 복잡도가 과도하게 올라갑니다.

---

## 3. 목표

### 3.1 제품 목표

- 누구나 자신의 데이터셋을 생성하고 사용 이력을 적재할 수 있게 합니다.
- 이벤트를 표 형태로 손쉽게 조회할 수 있게 합니다.
- Excel 및 JSON 내보내기를 지원하여 보고/분석 활용도를 높입니다.
- 공통 구조를 제공하되, 각 사용자/툴이 서로 다른 로그 구조를 담을 수 있게 합니다.
- 저비용 운영을 위해 초기 버전은 SQLite 기반으로 구성합니다.
- MVP에서는 로그인/회원관리 없이도 안전하게 사용할 수 있게 합니다.

### 3.2 성공 기준

- 데이터셋 생성부터 첫 이벤트 적재까지 5분 이내에 가능해야 합니다.
- 웹에서 필터링된 결과를 Excel로 내보낼 수 있어야 합니다.
- 각 데이터셋은 쓰기 키와 읽기 키가 분리되어야 합니다.
- 이벤트 조회는 기본적인 표/필터/정렬/검색 기능을 제공해야 합니다.
- 회원가입 없이도 데이터셋 생성, 적재, 조회, export가 가능해야 합니다.

---

## 4. 비목표

이번 MVP 범위에서는 아래를 우선 제외합니다.

- 실시간 대시보드 차트 고도화
- 사용자 조직/SSO 연동
- 이메일/비밀번호 기반 로그인
- 내 계정 / 프로필 / 비밀번호 재설정
- 데이터셋 간 조인/통합 분석
- 초고용량 스트리밍 처리 파이프라인
- 복잡한 권한 계층 구조(RBAC/ABAC)
- 사용자 정의 임의 SQL 질의 기능

---

## 5. 대상 사용자

### 5.1 1차 사용자

- 사내 개발자
- 개인 생산성 툴 제작자
- 팀 단위 내부 서비스 운영자

### 5.2 대표 사용 시나리오

#### 시나리오 A: 사내 툴 성과 측정

개발자는 자신이 만든 툴에서 사용 시마다 REST API 호출로 이벤트를 전송합니다. 분기 말에는 웹에서 기간 필터 후 Excel로 export하여 사용량과 활용 부서를 정리합니다.

#### 시나리오 B: 배치성 작업 결과 저장

도구 실행 결과의 핵심 값은 범용 컬럼에 넣고, 세부 결과 원문은 payload JSON에 저장합니다. 운영자는 실패 건만 필터링해 검토합니다.

#### 시나리오 C: 여러 팀이 공용 플랫폼 사용

각 팀 또는 개발자는 dataset을 하나 이상 생성하여 독립적으로 사용합니다. 플랫폼은 공용 인프라지만, 조회/적재 키가 dataset 단위로 분리됩니다.

---

## 6. 핵심 컨셉

### 6.1 Dataset 중심 구조

사용자는 “내가 사용할 전용 테이블”을 원하지만, 실제 구현은 **dataset**이라는 논리 단위로 분리합니다.

- 사용자 관점: 내 전용 로그 테이블
- 시스템 관점: 공용 `events` 테이블 + `dataset_id` 분리

### 6.2 무계정형(no-account) 구조

MVP는 **사람 계정 기반 서비스가 아니라 키 기반 서비스**입니다.

- 회원가입 없음
- 이메일 인증 없음
- 비밀번호 관리 없음
- 로그인 세션 없음
- 대신 `dataset_id + admin_key` 또는 `ingest_key`로 접근 제어

즉, 이 서비스의 최소 보안 단위는 **user**가 아니라 **dataset**입니다.

### 6.3 혼합형 스키마

Excel 활용성을 높이기 위해 **고정 컬럼 + 범용 슬롯 컬럼 + payload JSON** 구조를 사용합니다.

#### 이유

- Excel은 열 단위 정렬/필터/피벗에 강합니다.
- 자주 보는 값은 독립 컬럼이어야 활용성이 좋습니다.
- 서비스별로 제각각인 상세 데이터는 JSON에 담는 편이 유연합니다.

### 6.4 범용 컬럼 전략

#### 공통 고정 컬럼

- `event_name`
- `actor_id`
- `session_id`
- `source`
- `status`
- `occurred_at`
- `received_at`

#### 범용 문자열 컬럼

- `dim1` ~ `dim10`

#### 범용 숫자 컬럼

- `metric1` ~ `metric3`

#### 자유형 상세 컬럼

- `payload_json`

사용자는 각 dataset마다 `dim1`, `metric1` 등에 별칭(alias)을 지정할 수 있습니다.

예:

- `dim1` 표시명 → `부서`
- `dim2` 표시명 → `기능명`
- `metric1` 표시명 → `처리시간(ms)`

웹 UI와 Excel export에서는 실제 DB 컬럼명이 아니라 **별칭이 적용된 컬럼명**을 사용합니다.

---

## 7. 계정/인증 정책

### 7.1 MVP 결정

MVP는 **무계정형 + 키 기반 접근**으로 설계합니다.

즉:

- 서비스 로그인을 요구하지 않음
- 사용자 테이블을 두지 않음
- 계정 세션을 관리하지 않음
- 데이터셋 생성 시 접근 키를 발급함
- 모든 읽기/쓰기 권한은 키 기준으로 판단함

### 7.2 로그인 없이 가능한 이유

이 서비스에서 핵심은 “누가 사람으로 로그인했는가”보다 **어떤 데이터셋에 접근 가능한가**입니다.

따라서 사람 중심 인증보다 아래가 더 중요합니다.

- 데이터셋 식별자
- 적재용 키
- 조회/관리용 키
- 키 재발급과 폐기
- 마지막 사용 시각 추적

### 7.3 MVP에서 제거되는 사용자 관리 기능

다음 기능은 MVP에서 제외합니다.

- 회원가입
- 이메일 인증
- 비밀번호 찾기 / 재설정
- 내 계정 페이지
- 사용자별 데이터셋 목록 동기화
- 팀 멤버 초대
- 역할 기반 권한 관리

### 7.4 향후 로그인 도입 조건

아래 중 하나라도 중요해지면 로그인 도입을 검토합니다.

- 한 데이터셋을 여러 사람이 함께 관리해야 함
- 누가 export했는지 사람 단위 감사가 필요함
- 읽기 전용 / 관리 / 소유자 권한을 사람 단위로 나눠야 함
- 키를 개인에게 직접 공유하지 않고 사용자별 접근 제어를 하고 싶음
- 사내 SSO 연동 요구가 생김

### 7.5 무계정형 구조의 장점

- 초기 구현이 단순함
- 운영 복잡도가 낮음
- 비밀번호/계정 관련 보안 부담이 줄어듦
- 툴 로그 수집이라는 목적에 더 직접적으로 맞음
- 데이터셋 생성부터 첫 적재까지의 온보딩이 빠름

### 7.6 무계정형 구조의 제약

- 같은 데이터셋을 여러 사람이 다루는 협업에는 약함
- 키를 공유하는 순간 실질적으로 같은 권한을 가짐
- 사람 단위 감사 로그는 제한적임
- 분실한 키 복구는 계정 기반 복구보다 단순하지 않음

---

## 8. 제품 범위

### 8.1 MVP 범위

1. 데이터셋 생성
2. ingest/admin 키 발급
3. REST API 이벤트 적재
4. 웹 UI에서 데이터셋 열기
5. 이벤트 테이블 조회
6. 기간/이벤트명/사용자/상태 필터
7. JSON export
8. Excel(XLSX) export
9. 컬럼 별칭 관리
10. 키 재발급
11. 무계정형 접근 정책 적용

### 8.2 차기 확장 후보

- 차트/피벗 요약 대시보드
- Slack/이메일 리포트
- CSV export
- webhook 기반 알림
- Postgres 전환 지원
- read-only key
- 사용자 로그인 / SSO
- 데이터셋 공유 링크

---

## 9. 사용자 플로우

### 9.1 데이터셋 생성 플로우

1. 사용자가 서비스에 접속합니다.
2. “새 데이터셋 만들기”를 선택합니다.
3. 데이터셋 이름과 설명을 입력합니다.
4. 시스템이 `dataset_id`, `ingest_key`, `admin_key`를 발급합니다.
5. 샘플 API 요청 예시를 함께 제공합니다.
6. 키는 발급 직후 한 번만 전체 값을 보여줍니다.

### 9.2 이벤트 적재 플로우

1. 외부 툴이 `ingest_key`를 사용해 API를 호출합니다.
2. 서버가 키 유효성을 검증합니다.
3. 이벤트 유효성 검증 후 저장합니다.
4. 응답으로 저장 건수/오류 건수를 반환합니다.

### 9.3 조회 및 export 플로우

1. 사용자가 dataset ID와 admin key를 입력합니다.
2. 서버가 dataset과 키의 매칭을 검증합니다.
3. 기간, 이벤트명, 사용자, 상태 등으로 필터링합니다.
4. 표에서 데이터를 검토합니다.
5. JSON 또는 Excel로 내보냅니다.

### 9.4 키 재발급 플로우

1. 사용자가 admin key로 데이터셋에 접근합니다.
2. “키 재발급”을 선택합니다.
3. 시스템이 새 키를 발급하고 기존 키를 폐기합니다.
4. 새 키는 발급 시점에 한 번만 전체 값을 보여줍니다.

---

## 10. 기능 요구사항

### 10.1 데이터셋 관리

#### FR-001 데이터셋 생성

- 사용자는 데이터셋을 생성할 수 있어야 합니다.
- 생성 시 이름과 설명을 입력할 수 있어야 합니다.
- 생성 후 즉시 데이터 적재용 키와 조회용 키를 발급받아야 합니다.
- 데이터셋 생성에 회원가입이 필요하지 않아야 합니다.

#### FR-002 데이터셋 접근

- 사용자는 `dataset_id + admin_key` 조합으로 기존 데이터셋에 접근할 수 있어야 합니다.
- `dataset_id` 단독으로는 어떠한 데이터도 조회할 수 없어야 합니다.

#### FR-003 데이터셋 설정

- 사용자는 `dim1~10`, `metric1~3`의 표시명을 변경할 수 있어야 합니다.
- 사용자는 특정 컬럼을 UI 기본 표시 대상에서 숨길 수 있어야 합니다.

### 10.2 키 및 접근 제어

#### FR-010 키 발급

- 시스템은 데이터셋 생성 시 아래 키를 발급해야 합니다.
  - `ingest_key`: 이벤트 적재용
  - `admin_key`: 조회/export/설정용

#### FR-011 키 분리

- `ingest_key`로는 조회/export가 불가능해야 합니다.
- `admin_key`로는 이벤트 적재를 허용하지 않는 것을 기본 정책으로 둡니다.

#### FR-012 키 재발급/폐기

- 사용자는 키를 재발급할 수 있어야 합니다.
- 재발급된 키는 새 값만 한 번 노출하고, 기존 키는 폐기해야 합니다.

#### FR-013 마지막 사용 시각

- 시스템은 각 키의 마지막 사용 시각을 기록해야 합니다.
- 사용자는 admin 화면에서 마지막 사용 시각을 확인할 수 있어야 합니다.

### 10.3 이벤트 적재

#### FR-020 단건/배치 적재

- 시스템은 단건 이벤트와 다건 배치 이벤트 적재를 지원해야 합니다.
- 배치 요청 내 일부 실패가 있어도 성공 건은 저장하고 결과를 구분해 응답해야 합니다.

#### FR-021 필수 필드 검증

- 이벤트 적재 시 최소한 `event_name`, `occurred_at` 또는 서버 기본 시각을 보장해야 합니다.
- `payload_json`은 선택 입력이어야 합니다.

#### FR-022 범용 컬럼 입력

- 클라이언트는 필요에 따라 `dim1~10`, `metric1~3` 중 필요한 값만 전송할 수 있어야 합니다.
- 전송되지 않은 컬럼은 null로 저장합니다.

#### FR-023 상태 구분

- `status`는 `success`, `fail`, `warning`, `info` 등 제한된 enum 또는 문자열 허용 범위로 관리합니다.

### 10.4 조회 UI

#### FR-030 이벤트 목록 조회

- 사용자는 표 형태로 이벤트 목록을 조회할 수 있어야 합니다.
- 기본 정렬은 `occurred_at desc` 입니다.

#### FR-031 필터

- 아래 필터를 지원해야 합니다.
  - 기간(from/to)
  - event_name
  - actor_id
  - source
  - status
  - 자유 검색어(선택)

#### FR-032 컬럼 제어

- 사용자는 표에 표시할 컬럼을 선택할 수 있어야 합니다.
- 컬럼명은 실제 DB 컬럼명이 아니라 alias를 표시해야 합니다.

#### FR-033 상세 보기

- 각 행을 클릭하면 payload JSON과 메타 정보를 상세 화면/모달에서 볼 수 있어야 합니다.

### 10.5 내보내기

#### FR-040 JSON export

- 현재 필터 조건이 반영된 결과를 JSON으로 내려받을 수 있어야 합니다.

#### FR-041 Excel export

- 현재 필터 조건이 반영된 결과를 XLSX로 내려받을 수 있어야 합니다.
- 컬럼 헤더는 alias 기준으로 출력해야 합니다.
- 숫자형 범용 컬럼(`metric1~3`)은 숫자형 셀로 기록해야 합니다.

#### FR-042 export 범위 제어

- 과도한 내보내기를 방지하기 위해 export 최대 건수를 제한해야 합니다.
- 한도를 넘는 경우 사용자에게 조건을 더 좁히도록 안내해야 합니다.

---

## 11. 비기능 요구사항

### NFR-001 사용성

- 데이터셋 생성 후 샘플 curl/JavaScript 예제를 즉시 제공해야 합니다.
- 비개발자도 테이블 조회와 export를 할 수 있을 만큼 UI가 단순해야 합니다.
- 로그인/회원가입 없이도 접근 흐름을 이해할 수 있어야 합니다.

### NFR-002 성능

- 일반적인 조회는 수초 이내 응답을 목표로 합니다.
- 수집 규모는 초기 MVP 기준 중소규모 로그 용도로 가정합니다.

### NFR-003 보안

- 키는 평문 저장하지 않고 해시로 저장해야 합니다.
- dataset ID만으로 조회가 가능해서는 안 됩니다.
- 키별 권한이 분리되어야 합니다.
- 관리자용 접근은 `dataset_id + admin_key` 조합 검증을 통과해야 합니다.

### NFR-004 운영성

- SQLite 파일은 백업 가능한 구조여야 합니다.
- Docker volume 마운트를 통해 영속 저장해야 합니다.
- 향후 Postgres 전환 가능성을 고려해 ORM 계층을 둡니다.

### NFR-005 확장성

- schema는 SQLite 기준으로 설계하되, 향후 Postgres로 이전 가능한 형태여야 합니다.
- payload JSON과 고정 컬럼 혼합 구조를 유지해야 합니다.
- 향후 로그인/계정 체계를 붙일 수 있도록 도메인 모델을 과도하게 꼬지 않아야 합니다.

---

## 12. 정보 구조 및 화면 구성

### 12.1 화면 목록

1. 랜딩/소개 페이지
2. 데이터셋 생성 페이지
3. 데이터셋 접근 페이지
4. 데이터셋 대시보드 페이지
5. 데이터셋 설정 페이지
6. 키 재발급 모달

### 12.2 주요 화면 설명

#### A. 데이터셋 생성 페이지

- 입력 항목: 이름, 설명
- 생성 결과:
  - dataset ID
  - ingest key
  - admin key
  - 샘플 API 코드
- 경고 문구:
  - 키는 지금 한 번만 보여줌
  - 분실 시 재발급 필요

#### B. 데이터셋 접근 페이지

- 입력 항목:
  - dataset ID
  - admin key
- 성공 시 데이터셋 대시보드 진입
- 실패 시 권한 오류 안내

#### C. 데이터셋 대시보드

상단 요약 카드:
- 총 이벤트 수
- 최근 7일 이벤트 수
- 고유 actor 수
- 마지막 적재 시각

하단 본문:
- 필터 바
- 이벤트 테이블
- 컬럼 선택 UI
- JSON/XLSX export 버튼

#### D. 이벤트 상세 모달

- 공통 필드
- dim/metric 값
- payload JSON pretty view
- raw JSON 복사 버튼

#### E. 설정 페이지

- dim/metric alias 수정
- 컬럼 표시 여부 설정
- 키 재발급
- 마지막 사용 시각 표시
- 데이터셋 archive

---

## 13. API 설계

기본 prefix:

```http
/api/v1
```

### 13.1 데이터셋 생성

```http
POST /api/v1/datasets
```

요청 예시:

```json
{
  "name": "Tool Usage Log",
  "description": "사내 툴 사용 이력 수집"
}
```

응답 예시:

```json
{
  "dataset_id": "ds_01JXYZ...",
  "ingest_key": "ing_xxx...",
  "admin_key": "adm_xxx..."
}
```

### 13.2 데이터셋 상세 조회

```http
GET /api/v1/datasets/:datasetId
Authorization: Bearer <admin_key>
```

### 13.3 이벤트 적재

```http
POST /api/v1/ingest/events
Authorization: Bearer <ingest_key>
Content-Type: application/json
```

요청 예시:

```json
{
  "dataset_id": "ds_01JXYZ...",
  "events": [
    {
      "event_name": "tool_opened",
      "actor_id": "youngtae",
      "session_id": "sess_001",
      "source": "desktop_app",
      "status": "success",
      "occurred_at": "2026-03-11T10:30:00Z",
      "dim1": "CTO실",
      "dim2": "리포트생성",
      "dim3": "alpha",
      "metric1": 1520,
      "payload": {
        "result": "ok",
        "service_response": {
          "count": 42
        }
      }
    }
  ]
}
```

응답 예시:

```json
{
  "dataset_id": "ds_01JXYZ...",
  "accepted": 1,
  "failed": 0,
  "results": [
    {
      "index": 0,
      "status": "accepted"
    }
  ]
}
```

### 13.4 이벤트 조회

```http
GET /api/v1/datasets/:datasetId/events?from=2026-03-01&to=2026-03-31&event_name=tool_opened&page=1&page_size=50
Authorization: Bearer <admin_key>
```

### 13.5 JSON export

```http
GET /api/v1/datasets/:datasetId/export.json?from=2026-03-01&to=2026-03-31
Authorization: Bearer <admin_key>
```

### 13.6 Excel export

```http
GET /api/v1/datasets/:datasetId/export.xlsx?from=2026-03-01&to=2026-03-31
Authorization: Bearer <admin_key>
```

### 13.7 alias 설정 변경

```http
PATCH /api/v1/datasets/:datasetId/schema
Authorization: Bearer <admin_key>
```

요청 예시:

```json
{
  "dims": [
    { "key": "dim1", "label": "부서", "visible": true },
    { "key": "dim2", "label": "기능명", "visible": true },
    { "key": "dim3", "label": "프로젝트", "visible": true }
  ],
  "metrics": [
    { "key": "metric1", "label": "처리시간(ms)", "visible": true }
  ]
}
```

### 13.8 키 재발급

```http
POST /api/v1/datasets/:datasetId/keys/rotate
Authorization: Bearer <admin_key>
```

---

## 14. 데이터 모델

### 14.1 테이블 개요

#### `datasets`

사용자가 전용 테이블처럼 사용하는 논리 단위입니다.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | text | PK |
| name | text | 데이터셋명 |
| description | text | 설명 |
| archived_at | datetime nullable | 보관 처리 시각 |
| created_at | datetime | 생성 시각 |
| updated_at | datetime | 수정 시각 |
|

#### `api_keys`

키는 해시로 저장합니다.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | text | PK |
| dataset_id | text | FK |
| key_type | text | ingest/admin/read |
| key_prefix | text | 앞부분 표시용 |
| key_hash | text | 해시 값 |
| last_used_at | datetime nullable | 마지막 사용 시각 |
| revoked_at | datetime nullable | 폐기 시각 |
| created_at | datetime | 생성 시각 |

#### `dataset_schema_fields`

dim/metric alias와 표시 여부를 저장합니다.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | text | PK |
| dataset_id | text | FK |
| field_key | text | dim1, metric1 등 |
| label | text | 표시명 |
| field_type | text | dim/metric |
| visible | integer | 0/1 |
| sort_order | integer | UI 정렬 |
| created_at | datetime | 생성 시각 |
| updated_at | datetime | 수정 시각 |

#### `events`

실제 이벤트 저장소입니다.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | text | PK |
| dataset_id | text | FK |
| event_name | text | 이벤트명 |
| actor_id | text nullable | 사용자/실행자 식별자 |
| session_id | text nullable | 세션 식별자 |
| source | text nullable | 호출 소스 |
| status | text nullable | 상태 |
| occurred_at | datetime | 실제 발생 시각 |
| received_at | datetime | 수집 서버 수신 시각 |
| dim1 ~ dim10 | text nullable | 범용 문자열 슬롯 |
| metric1 ~ metric3 | real nullable | 범용 숫자 슬롯 |
| payload_json | text nullable | JSON 문자열 |
| created_at | datetime | 생성 시각 |

#### `dataset_access_logs` (선택)

조회/export/설정 변경 등의 관리 행위를 남기는 감사 로그 테이블입니다.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | text | PK |
| dataset_id | text | FK |
| action | text | view/export/rotate_key/update_schema |
| key_type | text | admin 등 |
| ip_hash | text nullable | IP 해시 |
| user_agent | text nullable | 요청 UA |
| created_at | datetime | 실행 시각 |

### 14.2 인덱스 제안

- `events(dataset_id, occurred_at desc)`
- `events(dataset_id, event_name, occurred_at desc)`
- `events(dataset_id, actor_id, occurred_at desc)`
- `events(dataset_id, status, occurred_at desc)`
- `api_keys(dataset_id, key_type, revoked_at)`
- `dataset_access_logs(dataset_id, action, created_at desc)`

---

## 15. 권한 및 보안 설계

### 15.1 기본 원칙

- dataset ID는 공개 식별자에 가깝고, 단독으로는 접근 권한을 주지 않습니다.
- 모든 조회/export/설정 변경은 `admin_key`가 필요합니다.
- 이벤트 적재는 `ingest_key`가 필요합니다.
- 로그인은 없지만, 접근 제어는 반드시 있어야 합니다.

### 15.2 키 정책

- 키는 발급 시 원문을 한 번만 보여주고 이후에는 해시만 저장합니다.
- 키 원문은 DB에 저장하지 않습니다.
- 로그 상에 키 원문을 기록하지 않습니다.
- 키는 prefix를 별도 저장해 화면 식별 및 장애 대응에 활용합니다.

### 15.3 무계정형 정책

- 이 서비스는 사람 계정 대신 데이터셋 키를 신뢰 경계로 사용합니다.
- “내 데이터셋 목록” 기능은 MVP에서 제공하지 않습니다.
- 사용자가 dataset ID와 key를 잃어버리면 기존 키를 복구하기보다 재발급 전제로 운영합니다.
- 브라우저 편의 기능이 필요하다면 향후 로컬 저장 기반 최근 접근 목록을 검토할 수 있습니다.

### 15.4 API 보호

- 요청 크기 제한
- 초당/분당 rate limit
- CORS 정책 검토
- 잘못된 JSON, 과도한 payload 방어
- export 요청 행 수 제한

### 15.5 데이터 안전성

- payload에는 민감정보 저장 금지 권고 문구를 제공합니다.
- SQLite 파일은 정기 백업합니다.
- 운영 환경에서는 Docker volume 기반 영속 스토리지를 사용합니다.
- 선택적으로 관리 작업에 대한 access log를 남깁니다.

---

## 16. Excel/JSON export 정책

### 16.1 Excel export 설계 원칙

- 현재 필터 결과만 내보냅니다.
- 컬럼 헤더는 alias를 적용합니다.
- 날짜 컬럼은 사람이 읽기 쉬운 형식으로 기록합니다.
- 숫자 컬럼은 숫자형 셀로 유지합니다.
- payload는 문자열(JSON pretty/minified 선택 가능)로 내보냅니다.

### 16.2 권장 컬럼 순서

1. occurred_at
2. event_name
3. actor_id
4. session_id
5. source
6. status
7. dim1~10 (visible 기준)
8. metric1~3 (visible 기준)
9. payload_json
10. received_at

### 16.3 JSON export 설계 원칙

- API 응답에 가까운 raw 구조를 유지합니다.
- alias 메타정보를 함께 포함할 수 있습니다.
- payload는 원본을 최대한 보존합니다.

---

## 17. 기술 설계

### 17.1 기술 스택

- Frontend / Backend: Next.js App Router
- UI: shadcn/ui
- Database: SQLite
- ORM: Drizzle ORM
- Excel Export: SheetJS
- Runtime: Node.js self-hosting 또는 Docker

### 17.2 스택 선정 이유

- Next.js는 웹 UI와 REST API를 한 프로젝트 안에서 함께 운영하기에 적합합니다.
- shadcn/ui는 대시보드/테이블/설정 화면 구성에 적합합니다.
- SQLite는 초기 저용량 운영에 충분하며 파일 단위 백업이 쉽습니다.
- Drizzle ORM은 TypeScript 친화적이고 SQLite에서 가볍게 시작하기 좋습니다.
- SheetJS는 XLSX export 구현에 적합합니다.

### 17.3 배포 전략

초기 버전은 SQLite 파일 영속성이 중요하므로 **Vercel 중심의 서버리스 배포보다 Node.js self-hosting 또는 Docker 배포**를 기본 전략으로 합니다.

### 17.4 권장 구현 상세

- ORM 및 드라이버: Drizzle ORM + better-sqlite3
- 요청 검증: zod
- 키 해시: Node crypto 기반 SHA-256 이상 + salt/pepper 전략 검토
- export 생성: 서버 메모리 한계 고려, 건수 제한 필수

### 17.5 디렉터리 예시

```text
src/
  app/
    page.tsx
    access/page.tsx
    datasets/
      new/page.tsx
      [datasetId]/page.tsx
      [datasetId]/settings/page.tsx
    api/
      v1/
        datasets/route.ts
        ingest/events/route.ts
        datasets/[datasetId]/route.ts
        datasets/[datasetId]/events/route.ts
        datasets/[datasetId]/schema/route.ts
        datasets/[datasetId]/export.json/route.ts
        datasets/[datasetId]/export.xlsx/route.ts
        datasets/[datasetId]/keys/rotate/route.ts

  components/
    ui/
    dataset/
    dashboard/

  db/
    client.ts
    schema.ts
    migrations/

  lib/
    auth/
    export/
    validation/
    utils/
```

---

## 18. 예시 이벤트 모델링

### 예시 1: 사내 문서 검색 툴

- `event_name`: `search_executed`
- `actor_id`: 사용자 사번/이메일 일부
- `dim1`: 부서
- `dim2`: 기능명
- `dim3`: 검색 카테고리
- `metric1`: 응답시간(ms)
- `metric2`: 결과 개수
- `payload_json`: 실제 검색 결과 원문 일부

### 예시 2: 배치 작업 실행기

- `event_name`: `job_finished`
- `dim1`: 프로젝트명
- `dim2`: 배치명
- `status`: success/fail
- `metric1`: 처리 건수
- `metric2`: 소요 시간
- `payload_json`: 오류 상세, stack trace, 요약 결과

### 예시 3: 생성형 AI 툴 사용

- `event_name`: `prompt_completed`
- `dim1`: 모델명
- `dim2`: 기능명
- `dim3`: 사용 목적
- `metric1`: latency_ms
- `metric2`: token_usage
- `metric3`: estimated_cost
- `payload_json`: 결과 전문, 응답 metadata

---

## 19. 위험 요소 및 대응

### 19.1 사용자별 실제 테이블 생성 요구

#### 위험

- 운영 복잡도 증가
- 마이그레이션 어려움
- 공통 조회 UI 구현 난이도 상승

#### 대응

- 외부 UX는 “전용 테이블”처럼 보이게 하되 내부는 dataset 기반 공용 스키마 유지

### 19.2 자유형 payload 남용

#### 위험

- Excel 활용성 저하
- 필터링 어려움

#### 대응

- 자주 보는 값은 dim/metric으로 넣도록 문서화
- payload는 상세/원본 전용으로 위치시킴

### 19.3 SQLite 한계

#### 위험

- 고동시성 쓰기/대규모 데이터에 약할 수 있음

#### 대응

- MVP는 SQLite로 시작
- export/조회/보관 규모가 커지면 Postgres 전환 로드맵 확보

### 19.4 키 유출

#### 위험

- 무단 적재 또는 무단 조회

#### 대응

- 키 해시 저장
- 키 재발급 기능
- last_used_at 추적
- 이상 사용 탐지 후보 기능 추가

### 19.5 무계정형의 협업 한계

#### 위험

- 같은 키를 여러 사람이 공유하며 사용하게 될 수 있음
- 사람 단위 감사가 어렵다

#### 대응

- MVP는 키 공유를 허용하되 리스크를 명시
- 차기 버전에서 read-only key, 로그인, SSO를 검토

---

## 20. 운영 정책

### 20.1 보존 정책

초기 버전은 사용자가 직접 보존 정책을 선택하지 않는 단순 구조로 시작합니다. 차기 버전에서 아래 정책을 검토합니다.

- 90일 보관
- 180일 보관
- 무기한 보관
- archive 전용 데이터셋 분리

### 20.2 백업 정책

- 일 1회 SQLite 파일 백업
- 배포 전 스냅샷
- export 파일은 장기 저장하지 않고 즉시 응답 후 폐기

### 20.3 운영 가이드

- 관리자에게는 dataset ID와 key를 안전하게 보관하도록 안내합니다.
- payload에 민감정보를 넣지 않도록 안내합니다.
- 키가 노출된 경우 즉시 재발급하도록 안내합니다.

---

## 21. 마일스톤

### Phase 1: MVP

- DB 스키마 구축
- 데이터셋 생성 API/UI
- 이벤트 적재 API
- 이벤트 조회 테이블 UI
- JSON/XLSX export
- dim/metric alias 설정
- 키 재발급
- 무계정형 접근 플로우 적용

### Phase 2: 운영 편의 기능

- 대시보드 요약 카드
- 최근 사용량 요약
- 실패 이벤트 강조 표시
- 컬럼 저장 프리셋
- read-only key
- access log UI

### Phase 3: 확장

- Postgres 대응
- 사용자 계정 체계
- 팀 공유 및 권한 관리
- 스케줄 리포트
- SSO 연동

---

## 22. 오픈 이슈

1. admin key 외에 read-only key를 MVP에 포함할지 결정 필요
2. payload_json export 형식을 pretty string / raw string 중 무엇으로 기본화할지 결정 필요
3. 대용량 export 시 동기 다운로드만 허용할지, 비동기 생성으로 확장할지 결정 필요
4. actor_id에 개인식별정보가 들어올 경우의 가이드/마스킹 정책 결정 필요
5. 데이터셋 생성 자체를 완전 공개로 둘지, 서비스 공용 생성 비밀키나 사내 네트워크 제한을 둘지 결정 필요

---

## 23. 최종 제안

본 서비스의 MVP는 아래 원칙으로 확정하는 것을 제안합니다.

- **제품 구조**: dataset 중심 멀티테넌트 로그 수집 서비스
- **계정 정책**: 로그인 없는 무계정형 서비스
- **접근 정책**: `ingest_key`와 `admin_key` 분리
- **데이터 구조**: 공통 컬럼 + `dim1~10` + `metric1~3` + `payload_json`
- **기술 스택**: Next.js + shadcn/ui + SQLite + Drizzle ORM + SheetJS
- **배포 전략**: Node/Docker self-hosting
- **핵심 가치**: “툴 사용 성과를 가장 간단하게 수집, 조회, export 하는 공용 서비스”

이 설계는 초기 구현 난이도와 운영 단순성을 유지하면서도, 실제 성과 보고에 필요한 Excel 활용성을 충분히 확보할 수 있습니다.

---

## 24. 참고 자료

- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Next.js route file convention: https://nextjs.org/docs/app/api-reference/file-conventions/route
- Next.js Self-Hosting: https://nextjs.org/docs/app/guides/self-hosting
- shadcn/ui Next.js 설치: https://ui.shadcn.com/docs/installation/next
- Drizzle SQLite 시작 가이드: https://orm.drizzle.team/docs/get-started-sqlite
- Drizzle Migrations: https://orm.drizzle.team/docs/migrations
- SQLite JSON Functions: https://sqlite.org/json1.html
- SQLite Limits: https://sqlite.org/limits.html
- SQLite Appropriate Uses: https://sqlite.org/whentouse.html
- SheetJS Export 예시: https://docs.sheetjs.com/docs/getting-started/examples/export/

