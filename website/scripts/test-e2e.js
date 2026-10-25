const http = require('http');

async function runE2ETests() {
  console.log('--- Running End-to-End Flow Verification ---');

  // Helper function to make requests
  function request(method, path, body = null, cookie = null) {
    return new Promise((resolve, reject) => {
      const payload = body ? (typeof body === 'string' ? body : new URLSearchParams(body).toString()) : null;
      const headers = {};
      if (payload) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        headers['Content-Length'] = Buffer.byteLength(payload);
      }
      if (cookie) {
        headers['Cookie'] = cookie;
      }

      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path,
        method,
        headers
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            cookie: res.headers['set-cookie'] ? res.headers['set-cookie'][0].split(';')[0] : null
          });
        });
      });

      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  // 1. Unauthenticated / -> 302 to /login
  const res1 = await request('GET', '/');
  console.log('1. GET / unauthenticated -> Status:', res1.statusCode, 'Location:', res1.headers.location);
  if (res1.statusCode !== 302 || res1.headers.location !== '/login') throw new Error('Unauthenticated / must redirect to /login');

  // 2. Register with empty fields -> 400 with 4 error messages
  const res2 = await request('POST', '/register', { name: '', email: '', password: '', confirm_password: '' });
  console.log('2. POST /register (empty) -> Status:', res2.statusCode);
  const requiredMsgs = ['Name is required', 'Email is required', 'Password is required', 'Confirm password is required'];
  for (const msg of requiredMsgs) {
    if (!res2.body.includes(msg)) throw new Error(`Missing error message: ${msg}`);
  }
  console.log('   All 4 required empty field messages verified!');

  // 3. Register valid user -> 302 redirect
  const userEmail = `student_${Date.now()}@mail.com`;
  const res3 = await request('POST', '/register', {
    name: 'Omar Tarek',
    email: userEmail,
    password: 'password123',
    confirm_password: 'password123'
  });
  console.log('3. POST /register (valid) -> Status:', res3.statusCode, 'Location:', res3.headers.location);
  if (res3.statusCode !== 302) throw new Error('Valid register must redirect');
  const userCookie = res3.cookie;

  // 4. Duplicate register -> 400 "Email Already Exists"
  const res4 = await request('POST', '/register', {
    name: 'Duplicate Omar',
    email: userEmail,
    password: 'password123',
    confirm_password: 'password123'
  });
  console.log('4. POST /register (duplicate email) -> Status:', res4.statusCode);
  if (!res4.body.includes('Email Already Exists')) throw new Error('Missing "Email Already Exists" message');
  console.log('   "Email Already Exists" verified!');

  // 5. Login wrong password -> 400 "Invalid email or password"
  const res5 = await request('POST', '/login', {
    email: userEmail,
    password: 'wrong_password'
  });
  console.log('5. POST /login (wrong password) -> Status:', res5.statusCode);
  if (!res5.body.includes('Invalid email or password')) throw new Error('Missing "Invalid email or password" message');
  console.log('   "Invalid email or password" verified!');

  // 6. Access dashboard with session cookie
  const res6 = await request('GET', '/', null, userCookie);
  console.log('6. GET / (authenticated) -> Status:', res6.statusCode);
  if (!res6.body.includes('Hi, <strong>Omar Tarek</strong>') && !res6.body.includes('Omar Tarek')) {
    throw new Error('Dashboard must show student name');
  }

  // 7. Add study task -> 302
  const res7 = await request('POST', '/todos/add', { title: 'Study Database Normalization Chapter 14' }, userCookie);
  console.log('7. POST /todos/add -> Status:', res7.statusCode, 'Location:', res7.headers.location);

  // 8. View updated list
  const res8 = await request('GET', '/', null, userCookie);
  if (!res8.body.includes('Study Database Normalization Chapter 14')) throw new Error('Added task not found in list');
  console.log('8. Added study task displayed in student task list!');

  console.log('\n🎉 ALL END-TO-END TESTS PASSED SUCCESSFULLY! 🎉\n');
}

runE2ETests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
