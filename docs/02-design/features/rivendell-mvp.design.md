# Design: Rivendell MVP

- 문서 버전: v1.0
- 작성일: 2026-03-11
- PDCA 단계: Design
- 참조: `docs/01-plan/features/rivendell-mvp.plan.md`

---

## 1. DB 스키마 (Drizzle ORM)

### `src/db/schema.ts`

```typescript
import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from "drizzle-orm/sqlite-core";

// ─── datasets ──────────────────────────────────────────────────────
export const datasets = sqliteTable("datasets", {
  id: text("id").primaryKey(), // ds_<ulid>
  name: text("name").notNull(),
  description: text("description"),
  archivedAt: text("archived_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── api_keys ──────────────────────────────────────────────────────
export const apiKeys = sqliteTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    datasetId: text("dataset_id")
      .notNull()
      .references(() => datasets.id),
    keyType: text("key_type", { enum: ["ingest", "admin"] }).notNull(),
    keyPrefix: text("key_prefix").notNull(), // 앞 8자 표시용
    keyHash: text("key_hash").notNull(),     // SHA-256 + salt
    lastUsedAt: text("last_used_at"),
    revokedAt: text("revoked_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => ({
    datasetKeyTypeIdx: index("idx_api_keys_dataset_type").on(
      t.datasetId,
      t.keyType,
      t.revokedAt
    ),
  })
);

// ─── dataset_schema_fields ─────────────────────────────────────────
export const datasetSchemaFields = sqliteTable("dataset_schema_fields", {
  id: text("id").primaryKey(),
  datasetId: text("dataset_id")
    .notNull()
    .references(() => datasets.id),
  fieldKey: text("field_key").notNull(), // dim1~dim10, metric1~metric3
  label: text("label").notNull(),
  fieldType: text("field_type", { enum: ["dim", "metric"] }).notNull(),
  visible: integer("visible").notNull().default(1), // 0/1
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── events ────────────────────────────────────────────────────────
export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    datasetId: text("dataset_id")
      .notNull()
      .references(() => datasets.id),
    eventName: text("event_name").notNull(),
    actorId: text("actor_id"),
    sessionId: text("session_id"),
    source: text("source"),
    status: text("status"),
    occurredAt: text("occurred_at").notNull(),
    receivedAt: text("received_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    dim1: text("dim1"),   dim2: text("dim2"),   dim3: text("dim3"),
    dim4: text("dim4"),   dim5: text("dim5"),   dim6: text("dim6"),
    dim7: text("dim7"),   dim8: text("dim8"),   dim9: text("dim9"),
    dim10: text("dim10"),
    metric1: real("metric1"),
    metric2: real("metric2"),
    metric3: real("metric3"),
    payloadJson: text("payload_json"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => ({
    datasetOccurredIdx: index("idx_events_dataset_occurred").on(
      t.datasetId,
      t.occurredAt
    ),
    datasetEventNameIdx: index("idx_events_dataset_event_name").on(
      t.datasetId,
      t.eventName,
      t.occurredAt
    ),
    datasetActorIdx: index("idx_events_dataset_actor").on(
      t.datasetId,
      t.actorId,
      t.occurredAt
    ),
    datasetStatusIdx: index("idx_events_dataset_status").on(
      t.datasetId,
      t.status,
      t.occurredAt
    ),
  })
);

// ─── dataset_access_logs ───────────────────────────────────────────
export const datasetAccessLogs = sqliteTable(
  "dataset_access_logs",
  {
    id: text("id").primaryKey(),
    datasetId: text("dataset_id")
      .notNull()
      .references(() => datasets.id),
    action: text("action", {
      enum: ["view", "export_json", "export_xlsx", "rotate_key", "update_schema"],
    }).notNull(),
    keyType: text("key_type"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => ({
    datasetActionIdx: index("idx_access_logs_dataset_action").on(
      t.datasetId,
      t.action,
      t.createdAt
    ),
  })
);
```

---

## 2. 타입 정의 / Zod 스키마

### `src/lib/validation/schemas.ts`

