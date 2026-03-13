import { HeaderWithSession as Header } from "@/components/layout/HeaderWithSession";
import { HelpCodeBlock } from "@/components/help/HelpCodeBlock";
import { Separator } from "@/components/ui/separator";

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://your-host.com";
const DATASET_ID = "ds_xxxxxxxxxxxxxxxxxxxxxx";
const INGEST_KEY = "ing_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const ADMIN_KEY = "adm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

// ─── 이벤트 수집 ───────────────────────────────────────────────────
const ingestCurl = `curl -X POST ${BASE}/api/v1/ingest/events \\
  -H "Authorization: Bearer ${INGEST_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "dataset_id": "${DATASET_ID}",
    "events": [
      {
        "event_name": "page_view",
        "actor_id": "user_123",
        "session_id": "sess_abc",
        "source": "web",
        "status": "success",
        "dim1": "home",
        "dim2": "mobile",
        "metric1": 1250
      }
    ]
  }'`;

const ingestJs = `const INGEST_KEY = "${INGEST_KEY}";
const DATASET_ID = "${DATASET_ID}";

const res = await fetch("${BASE}/api/v1/ingest/events", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${INGEST_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    dataset_id: DATASET_ID,
    events: [
      {
        event_name: "page_view",
        actor_id: "user_123",
        session_id: "sess_abc",
        source: "web",
        status: "success",
        dim1: "home",
        dim2: "mobile",
        metric1: 1250,
      },
    ],
  }),
});

const data = await res.json();
console.log(data);
// { dataset_id, accepted: 1, failed: 0, results: [...] }`;

const ingestPython = `import requests

INGEST_KEY = "${INGEST_KEY}"
DATASET_ID = "${DATASET_ID}"

response = requests.post(
    "${BASE}/api/v1/ingest/events",
    headers={
        "Authorization": f"Bearer {INGEST_KEY}",
        "Content-Type": "application/json",
    },
    json={
        "dataset_id": DATASET_ID,
        "events": [
            {
                "event_name": "page_view",
                "actor_id": "user_123",
                "session_id": "sess_abc",
                "source": "web",
                "status": "success",
                "dim1": "home",
                "dim2": "mobile",
                "metric1": 1250,
            }
        ],
    },
)

print(response.json())
# {'dataset_id': ..., 'accepted': 1, 'failed': 0, 'results': [...]}`;

// ─── 이벤트 일괄 수집 ───────────────────────────────────────────────
const batchCurl = `curl -X POST ${BASE}/api/v1/ingest/events \\
  -H "Authorization: Bearer ${INGEST_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "dataset_id": "${DATASET_ID}",
    "events": [
      { "event_name": "login",     "actor_id": "user_1", "status": "success" },
      { "event_name": "purchase",  "actor_id": "user_2", "metric1": 49900, "dim1": "premium" },
      { "event_name": "page_view", "actor_id": "user_3", "source": "app" }
    ]
  }'`;

const batchJs = `// 한 번의 요청으로 최대 500개 이벤트 전송 가능
const res = await fetch("${BASE}/api/v1/ingest/events", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${INGEST_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    dataset_id: DATASET_ID,
    events: [
      { event_name: "login",     actor_id: "user_1", status: "success" },
      { event_name: "purchase",  actor_id: "user_2", metric1: 49900, dim1: "premium" },
      { event_name: "page_view", actor_id: "user_3", source: "app" },
    ],
  }),
});`;

const batchPython = `# 한 번의 요청으로 최대 500개 이벤트 전송 가능
response = requests.post(
    "${BASE}/api/v1/ingest/events",
    headers={"Authorization": f"Bearer {INGEST_KEY}"},
    json={
        "dataset_id": DATASET_ID,
        "events": [
            {"event_name": "login",     "actor_id": "user_1", "status": "success"},
            {"event_name": "purchase",  "actor_id": "user_2", "metric1": 49900, "dim1": "premium"},
            {"event_name": "page_view", "actor_id": "user_3", "source": "app"},
        ],
    },
)`;

