import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: Number(__ENV.VUS || 100),
  duration: __ENV.DURATION || '2m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

const BASE = __ENV.BASE_URL || 'http://127.0.0.1:3000';

export default function () {
  check(http.get(`${BASE}/api/health/ping`), {
    'health ping ok': (r) => r.status === 200,
  });
  check(http.get(`${BASE}/api/search/health`), {
    'search health ok': (r) => r.status === 200,
  });
  sleep(1);
}