```typescript
import { z } from "zod";

// ─── Dataset ───────────────────────────────────────────────────────
export const CreateDatasetSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  dims: z
    .array(z.object({ key: z.string(), label: z.string().max(50) }))
    .max(10)
    .optional(),
  metrics: z
    .array(z.object({ key: z.string(), label: z.string().max(50) }))
    .max(3)
    .optional(),
});

export const UpdateSchemaSchema = z.object({
  dims: z
    .array(
      z.object({
        key: z.string(),
        label: z.string().max(50),
        visible: z.boolean(),
      })
    )
    .max(10)
    .optional(),
  metrics: z
    .array(
      z.object({
        key: z.string(),
        label: z.string().max(50),
        visible: z.boolean(),
      })
    )
    .max(3)
    .optional(),
});

// ─── Ingest ────────────────────────────────────────────────────────
export const IngestEventSchema = z.object({
  event_name: z.string().min(1).max(200),
  actor_id: z.string().max(200).optional(),
  session_id: z.string().max(200).optional(),
  source: z.string().max(200).optional(),
  status: z.string().max(50).optional(),
  occurred_at: z.string().datetime().optional(), // 없으면 서버 시각
  dim1: z.string().max(500).optional(),
  dim2: z.string().max(500).optional(),
  dim3: z.string().max(500).optional(),
  dim4: z.string().max(500).optional(),
  dim5: z.string().max(500).optional(),
  dim6: z.string().max(500).optional(),
  dim7: z.string().max(500).optional(),
  dim8: z.string().max(500).optional(),
  dim9: z.string().max(500).optional(),
  dim10: z.string().max(500).optional(),
  metric1: z.number().optional(),
  metric2: z.number().optional(),
  metric3: z.number().optional(),
  payload: z.record(z.unknown()).optional(),
});

export const IngestBatchSchema = z.object({
  dataset_id: z.string(),
  events: z.array(IngestEventSchema).min(1).max(500),
});

// ─── Events Query ──────────────────────────────────────────────────
export const EventsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  event_name: z.string().optional(),
  actor_id: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(200).default(50),
});

export const ExportQuerySchema = EventsQuerySchema.omit({
  page: true,
  page_size: true,
}).extend({
  visible_only: z.coerce.boolean().default(true),
  include_payload: z.coerce.boolean().default(false),
});
```

---

## 3. 키 인증 유틸리티

### `src/lib/auth/keys.ts`

```typescript
import crypto from "crypto";

const SALT_SECRET = process.env.KEY_SALT_SECRET ?? "rivendell-default-salt";

export function generateKey(prefix: "ing" | "adm"): {
  raw: string;
  hash: string;
  keyPrefix: string;
} {
  const token = crypto.randomBytes(32).toString("hex");
  const raw = `${prefix}_${token}`;
  const keyPrefix = raw.slice(0, 12); // "ing_xxxxxxxx"
  const hash = hashKey(raw);
  return { raw, hash, keyPrefix };
}

export function hashKey(raw: string): string {
  return crypto
    .createHmac("sha256", SALT_SECRET)
    .update(raw)
    .digest("hex");
}

export function verifyKey(raw: string, storedHash: string): boolean {
  const hash = hashKey(raw);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

// Authorization 헤더에서 Bearer 토큰 추출
export function extractBearerToken(
  authHeader: string | null
): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim();
}
```

---

## 4. API 상세 설계

### 4.1 공통 응답 형식

```typescript
// 성공
{ data: T }

// 오류
{ error: { code: string; message: string } }
```

### 4.2 엔드포인트별 명세

#### `POST /api/v1/datasets`

```
인증: 없음 (no-auth)
요청: CreateDatasetSchema
응답: {
  dataset_id: string,
  ingest_key: string,   // 원문, 이후 미노출
  admin_key: string,    // 원문, 이후 미노출
  name: string,
  created_at: string
}
```

#### `GET /api/v1/datasets/:datasetId`

```
인증: Bearer <admin_key>
응답: {
  id, name, description, created_at,
  schema_fields: Array<{ field_key, label, field_type, visible, sort_order }>,
  keys: Array<{ key_type, key_prefix, last_used_at }>
}
```

#### `POST /api/v1/ingest/events`

```
인증: Bearer <ingest_key>
요청: IngestBatchSchema
응답: {
  dataset_id: string,
  accepted: number,
  failed: number,
  results: Array<{ index: number, status: "accepted" | "rejected", reason?: string }>
}
```

#### `GET /api/v1/datasets/:datasetId/events`

```
인증: Bearer <admin_key>
쿼리: EventsQuerySchema
응답: {
  data: Event[],
  total: number,
  page: number,
  page_size: number,
  total_pages: number
}
```

#### `GET /api/v1/datasets/:datasetId/export.json`

```
인증: Bearer <admin_key>
쿼리: ExportQuerySchema
제한: 최대 10,000 rows
응답: application/json 스트림 또는 파일
```