// ─── 이벤트 조회 ───────────────────────────────────────────────────
const queryCurl = `curl "${BASE}/api/v1/datasets/${DATASET_ID}/events?page=1&page_size=50" \\
  -H "Authorization: Bearer ${ADMIN_KEY}"

# 필터 적용 예시
curl "${BASE}/api/v1/datasets/${DATASET_ID}/events?event_name=purchase&from=2025-01-01T00:00:00Z&to=2025-12-31T23:59:59Z" \\
  -H "Authorization: Bearer ${ADMIN_KEY}"`;

const queryJs = `const ADMIN_KEY = "${ADMIN_KEY}";
const DATASET_ID = "${DATASET_ID}";

// 기본 조회
const res = await fetch(
  \`${BASE}/api/v1/datasets/\${DATASET_ID}/events?page=1&page_size=50\`,
  { headers: { "Authorization": \`Bearer \${ADMIN_KEY}\` } }
);
const { data, total, page, total_pages } = await res.json();
console.log(\`총 \${total}개, \${total_pages}페이지\`);

// 필터 조회
const params = new URLSearchParams({
  event_name: "purchase",
  actor_id: "user_123",
  from: "2025-01-01T00:00:00Z",
  to: "2025-12-31T23:59:59Z",
  page: "1",
  page_size: "100",
});
const filtered = await fetch(
  \`${BASE}/api/v1/datasets/\${DATASET_ID}/events?\${params}\`,
  { headers: { "Authorization": \`Bearer \${ADMIN_KEY}\` } }
);`;

const queryPython = `import requests

ADMIN_KEY = "${ADMIN_KEY}"
DATASET_ID = "${DATASET_ID}"

headers = {"Authorization": f"Bearer {ADMIN_KEY}"}
base_url = f"${BASE}/api/v1/datasets/{DATASET_ID}/events"

# 기본 조회
res = requests.get(base_url, headers=headers, params={"page": 1, "page_size": 50})
body = res.json()
print(f"총 {body['data']['total']}개")

# 필터 조회
res = requests.get(base_url, headers=headers, params={
    "event_name": "purchase",
    "actor_id": "user_123",
    "from": "2025-01-01T00:00:00Z",
    "to": "2025-12-31T23:59:59Z",
    "page": 1,
    "page_size": 100,
})`;

// ─── 내보내기 ───────────────────────────────────────────────────────
const exportCurl = `# JSON으로 내보내기
curl "${BASE}/api/v1/datasets/${DATASET_ID}/export.json" \\
  -H "Authorization: Bearer ${ADMIN_KEY}" \\
  -o events.json

# Excel(.xlsx)로 내보내기
curl "${BASE}/api/v1/datasets/${DATASET_ID}/export.xlsx" \\
  -H "Authorization: Bearer ${ADMIN_KEY}" \\
  -o events.xlsx

# 필터 적용 후 내보내기
curl "${BASE}/api/v1/datasets/${DATASET_ID}/export.json?event_name=purchase&from=2025-01-01T00:00:00Z" \\
  -H "Authorization: Bearer ${ADMIN_KEY}" \\
  -o purchases.json`;

const exportJs = `// JSON 내보내기
const res = await fetch(
  \`${BASE}/api/v1/datasets/\${DATASET_ID}/export.json\`,
  { headers: { "Authorization": \`Bearer \${ADMIN_KEY}\` } }
);
const blob = await res.blob();
const url = URL.createObjectURL(blob);
// 브라우저에서 다운로드 트리거
const a = document.createElement("a");
a.href = url; a.download = "events.json"; a.click();`;

const exportPython = `import requests

# JSON 내보내기
res = requests.get(
    f"${BASE}/api/v1/datasets/{DATASET_ID}/export.json",
    headers={"Authorization": f"Bearer {ADMIN_KEY}"},
)
with open("events.json", "wb") as f:
    f.write(res.content)

# Excel 내보내기
res = requests.get(
    f"${BASE}/api/v1/datasets/{DATASET_ID}/export.xlsx",
    headers={"Authorization": f"Bearer {ADMIN_KEY}"},
)
with open("events.xlsx", "wb") as f:
    f.write(res.content)`;

