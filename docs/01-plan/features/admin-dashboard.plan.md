# Plan: admin-dashboard

## Overview
Rivendell 관리자 전용 대시보드 — 전체 데이터셋을 한눈에 파악하고 관리하는 내부 페이지.

## Goals
- 운영자가 서버에 존재하는 모든 데이터셋 현황을 빠르게 파악할 수 있다
- 데이터셋 삭제 등 관리 작업을 UI에서 직접 수행할 수 있다
- 환경변수 기반 비밀번호로 접근을 제한하여 외부 노출을 방지한다

## User Stories
- 관리자로서, 비밀번호를 입력하고 관리자 페이지에 접근하고 싶다
- 관리자로서, 모든 데이터셋 목록과 각 데이터셋의 이벤트 수를 확인하고 싶다
- 관리자로서, 마지막 이벤트가 언제 생성됐는지 상대적 시간(1일 전, 3일 전 등)으로 확인하고 싶다
- 관리자로서, 특정 데이터셋을 삭제하고 싶다 (확인 다이얼로그 포함)

## Features

### F-01: 관리자 로그인
- `/admin` 경로 접근 시 비밀번호 입력 화면 표시
- 비밀번호는 `ADMIN_PASSWORD` 환경변수 (`.env.local`)
- 인증 성공 시 세션 쿠키 발급 → 이후 페이지 재접근 시 자동 통과
- 세션 만료: 24시간

### F-02: 데이터셋 대시보드
- 카드형 또는 테이블형 대시보드 레이아웃
- 각 데이터셋 행/카드에 표시:
  - 데이터셋 ID (일부 마스킹 또는 전체)
  - 데이터셋 이름
  - 총 이벤트 수
  - 마지막 이벤트 생성 시간 (상대 시간: "방금 전", "1일 전", "3일 전" 등)
  - 생성일
- 전체 요약 통계 (총 데이터셋 수, 총 이벤트 수)

### F-03: 데이터셋 삭제
- 각 데이터셋에 삭제 버튼
- 삭제 전 확인 다이얼로그 (데이터셋 이름 표시)
- 삭제 시 연관 데이터(이벤트, API 키, 스키마 필드, 접근 로그) cascade 삭제
- 삭제 후 목록 즉시 갱신

## Technical Approach

### 인증 방식
- Next.js Middleware에서 `/admin/**` 경로 보호
- 쿠키: `admin_session` (서명된 JWT 또는 HMAC 토큰)
- 로그인 API: `POST /api/admin/login` → 쿠키 발급
- 로그아웃 API: `POST /api/admin/logout` → 쿠키 삭제

### 환경변수
```
ADMIN_PASSWORD=your-secure-password   # .env.local
```

### API Routes
- `POST /api/admin/login` — 비밀번호 검증 후 세션 쿠키
- `POST /api/admin/logout` — 세션 쿠키 삭제
- `GET /api/admin/datasets` — 전체 데이터셋 + 통계 조회
- `DELETE /api/admin/datasets/[id]` — 데이터셋 삭제

### Pages
- `/admin` — 로그인 또는 대시보드 (미들웨어 리다이렉트)
- `/admin/login` — 비밀번호 입력 폼
- `/admin/dashboard` — 메인 대시보드

## Non-Goals
- 개별 이벤트 열람/편집 (기존 데이터셋 대시보드 활용)
- 사용자 계정 관리 (이 프로젝트는 no-account 방식)
- 데이터셋 생성 (기존 `/datasets/new` 활용)

## Success Criteria
- [ ] 비밀번호 없이 `/admin`에 접근 불가
- [ ] 로그인 후 전체 데이터셋 목록 조회 가능
- [ ] 이벤트 수 및 마지막 이벤트 상대 시간 표시
- [ ] 데이터셋 삭제 후 목록에서 즉시 제거
- [ ] 세션 만료 또는 로그아웃 후 재인증 필요

## Estimated Scope
- 소규모 (1일 이내): 인증 미들웨어 + 로그인 페이지 + 대시보드 UI + 삭제 기능