#### `GET /api/v1/datasets/:datasetId/export.xlsx`

```
인증: Bearer <admin_key>
쿼리: ExportQuerySchema
제한: 최대 10,000 rows
응답: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
헤더: Content-Disposition: attachment; filename="export-<datasetId>-<date>.xlsx"
```

#### `PATCH /api/v1/datasets/:datasetId/schema`

```
인증: Bearer <admin_key>
요청: UpdateSchemaSchema
응답: { schema_fields: SchemaField[] }
```

#### `POST /api/v1/datasets/:datasetId/keys/rotate`

```
인증: Bearer <admin_key>
요청: { key_type: "ingest" | "admin" }
응답: {
  key_type: string,
  new_key: string,    // 원문, 이후 미노출
  key_prefix: string,
  rotated_at: string
}
```

---

## 5. 컴포넌트 설계

### 5.1 컴포넌트 계층

```
app/
  page.tsx                          LandingPage
  access/page.tsx                   AccessPage
  datasets/
    new/page.tsx                    CreateDatasetPage
    new/success/page.tsx            CreateSuccessPage (searchParams로 키 수신)
    [datasetId]/
      page.tsx                      DashboardPage
      settings/page.tsx             SettingsPage

components/
  layout/
    Header.tsx                      공통 헤더 (로고 + 서비스명 + Docs/Help)
    AppHeader.tsx                   앱 내부 헤더 (Dashboard, Datasets, Analytics, Logs 탭)

  dataset/
    CreateDatasetForm.tsx           이름·설명 입력 + AdvancedSettings accordion
    AdvancedSettings.tsx            dim/metric alias 초기값 설정 (accordion)
    AccessForm.tsx                  dataset_id + admin_key 입력 폼
    CredentialDisplay.tsx           키 3종 표시 + 복사 버튼
    QuickStartTabs.tsx              cURL / JavaScript 코드 예시

  dashboard/
    KpiCards.tsx                    4개 KPI 카드 (총 이벤트, 7일, actors, 마지막 적재)
    FilterBar.tsx                   날짜·이벤트명·actor·source·status·검색어 필터
    EventTable.tsx                  이벤트 테이블 (정렬·페이지네이션 포함)
    ColumnSelector.tsx              컬럼 표시/숨김 선택 드롭다운
    EventDetailDrawer.tsx           우측 Drawer — 공통 필드 + dim/metric + payload
    ExportModal.tsx                 포맷·범위·옵션 선택 모달

  settings/
    DatasetInfoSection.tsx          이름·설명 수정
    ColumnAliasSection.tsx          dim/metric alias 수정 그리드
    KeyManagementSection.tsx        키 prefix + last_used_at + 재발급 버튼
    DangerZoneSection.tsx           Archive / Delete All Data
```

### 5.2 주요 컴포넌트 Props

#### `EventTable`

```typescript
interface EventTableProps {
  events: EventRow[];
  total: number;
  page: number;
  pageSize: number;
  schemaFields: SchemaField[];
  visibleColumns: string[];
  onPageChange: (page: number) => void;
  onRowClick: (event: EventRow) => void;
  onColumnsChange: (columns: string[]) => void;
}
```

#### `FilterBar`

```typescript
interface FilterBarProps {
  filters: EventFilters;
  onApply: (filters: EventFilters) => void;
  onReset: () => void;
}

interface EventFilters {
  from?: string;
  to?: string;
  event_name?: string;
  actor_id?: string;
  source?: string;
  status?: string;
  q?: string;
}
```

#### `EventDetailDrawer`

```typescript
interface EventDetailDrawerProps {
  event: EventRow | null;
  schemaFields: SchemaField[];
  open: boolean;
  onClose: () => void;
}
```

#### `CredentialDisplay`

```typescript
interface CredentialDisplayProps {
  datasetId: string;
  ingestKey: string;
  adminKey: string;
}
```

---

## 6. 페이지별 상태 관리

### 6.1 상태 관리 전략

- **서버 컴포넌트 우선**: 초기 데이터 fetch는 Server Component에서 수행
- **클라이언트 상태**: 필터, 선택된 이벤트, 드로어 열림 여부 등 UI 상태만
- **URL 동기화**: 필터 파라미터는 `useSearchParams` + `router.push`로 URL 반영 (공유 가능)
- **React Query 미사용**: Next.js fetch + revalidation으로 충분한 MVP 규모

### 6.2 대시보드 페이지 상태

