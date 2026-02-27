/**
 * Verification script for group-admin change-request APIs.
 * Run with: node scripts/verify-group-admin-api.js
 * Requires: server running (npm run dev) and seeded DB (npm run db:seed).
 */
const http = require('http');

const BASE = process.env.API_BASE || 'http://localhost:3000/api';

function request(method, path, body = null, token = null) {
  const url = new URL(path.startsWith('http') ? path : BASE + path);
  const options = {
    hostname: url.hostname,
    port: url.port || 80,
    path: url.pathname + url.search,
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) options.headers['Authorization'] = 'Bearer ' + token;
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null,
          });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('Verifying group-admin APIs at', BASE, '\n');

  // 1) No token -> 401
  const noToken = await request('GET', '/group-admin/change-requests/current');
  if (noToken.status !== 401) {
    console.error('FAIL: GET /change-requests/current without token expected 401, got', noToken.status);
    process.exit(1);
  }
  console.log('OK: GET /change-requests/current without token -> 401');

  // 2) Invalid token -> 401
  const badToken = await request('GET', '/group-admin/change-requests/current', null, 'invalid');
  if (badToken.status !== 401) {
    console.error('FAIL: GET /change-requests/current with invalid token expected 401, got', badToken.status);
    process.exit(1);
  }
  console.log('OK: GET /change-requests/current with invalid token -> 401');

  // 3) Login as member to get token
  const loginRes = await request('POST', '/auth/login', {
    email: 'john@mess.com',
    password: 'Password@123',
  });
  if (loginRes.status !== 200 || !loginRes.body?.data?.token) {
    console.error('FAIL: Login failed. Is server running and DB seeded?', loginRes.status, loginRes.body);
    process.exit(1);
  }
  const memberToken = loginRes.body.data.token;
  console.log('OK: Login as member -> token received');

  // 4) GET current (member) -> 200, no pending or has data
  const current = await request('GET', '/group-admin/change-requests/current', null, memberToken);
  if (current.status !== 200) {
    console.error('FAIL: GET /change-requests/current as member expected 200, got', current.status, current.body);
    process.exit(1);
  }
  console.log('OK: GET /change-requests/current as member -> 200');

  // 5) POST create without candidateId -> 400
  const createBad = await request('POST', '/group-admin/change-requests', {}, memberToken);
  if (createBad.status !== 400) {
    console.error('FAIL: POST /change-requests without candidateId expected 400, got', createBad.status);
    process.exit(1);
  }
  console.log('OK: POST /change-requests without candidateId -> 400');

  // 6) Get list of users as admin to get member id (login admin)
  const adminLogin = await request('POST', '/auth/login', {
    email: 'admin@mess.com',
    password: 'Admin@2024',
  });
  if (adminLogin.status !== 200 || !adminLogin.body?.data?.token) {
    console.error('FAIL: Admin login failed', adminLogin.status);
    process.exit(1);
  }
  const adminToken = adminLogin.body.data.token;
  const usersRes = await request('GET', '/users?limit=10', null, adminToken);
  if (usersRes.status !== 200 || !usersRes.body?.data?.users) {
    console.error('FAIL: GET /users failed', usersRes.status);
    process.exit(1);
  }
  const members = usersRes.body.data.users.filter(u => u.role === 'member');
  const candidate = members.find(m => m.email === 'mahbub@mess.com') || members[0];
  if (!candidate) {
    console.error('FAIL: No member found for candidate');
    process.exit(1);
  }

  // 7) POST create with candidateId (member) -> 201
  const create = await request('POST', '/group-admin/change-requests', {
    candidateId: candidate._id || candidate.id,
  }, memberToken);
  if (create.status !== 201) {
    console.error('FAIL: POST /change-requests with candidateId expected 201, got', create.status, create.body);
    process.exit(1);
  }
  const requestId = create.body?.data?._id;
  if (!requestId) {
    console.error('FAIL: Create response missing request _id', create.body);
    process.exit(1);
  }
  console.log('OK: POST /change-requests -> 201, requestId:', requestId);

  // 8) GET current again -> 200 with request
  const current2 = await request('GET', '/group-admin/change-requests/current', null, memberToken);
  if (current2.status !== 200 || !current2.body?.data?.request) {
    console.error('FAIL: GET /change-requests/current should return request after create', current2.status, current2.body);
    process.exit(1);
  }
  console.log('OK: GET /change-requests/current returns pending request');

  // 9) Vote as same member again -> 400 (already voted)
  const voteDup = await request('POST', `/group-admin/change-requests/${requestId}/vote`, null, memberToken);
  if (voteDup.status !== 400) {
    console.error('FAIL: Duplicate vote expected 400, got', voteDup.status);
    process.exit(1);
  }
  console.log('OK: Duplicate vote -> 400');

  // 10) Vote as second member (mahbub)
  const mahbubLogin = await request('POST', '/auth/login', {
    email: 'mahbub@mess.com',
    password: 'Password@123',
  });
  if (mahbubLogin.status !== 200 || !mahbubLogin.body?.data?.token) {
    console.error('FAIL: Mahbub login failed', mahbubLogin.status);
    process.exit(1);
  }
  const vote2 = await request('POST', `/group-admin/change-requests/${requestId}/vote`, null, mahbubLogin.body.data.token);
  if (vote2.status !== 200) {
    console.error('FAIL: Second member vote expected 200, got', vote2.status, vote2.body);
    process.exit(1);
  }
  console.log('OK: Second member vote -> 200');

  // 11) Vote as third member (rafiqul) - may complete the election
  const rafiqulLogin = await request('POST', '/auth/login', {
    email: 'rafiqul@mess.com',
    password: 'Password@123',
  });
  if (rafiqulLogin.status === 200 && rafiqulLogin.body?.data?.token) {
    const vote3 = await request('POST', `/group-admin/change-requests/${requestId}/vote`, null, rafiqulLogin.body.data.token);
    if (vote3.status !== 200) {
      console.error('FAIL: Third member vote expected 200, got', vote3.status);
      process.exit(1);
    }
    console.log('OK: Third member vote -> 200 (election may be completed)');
  }

  // 12) GET current after votes -> 200 (null if completed)
  const current3 = await request('GET', '/group-admin/change-requests/current', null, memberToken);
  if (current3.status !== 200) {
    console.error('FAIL: GET /change-requests/current after votes expected 200, got', current3.status);
    process.exit(1);
  }
  console.log('OK: GET /change-requests/current after votes -> 200');

  console.log('\nAll group-admin API checks passed.');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