// ─── 이벤트 필드 참조 ──────────────────────────────────────────────
const fields = [
  { name: "event_name", type: "string", required: true, desc: "이벤트 이름 (예: page_view, click, purchase)" },
  { name: "actor_id", type: "string", required: false, desc: "행위자 ID (사용자, 기기 등)" },
  { name: "session_id", type: "string", required: false, desc: "세션 ID" },
  { name: "source", type: "string", required: false, desc: "이벤트 발생 소스 (web, app, api 등)" },
  { name: "status", type: "string", required: false, desc: "이벤트 상태 (success, error 등)" },
  { name: "occurred_at", type: "string (ISO 8601)", required: false, desc: "이벤트 발생 시각. 미입력 시 수신 시각으로 자동 설정" },
  { name: "dim1 ~ dim10", type: "string", required: false, desc: "문자열 차원 필드. 대시보드에서 별칭 설정 가능" },
  { name: "metric1 ~ metric3", type: "number", required: false, desc: "숫자 지표 필드" },
  { name: "payload", type: "object", required: false, desc: "추가 데이터를 JSON 객체로 저장. payload_json 컬럼으로 보관되며, 필터/정렬 불가. 대시보드 '보기' 버튼 및 내보내기(include_payload=true)로 확인 가능" },
];

export default function HelpPage() {
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 overflow-y-auto">
      <main className="max-w-7xl mx-auto w-full px-6 pt-8 pb-16 space-y-12">

        {/* Intro */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">API 도움말</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Rivendell API를 사용해 이벤트를 수집하고 조회하는 방법을 안내합니다.
              수집 키(<code className="font-mono bg-muted px-1 rounded text-xs">ing_...</code>)와
              관리자 키(<code className="font-mono bg-muted px-1 rounded text-xs">adm_...</code>)는
              데이터셋 생성 시 발급됩니다.
            </p>
          </div>
          <Separator />
        </div>

        {/* Section 1: 단건 수집 */}
        <section className="space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded">POST</span>
              <code className="text-sm font-mono">/api/v1/ingest/events</code>
            </div>
            <h2 className="text-xl font-semibold">이벤트 수집</h2>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>수집 키</strong>를 사용해 이벤트를 전송합니다. 한 번의 요청으로 최대 500개까지 배치 전송할 수 있습니다.
            </p>
          </div>
          <HelpCodeBlock curl={ingestCurl} js={ingestJs} python={ingestPython} />
        </section>

        {/* Section 2: 배치 수집 */}
        <section className="space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded">POST</span>
              <code className="text-sm font-mono">/api/v1/ingest/events</code>
            </div>
            <h2 className="text-xl font-semibold">이벤트 배치 수집</h2>
            <p className="text-sm text-muted-foreground mt-1">
              여러 이벤트를 <code className="font-mono bg-muted px-1 rounded text-xs">events</code> 배열에 담아 한 번에 전송합니다.
              각 이벤트는 독립적으로 처리되어 일부 실패해도 나머지는 저장됩니다.
            </p>
          </div>
          <HelpCodeBlock curl={batchCurl} js={batchJs} python={batchPython} />
        </section>

        {/* Section 3: 이벤트 조회 */}
        <section className="space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono bg-green-100 text-green-700 px-2 py-0.5 rounded">GET</span>
              <code className="text-sm font-mono">/api/v1/datasets/{"{dataset_id}"}/events</code>
            </div>
            <h2 className="text-xl font-semibold">이벤트 조회</h2>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>관리자 키</strong>를 사용해 이벤트를 조회합니다. 다양한 필터와 페이지네이션을 지원합니다.
            </p>
          </div>
          <HelpCodeBlock curl={queryCurl} js={queryJs} python={queryPython} />

          {/* Query params table */}
          <div className="border rounded-lg overflow-hidden text-sm">
            <div className="bg-muted px-4 py-2 font-medium text-xs text-muted-foreground uppercase tracking-wide">
              쿼리 파라미터
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">파라미터</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">설명</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">기본값</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { name: "from", desc: "시작 시각 (ISO 8601)", default: "—" },
                  { name: "to", desc: "종료 시각 (ISO 8601)", default: "—" },
                  { name: "event_name", desc: "이벤트 이름 정확 일치", default: "—" },
                  { name: "actor_id", desc: "행위자 ID 정확 일치", default: "—" },
                  { name: "source", desc: "소스 정확 일치", default: "—" },
                  { name: "status", desc: "상태 정확 일치", default: "—" },
                  { name: "dim_col", desc: "검색할 dim 컬럼 (dim1 ~ dim10)", default: "—" },
                  { name: "dim_val", desc: "dim 컬럼 부분 일치 검색값 (dim_col 지정 시 유효)", default: "—" },
                  { name: "page", desc: "페이지 번호", default: "1" },
                  { name: "page_size", desc: "페이지당 항목 수 (최대 200)", default: "50" },
                ].map((p) => (
                  <tr key={p.name}>
                    <td className="px-4 py-2"><code className="font-mono text-xs">{p.name}</code></td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">{p.desc}</td>
                    <td className="px-4 py-2 text-muted-foreground text-xs font-mono">{p.default}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: 내보내기 */}
        <section className="space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono bg-green-100 text-green-700 px-2 py-0.5 rounded">GET</span>
              <code className="text-sm font-mono">/api/v1/datasets/{"{dataset_id}"}/export.json</code>
            </div>
            <h2 className="text-xl font-semibold">데이터 내보내기</h2>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>관리자 키</strong>를 사용해 필터된 데이터를 JSON 또는 Excel 파일로 내보냅니다.
              조회 필터와 동일한 파라미터를 사용할 수 있습니다.
            </p>
          </div>
          <HelpCodeBlock curl={exportCurl} js={exportJs} python={exportPython} />
        </section>

        {/* Section 5: payload_json */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">payload_json</h2>
            <p className="text-sm text-muted-foreground mt-1">
              <code className="font-mono bg-muted px-1 rounded text-xs">payload</code> 필드는
              임의의 JSON 객체를 이벤트에 첨부할 수 있는 자유 형식 필드입니다.
            </p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="border rounded-lg p-4 space-y-2">
              <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">특성</p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>• <code className="font-mono bg-muted px-1 rounded text-xs">payload_json</code> 컬럼에 JSON 문자열로 저장됩니다.</li>
                <li>• <strong className="text-foreground">필터/정렬 불가</strong> — dim·metric 필드와 달리 쿼리 조건에 사용할 수 없습니다.</li>
                <li>• <strong className="text-foreground">대시보드</strong>에서 해당 이벤트 행의 <strong>보기</strong> 버튼으로 JSON을 확인하고 복사할 수 있습니다.</li>
                <li>• <strong className="text-foreground">내보내기</strong> 시 <code className="font-mono bg-muted px-1 rounded text-xs">include_payload=true</code> 파라미터를 추가하면 payload 컬럼이 포함됩니다.</li>
              </ul>
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden text-sm">
            <div className="bg-muted px-4 py-2 font-medium text-xs text-muted-foreground uppercase tracking-wide">수집 예시</div>
            <pre className="p-4 text-xs overflow-x-auto">{`{
  "event_name": "purchase",
  "actor_id": "user_123",
  "metric1": 49900,
  "payload": {
    "product_id": "prod_abc",
    "quantity": 2,
    "coupon": "SUMMER10",
    "user_agent": "Mozilla/5.0 ..."
  }
}`}</pre>
          </div>
        </section>

        {/* Section 6: 이벤트 필드 참조 */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">이벤트 필드 참조</h2>
            <p className="text-sm text-muted-foreground mt-1">
              이벤트 수집 시 사용할 수 있는 필드 목록입니다.
            </p>
          </div>
          <div className="border rounded-lg overflow-hidden text-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">필드</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">타입</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">필수</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">설명</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {fields.map((f) => (
                  <tr key={f.name}>
                    <td className="px-4 py-2"><code className="font-mono text-xs">{f.name}</code></td>
                    <td className="px-4 py-2 text-xs text-muted-foreground font-mono">{f.type}</td>
                    <td className="px-4 py-2 text-xs">
                      {f.required
                        ? <span className="text-red-500 font-medium">필수</span>
                        : <span className="text-muted-foreground">선택</span>}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{f.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>
      </div>
    </div>
  );
}