```typescript
// app/datasets/[datasetId]/page.tsx (Server Component)
// - dataset 메타 + schema 서버 fetch
// - events 초기 목록 서버 fetch (searchParams 기준)

// client 상태 (DashboardClient.tsx)
const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
const [drawerOpen, setDrawerOpen] = useState(false);
const [exportModalOpen, setExportModalOpen] = useState(false);
const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);
```

### 6.3 생성 완료 페이지 키 전달

```
POST /api/v1/datasets
  → 응답 데이터를 router.push 전에 sessionStorage에 저장
  → /datasets/new/success 에서 sessionStorage 읽기
  → 페이지 마운트 후 sessionStorage 즉시 삭제 (보안)
```

---

## 7. 화면 흐름 및 에러 상태

### 7.1 신규 사용자 흐름

```
/ (랜딩)
  → [새 데이터셋 만들기] 클릭
  → /datasets/new (생성 폼)
  → POST /api/v1/datasets
  → sessionStorage에 키 저장
  → /datasets/new/success (키 표시)
  → [대시보드로 이동] → /datasets/[id]
```

### 7.2 기존 사용자 흐름

```
/ (랜딩)
  → [기존 데이터셋 열기] 클릭
  → /access (접근 폼)
  → GET /api/v1/datasets/:id (admin_key 검증)
  → 성공: 쿠키/sessionStorage에 {datasetId, adminKey} 저장
  → /datasets/[id] (대시보드)
```

### 7.3 에러 상태 정의

| 에러 코드 | 화면 처리 |
|-----------|-----------|
| `DATASET_NOT_FOUND` | "데이터셋을 찾을 수 없습니다" + [홈으로] |
| `INVALID_KEY` | "dataset_id 또는 admin_key를 확인해주세요" |
| `KEY_REVOKED` | "이 키는 재발급되었습니다. 새 키로 접근하세요" |
| `INGEST_KEY_FORBIDDEN` | "ingest_key로는 조회할 수 없습니다" |
| `EXPORT_LIMIT_EXCEEDED` | "결과가 10,000건을 초과합니다. 필터를 좁혀주세요" |
| `RATE_LIMITED` | "요청이 너무 많습니다. 잠시 후 다시 시도하세요" |
| `VALIDATION_ERROR` | 필드별 인라인 에러 메시지 |

### 7.4 빈 상태

| 상황 | 메시지 | 액션 버튼 |
|------|--------|-----------|
| 이벤트 없음 | "아직 수집된 이벤트가 없습니다" | [Quick Start 보기] |
| 필터 결과 없음 | "현재 필터에 맞는 결과가 없습니다" | [필터 초기화] |

---

## 8. 보안 구현 상세

### 8.1 키 검증 미들웨어 패턴

```typescript
// src/lib/auth/verifyApiKey.ts
export async function verifyAdminKey(
  datasetId: string,
  rawKey: string | null
): Promise<{ valid: boolean; keyId?: string }> {
  if (!rawKey) return { valid: false };

  const activeKey = await db.query.apiKeys.findFirst({
    where: and(
      eq(apiKeys.datasetId, datasetId),
      eq(apiKeys.keyType, "admin"),
      isNull(apiKeys.revokedAt)
    ),
  });

  if (!activeKey) return { valid: false };
  if (!verifyKey(rawKey, activeKey.keyHash)) return { valid: false };

  // last_used_at 업데이트 (비동기, 응답 차단 안 함)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(apiKeys.id, activeKey.id))
    .run();

  return { valid: true, keyId: activeKey.id };
}
```

### 8.2 Rate Limiting

```typescript
// Next.js middleware 또는 route handler에서
// - ingest API: 분당 300 req/dataset
// - export API: 분당 10 req/dataset
// - 기타 admin API: 분당 60 req/dataset
// 구현: 메모리 기반 sliding window (MVP), Redis 전환 가능 구조
```

---

## 9. Excel export 구현

### `src/lib/export/xlsx.ts`

```typescript
import * as XLSX from "xlsx";

export function buildXlsxBuffer(
  events: EventRow[],
  schemaFields: SchemaField[],
  options: { visibleOnly: boolean; includePayload: boolean }
): Buffer {
  const headers = buildHeaders(schemaFields, options);
  const rows = events.map((e) => buildRow(e, schemaFields, options));

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // 숫자 컬럼 타입 강제
  const metricCols = getMetricColumnIndices(headers);
  rows.forEach((row, ri) => {
    metricCols.forEach((ci) => {
      const cellAddr = XLSX.utils.encode_cell({ r: ri + 1, c: ci });
      if (ws[cellAddr]) ws[cellAddr].t = "n";
    });
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Events");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

// 컬럼 순서: occurred_at, event_name, actor_id, session_id, source, status,
//            dim1~10(visible), metric1~3(visible), payload_json, received_at
```

