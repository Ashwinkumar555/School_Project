import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

const makeRequest = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    const fullPath = cleanPath.startsWith('/api') ? cleanPath : '/api' + cleanPath;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: fullPath,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runSuite = async () => {
  console.log('🧪 Starting EduConnect 8-Role Authentication Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${title}`);
      failed++;
    }
  };

  try {
    // 1. Check Supported Roles (All 8 Roles)
    const rolesRes = await makeRequest('/auth/roles');
    assert(rolesRes.status === 200, 'GET /auth/roles returns 200');
    const roles = rolesRes.data?.data || [];
    assert(roles.length === 8, 'Exactly 8 official roles supported');
    const roleIds = roles.map((r) => r.id);
    const expectedRoles = [
      'village_head',
      'alumni',
      'ngo',
      'headmaster_admin',
      'teacher',
      'parent',
      'student',
      'villager',
    ];
    for (const r of expectedRoles) {
      assert(roleIds.includes(r), `Role '${r}' is included in official roles`);
    }

    // 2. Define real test users for each of the 8 roles with run-unique identifiers
    const runId = Math.floor(1000 + Math.random() * 9000);
    const testUsers = [
      {
        role: 'village_head',
        pNo: `VHD-${runId}1`,
        name: 'Murugan Sarpanch',
        phone: `9840${runId}1`,
        aadhaarNumber: `11112222${runId}`,
        wrongRole: 'student',
      },
      {
        role: 'alumni',
        pNo: `ALM-${runId}2`,
        name: 'Karthik Raja',
        phone: `9840${runId}2`,
        aadhaarNumber: `11112223${runId}`,
        wrongRole: 'teacher',
      },
      {
        role: 'ngo',
        pNo: `NGO-${runId}3`,
        name: 'Shreya Sengupta',
        phone: `9840${runId}3`,
        aadhaarNumber: `11112224${runId}`,
        wrongRole: 'villager',
      },
      {
        role: 'headmaster_admin',
        pNo: `HMA-${runId}4`,
        name: 'Dr. Meenakshi Sundaram',
        phone: `9840${runId}4`,
        aadhaarNumber: `11112225${runId}`,
        schoolName: 'Govt Higher Secondary School',
        wrongRole: 'parent',
      },
      {
        role: 'teacher',
        pNo: `TCH-${runId}5`,
        name: 'Bharath Srinivasan',
        phone: `9840${runId}5`,
        aadhaarNumber: `11112226${runId}`,
        wrongRole: 'headmaster_admin',
      },
      {
        role: 'parent',
        pNo: `PAR-${runId}6`,
        name: 'Lakshmi Narayanan',
        phone: `9840${runId}6`,
        aadhaarNumber: `11112227${runId}`,
        wrongRole: 'alumni',
      },
      {
        role: 'student',
        pNo: `STD-${runId}7`,
        name: 'Dinesh Kumar',
        phone: `9840${runId}7`,
        aadhaarNumber: `11112228${runId}`,
        wrongRole: 'teacher',
      },
      {
        role: 'villager',
        pNo: `VIL-${runId}8`,
        name: 'Annamalai Karuppan',
        phone: `9840${runId}8`,
        aadhaarNumber: `11112229${runId}`,
        wrongRole: 'student',
      },
    ];

    console.log('\n--- Testing Full Lifecycle for all 8 Roles individually ---\n');

    for (const u of testUsers) {
      console.log(`\n▶ Testing Role: ${u.role} (User: ${u.name}, P.No: ${u.pNo})`);

      // Step A: Request OTP for Phone
      const otpRes = await makeRequest('/auth/send-otp', 'POST', { phone: u.phone });
      assert(otpRes.status === 200, `Send OTP to ${u.phone} succeeded`);
      const otp = otpRes.data?.data?.otp;
      assert(otp && otp.length === 6, `Received 6-digit OTP (${otp})`);

      // Step B: Registration (Phone Number, Name, Aadhaar, OTP - NO P.No from UI)
      const regPayload = {
        role: u.role,
        name: u.name,
        phone: u.phone,
        aadhaarNumber: u.aadhaarNumber,
        otp,
        ...(u.schoolName ? { schoolName: u.schoolName } : {}),
      };

      const regRes = await makeRequest('/auth/register', 'POST', regPayload);
      assert(regRes.status === 201, `Registration for ${u.role} succeeded with status 201`);
      assert(regRes.data?.data?.user?.role === u.role, `Registered role stored permanently as '${u.role}'`);
      assert(regRes.data?.data?.user?.name === u.name, `Registered name stored dynamically as '${u.name}'`);
      assert(regRes.data?.data?.user?.phone === u.phone, `Phone number stored as '${u.phone}'`);
      assert(
        regRes.data?.data?.user?.aadhaarNumber === undefined,
        `Aadhaar number stripped from response for security`
      );

      // Step C: Duplicate Registration Check
      const dupOtpRes = await makeRequest('/auth/send-otp', 'POST', { phone: u.phone });
      const dupOtp = dupOtpRes.data?.data?.otp;
      const dupRes = await makeRequest('/auth/register', 'POST', { ...regPayload, otp: dupOtp });
      assert(
        dupRes.status === 400 && dupRes.data?.message?.includes('already exists'),
        `Duplicate registration for ${u.phone} rejected with 400`
      );

      // Step D: Login with Mismatched Role using Phone Number
      const loginOtpRes = await makeRequest('/auth/send-otp', 'POST', { phone: u.phone });
      const loginOtp = loginOtpRes.data?.data?.otp;
      const mismatchLoginRes = await makeRequest('/auth/login', 'POST', {
        role: u.wrongRole,
        phone: u.phone,
        otp: loginOtp,
      });
      assert(
        mismatchLoginRes.status === 403 &&
          mismatchLoginRes.data?.message === 'Selected role does not match your registered role.',
        `Mismatched role login strictly rejected with error: 'Selected role does not match your registered role.'`
      );

      // Step E: Login with Correct Role using Phone Number
      const validLoginOtpRes = await makeRequest('/auth/send-otp', 'POST', { phone: u.phone });
      const validLoginOtp = validLoginOtpRes.data?.data?.otp;
      const loginRes = await makeRequest('/auth/login', 'POST', {
        role: u.role,
        phone: u.phone,
        otp: validLoginOtp,
      });
      assert(loginRes.status === 200, `Login with Phone Number & OTP succeeded`);
      const token = loginRes.data?.data?.token;
      assert(token, `JWT auth token issued for ${u.role}`);
      assert(loginRes.data?.data?.user?.role === u.role, `Returned authenticated user role is '${u.role}'`);
      assert(loginRes.data?.data?.user?.name === u.name, `Dynamic name returned: '${u.name}'`);

      // Step F: Session Restore / Verification via /api/auth/me
      const meRes = await makeRequest('/auth/me', 'GET', null, token);
      assert(meRes.status === 200, `Session restore (/api/auth/me) succeeded`);
      assert(meRes.data?.data?.user?.role === u.role, `Verified session role is '${u.role}'`);
      assert(meRes.data?.data?.user?.name === u.name, `Verified session name is '${u.name}'`);
      assert(
        meRes.data?.data?.user?.aadhaarNumber === undefined,
        `Aadhaar number never exposed in session`
      );

      // Step G: Phone Number format verification
      assert(meRes.data?.data?.user?.phone === u.phone, `Verified session phone matches '${u.phone}'`);
    }

    console.log(`\n=================================================`);
    console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`=================================================\n`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Test suite fatal error:', err.message);
    process.exit(1);
  }
};

runSuite();
