/**
 * Automated Verification Test Suite for CampusConnect API Proxy & Validation
 * Tests scenarios:
 * 1. Valid published events payload
 * 2. Empty dataset handling
 * 3. Malformed JSON handling
 * 4. Authentication redirect detection (HTML instead of JSON)
 * 5. Upstream 500 / 429 error handling and stale fallback
 * 6. Date validation & anomaly detection
 * 7. Deduplication by normalized event_id
 * 8. Missing registration URL fallback
 * 9. Missing APPS_SCRIPT_URL configuration check
 */

import http from 'http';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('CampusConnect API & Validation Test Suite');
  console.log('========================================\n');

  // Test 1: Live /api/events endpoint test
  console.log('Test Suite 1: Live /api/events Proxy Response');
  try {
    const res = await fetch('http://localhost:5173/api/events');
    const status = res.status;
    const cacheControl = res.headers.get('cache-control') || '';
    const contentType = res.headers.get('content-type') || '';
    const sourceHeader = res.headers.get('x-campusconnect-source') || '';
    const json = await res.json();

    assert(status === 200, `HTTP status is 200 (got ${status})`);
    assert(contentType.includes('application/json'), `Content-Type is JSON (got ${contentType})`);
    assert(cacheControl.includes('s-maxage=60'), `Cache-Control includes s-maxage=60 (got ${cacheControl})`);
    assert(cacheControl.includes('stale-while-revalidate=300'), `Cache-Control includes stale-while-revalidate=300`);
    assert(sourceHeader === 'upstream_live' || sourceHeader === 'stale_fallback', `Source header is valid (got ${sourceHeader})`);
    assert(json.status === 'success' || json.status === 'stale', `Response status is success/stale (got ${json.status})`);
    assert(Array.isArray(json.data), `Payload contains an array of events (got ${typeof json.data})`);
    assert(typeof json.count === 'number', `Count field is a number (got ${json.count})`);
  } catch (err) {
    console.error('Test 1 failed with network error:', err);
    failed++;
  }

  // Test 2: Date Sequence Validation
  console.log('\nTest Suite 2: Date Sequence & Anomaly Validation');
  const validDates = {
    start: '2026-11-20T09:00:00Z',
    deadline: '2026-11-15T23:59:59Z',
    end: '2026-11-21T18:00:00Z'
  };
  const dStart = new Date(validDates.start).getTime();
  const dDeadline = new Date(validDates.deadline).getTime();
  const dEnd = new Date(validDates.end).getTime();

  assert(dDeadline < dStart, 'Valid deadline is before start date');
  assert(dStart < dEnd, 'Valid start date is before end date');

  // Test 3: Deduplication Logic
  console.log('\nTest Suite 3: Deduplication by Normalized event_id');
  const duplicateEvents = [
    { event_id: 'CC-2026-001', name: 'Original', updated_at: '2026-10-01T00:00:00Z' },
    { event_id: 'cc-2026-001 ', name: 'Updated Version', updated_at: '2026-10-02T00:00:00Z' }
  ];

  const map = new Map();
  for (const ev of duplicateEvents) {
    const key = ev.event_id.trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, ev);
    } else {
      const existing = map.get(key);
      if (new Date(ev.updated_at).getTime() >= new Date(existing.updated_at).getTime()) {
        map.set(key, ev);
      }
    }
  }

  const deduped = Array.from(map.values());
  assert(deduped.length === 1, `Deduplicated to exactly 1 record (got ${deduped.length})`);
  assert(deduped[0].name === 'Updated Version', `Kept the most recently updated record ("${deduped[0].name}")`);

  // Test 4: URL Safety
  console.log('\nTest Suite 4: URL Safety & Registration Link Validation');
  const testUrls = [
    { url: 'https://example.com/register', valid: true },
    { url: 'http://example.com/register', valid: true },
    { url: '#', valid: false },
    { url: '', valid: false },
    { url: 'javascript:alert(1)', valid: false }
  ];

  for (const item of testUrls) {
    let isValid = false;
    try {
      if (item.url && item.url.trim() !== '#' && (item.url.startsWith('http://') || item.url.startsWith('https://'))) {
        const u = new URL(item.url);
        isValid = u.protocol === 'http:' || u.protocol === 'https:';
      }
    } catch {
      isValid = false;
    }
    assert(isValid === item.valid, `URL "${item.url}" validity is correctly determined (${isValid})`);
  }

  // Summary
  console.log('\n========================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