---

## 10. 디렉터리 구조 (확정)

```
rivendell/
  src/
    app/
      layout.tsx
      page.tsx                              랜딩
      access/
        page.tsx                            데이터셋 접근
      datasets/
        new/
          page.tsx                          데이터셋 생성
          success/
            page.tsx                        생성 완료
        [datasetId]/
          page.tsx                          대시보드 (Server Component)
          _components/
            DashboardClient.tsx             클라이언트 상태 래퍼
          settings/
            page.tsx                        설정 페이지
      api/
        v1/
          datasets/
            route.ts                        POST (생성)
            [datasetId]/
              route.ts                      GET (조회)
              events/
                route.ts                    GET (목록)
              schema/
                route.ts                    PATCH (alias)
              export.json/
                route.ts                    GET
              export.xlsx/
                route.ts                    GET
              keys/
                rotate/
                  route.ts                  POST
          ingest/
            events/
              route.ts                      POST

    components/
      layout/
        Header.tsx
        AppHeader.tsx
      dataset/
        CreateDatasetForm.tsx
        AdvancedSettings.tsx
        AccessForm.tsx
        CredentialDisplay.tsx
        QuickStartTabs.tsx
      dashboard/
        KpiCards.tsx
        FilterBar.tsx
        EventTable.tsx
        ColumnSelector.tsx
        EventDetailDrawer.tsx
        ExportModal.tsx
      settings/
        DatasetInfoSection.tsx
        ColumnAliasSection.tsx
        KeyManagementSection.tsx
        DangerZoneSection.tsx

    db/
      client.ts                             Drizzle + better-sqlite3 초기화
      schema.ts                             테이블 정의
      migrations/                           Drizzle Kit 생성 마이그레이션

    lib/
      auth/
        keys.ts                             generateKey, hashKey, verifyKey
        verifyApiKey.ts                     admin/ingest key 검증 헬퍼
      export/
        xlsx.ts                             SheetJS XLSX 빌더
        json.ts                             JSON export 헬퍼
      validation/
        schemas.ts                          Zod 스키마
      utils/
        id.ts                               ULID 생성
        date.ts                             날짜 포맷 유틸
        response.ts                         API 응답 헬퍼

    types/
      index.ts                              공통 타입 (EventRow, SchemaField 등)

  docker/
    Dockerfile
    docker-compose.yml
    .dockerignore

  drizzle.config.ts
  .env.example
```

---

## 11. 환경 변수

```bash
# .env.example
DATABASE_URL=file:./data/rivendell.db
KEY_SALT_SECRET=<최소 32자 랜덤 문자열>
EXPORT_MAX_ROWS=10000
RATE_LIMIT_INGEST_PER_MIN=300
RATE_LIMIT_EXPORT_PER_MIN=10
RATE_LIMIT_ADMIN_PER_MIN=60
NEXT_PUBLIC_APP_NAME=Rivendell
```

---

## 12. Docker 구성

### `docker/Dockerfile`

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false

FROM base AS build
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
RUN mkdir -p /data
VOLUME ["/data"]
EXPOSE 3000
CMD ["node", "server.js"]
```

### `docker/docker-compose.yml`

```yaml
services:
  rivendell:
    build: ..
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:/data/rivendell.db
      - KEY_SALT_SECRET=${KEY_SALT_SECRET}
    volumes:
      - rivendell-data:/data
    restart: unless-stopped

volumes:
  rivendell-data:
```

---

## 13. 다음 단계

Design 완료 후 Do 단계로 진행:

```
/pdca do rivendell-mvp
```

### 구현 순서 (권장)

1. 프로젝트 초기화 (`npx create-next-app`, shadcn/ui 설치)
2. DB 스키마 + Drizzle 마이그레이션
3. 키 인증 유틸리티 (`lib/auth/`)
4. API 라우트 (datasets → ingest → events → export → schema → rotate)
5. 랜딩 + 생성 + 접근 페이지
6. 대시보드 (KPI → 테이블 → 필터 → Drawer)
7. Export 기능
8. 설정 페이지
9. Docker 구성 + 환경변수 정리
