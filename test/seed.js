#!/usr/bin/env node
/**
 * Usage:
 *   node test/seed.js <dataset_id> <ingest_key> [base_url]
 *
 * Example:
 *   node test/seed.js ds_01abc... ing_xyz... http://localhost:3000
 */

const DATASET_ID = process.argv[2];
const INGEST_KEY = process.argv[3];
const BASE_URL = process.argv[4] ?? "http://localhost:3000";

if (!DATASET_ID || !INGEST_KEY) {
  console.error("Usage: node test/seed.js <dataset_id> <ingest_key> [base_url]");
  process.exit(1);
}

// ── Sample data pools ──────────────────────────────────────────────

const EVENT_NAMES = [
  "page_view", "page_view", "page_view",           // 높은 빈도
  "button_click", "button_click",
  "form_submit", "form_submit",
  "signup", "login", "logout",
  "purchase", "add_to_cart", "remove_from_cart",
  "search", "filter_applied",
  "video_play", "video_pause", "video_complete",
  "download", "share",
  "error_occurred", "timeout",
];

const SOURCES = ["web", "mobile_ios", "mobile_android", "api", "sdk"];
const STATUSES = ["success", "success", "success", "failure", "pending"];
const PAGES = ["/", "/pricing", "/docs", "/login", "/signup", "/dashboard", "/settings", "/about"];
const BROWSERS = ["Chrome", "Firefox", "Safari", "Edge"];
const COUNTRIES = ["KR", "US", "JP", "DE", "FR", "GB", "SG", "AU"];
const PLANS = ["free", "free", "pro", "enterprise"];

// ── Helpers ────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

/** 최근 30일 내 랜덤 ISO 시각 */
function randDate() {
  const now = Date.now();
  const ago30 = now - 30 * 24 * 60 * 60 * 1000;
  return new Date(ago30 + Math.random() * (now - ago30)).toISOString();
}

function actorId(n) {
  return `user_${String(n).padStart(4, "0")}`;
}

function sessionId() {
  return `sess_${Math.random().toString(36).slice(2, 10)}`;
}

// ── Event generator ────────────────────────────────────────────────

function makeEvent() {
  const event_name = pick(EVENT_NAMES);
  const actor = randInt(1, 80); // 80명의 유저가 반복 활동

  const base = {
    event_name,
    actor_id: actorId(actor),
    session_id: sessionId(),
    source: pick(SOURCES),
    status: pick(STATUSES),
    occurred_at: randDate(),
    dim1: pick(PAGES),           // page
    dim2: pick(BROWSERS),        // browser
    dim3: pick(COUNTRIES),       // country
    dim4: pick(PLANS),           // plan
  };

  // 이벤트 종류별 추가 데이터
  if (event_name === "purchase") {
    return {
      ...base,
      dim5: pick(["card", "paypal", "transfer"]),
      metric1: randFloat(5, 500),   // amount
      metric2: randInt(1, 10),      // quantity
      payload: { currency: "USD", coupon: Math.random() > 0.8 ? "SAVE10" : null },
    };
  }

  if (event_name === "page_view") {
    return {
      ...base,
      metric1: randInt(1, 120),     // duration_sec
      metric2: randFloat(0, 100),   // scroll_depth_%
    };
  }

  if (event_name === "search") {
    const queries = ["pricing", "api docs", "export", "dashboard", "getting started", "webhook"];
    return {
      ...base,
      dim5: pick(queries),
      metric1: randInt(0, 30),      // result_count
    };
  }

  if (event_name === "error_occurred") {
    const codes = ["404", "500", "403", "422", "timeout"];
    return {
      ...base,
      dim5: pick(codes),
      payload: { url: pick(PAGES), message: "Something went wrong" },
    };
  }

  return base;
}

// ── Main ───────────────────────────────────────────────────────────

async function seed(total = 500) {
  const BATCH = 500; // API 최대 배치 크기
  const batches = Math.ceil(total / BATCH);
  let accepted = 0;
  let failed = 0;

  console.log(`Seeding ${total} events to ${DATASET_ID} via ${BASE_URL} ...`);

  for (let b = 0; b < batches; b++) {
    const size = Math.min(BATCH, total - b * BATCH);
    const payload = {
      dataset_id: DATASET_ID,
      events: Array.from({ length: size }, makeEvent),
    };

    const res = await fetch(`${BASE_URL}/api/v1/ingest/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${INGEST_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      console.error(`Batch ${b + 1} failed:`, json);
      process.exit(1);
    }

    accepted += json.data.accepted;
    failed += json.data.failed;
    console.log(`Batch ${b + 1}/${batches}: accepted=${json.data.accepted} failed=${json.data.failed}`);
  }

  console.log(`\nDone. total accepted=${accepted}, failed=${failed}`);
}

seed(500).catch((e) => { console.error(e); process.exit(1); });
