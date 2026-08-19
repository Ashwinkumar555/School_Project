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

const runAllTests = async () => {
  console.log('🚀 Starting Comprehensive EduConnect API Verification Suite...\n');
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
    // 1. Health Endpoint
    const health = await makeRequest('/health');
    assert(health.status === 200, 'Health check returns status 200 OK');

    // 2. Roles Catalog
    const roles = await makeRequest('/auth/roles');
    assert(roles.status === 200 && roles.data?.data?.length === 8, 'Supported roles API returns all 8 EduConnect roles');

    // 3. Login for all 8 roles
    const demoLogins = [
      { email: 'headmaster@school.gov.in', expectedRole: 'headmaster_admin' },
      { email: 'teacher@school.gov.in', expectedRole: 'teacher' },
      { email: 'student@school.gov.in', expectedRole: 'student' },
      { email: 'parent@village.org', expectedRole: 'parent' },
      { email: 'localhead@village.gov.in', expectedRole: 'village_head' },
      { email: 'villager@village.org', expectedRole: 'community_member' },
      { email: 'alumni@school.gov.in', expectedRole: 'alumni' },
      { email: 'ngo@gramin.org', expectedRole: 'ngo' },
    ];

    const tokens = {};
    for (const d of demoLogins) {
      const loginRes = await makeRequest('/auth/login', 'POST', {
        email: d.email,
        password: 'Password123!',
      });
      const token = loginRes.data?.data?.token;
      tokens[d.expectedRole] = token;
      assert(
        loginRes.status === 200 && token && loginRes.data?.data?.user?.role === d.expectedRole,
        `Login successful for role: ${d.expectedRole} (${d.email})`
      );
    }

    // 4. Role-Based Privacy Check
    const villagerStudentAccess = await makeRequest('/students', 'GET', null, tokens['community_member']);
    assert(
      villagerStudentAccess.status === 403,
      'Privacy Check: Villagers are blocked (403 Forbidden) from viewing private student academic rosters'
    );

    const localHeadStudentAccess = await makeRequest('/students', 'GET', null, tokens['village_head']);
    assert(
      localHeadStudentAccess.status === 403,
      'Privacy Check: Local Head is blocked (403 Forbidden) from viewing private student academic rosters'
    );

    // 5. Core Flow 1: Early Attention Indicator Verification
    const attentionSummary = await makeRequest('/early-attention/dashboard', 'GET', null, tokens['headmaster_admin']);
    assert(
      attentionSummary.status === 200 && attentionSummary.data?.data?.highAttention?.length >= 0,
      'Early Attention dashboard evaluates students using rule-based metrics'
    );

    // 6. Core Flow 2: MOST IMPORTANT END-TO-END WORKFLOW
    console.log('\n--- Testing Core Flow 2: School Need -> Drive -> Contribution -> Verification ---');

    // Step A: Admin creates "2 Laptops Needed"
    const createNeedRes = await makeRequest(
      '/school-needs',
      'POST',
      {
        title: '2 Laptops Needed for Computer Laboratory',
        description: 'Need 2 laptops for student programming and practicals',
        category: 'IT & Computers',
        urgency: 'High',
        targetDepartment: 'Computer Lab',
        requiredQuantity: 2,
        unit: 'Laptops',
      },
      tokens['headmaster_admin']
    );

    const createdNeed = createNeedRes.data?.data;
    assert(
      createNeedRes.status === 201 && createdNeed?.requiredQuantity === 2 && createdNeed?.remainingQuantity === 2 && createdNeed?.receivedQuantity === 0,
      'Step A: Admin creates School Need: Required = 2, Received = 0, Remaining = 2'
    );

    // Step B: Local Head creates Community Support Drive
    const createDriveRes = await makeRequest(
      '/drives',
      'POST',
      {
        title: 'Sundarpur Digital Literacy Drive',
        description: 'Village drive for 2 laptops',
        schoolNeedId: createdNeed._id,
        targetQuantity: 2,
        impactMessage: 'Digital education for all children',
      },
      tokens['village_head']
    );

    const createdDrive = createDriveRes.data?.data;
    assert(
      createDriveRes.status === 201 && createdDrive?._id,
      'Step B: Local Head creates Community Drive linked to verified School Need'
    );

    // Step C: Villager clicks "I CAN HELP" and pledges 1 Laptop
    const pledgeRes = await makeRequest(
      '/contributions',
      'POST',
      {
        driveId: createdDrive._id,
        contributionType: 'Donate Item',
        itemDetails: 'Dell Latitude Core i5 Laptop',
        quantity: 1,
        estimatedValue: 35000,
        notes: 'Pledging 1 brand new laptop for school lab',
      },
      tokens['community_member']
    );

    const pledge = pledgeRes.data?.data;
    assert(
      pledgeRes.status === 201 && pledge?.status === 'PENDING',
      'Step C: Villager pledges 1 Laptop -> Contribution status is PENDING'
    );

    // Step D: Admin approves the pledge (Must NOT immediately update inventory)
    const approveRes = await makeRequest(
      `/contributions/${pledge._id}/review`,
      'PUT',
      {
        action: 'APPROVE',
        adminRemarks: 'Approved for Computer Lab ICT curriculum.',
      },
      tokens['headmaster_admin']
    );

    assert(
      approveRes.status === 200 && approveRes.data?.data?.status === 'APPROVED',
      'Step D1: Admin approves pledge -> Status becomes APPROVED'
    );

    // Verify inventory has NOT increased yet
    const invCheck1 = await makeRequest('/inventory', 'GET', null, tokens['headmaster_admin']);
    const laptopsInInv1 = invCheck1.data?.data?.filter((i) => i.linkedContribution === pledge._id) || [];
    assert(
      laptopsInInv1.length === 0,
      'Step D2: Approved status does NOT prematurely increment inventory'
    );

    // Step E: Admin marks contribution as physically RECEIVED with Asset Tag
    const markReceivedRes = await makeRequest(
      `/contributions/${pledge._id}/mark-received`,
      'POST',
      {
        assetTag: 'EDU-IT-2025-002',
        location: 'Computer Lab',
        condition: 'New',
        verificationNotes: 'Unboxed and verified working.',
      },
      tokens['headmaster_admin']
    );

    assert(
      markReceivedRes.status === 200 && markReceivedRes.data?.data?.contribution?.status === 'RECEIVED',
      'Step E1: Admin marks as RECEIVED with Asset Tag EDU-IT-2025-002'
    );

    const updatedNeed = markReceivedRes.data?.data?.updatedNeed;
    assert(
      updatedNeed?.requiredQuantity === 2 && updatedNeed?.receivedQuantity === 1 && updatedNeed?.remainingQuantity === 1,
      'Step E2: School Need counters verified: Required = 2, Received = 1, Remaining = 1'
    );

    // Verify item was created in Inventory with Asset Tag
    const invCheck2 = await makeRequest('/inventory', 'GET', null, tokens['headmaster_admin']);
    const verifiedAsset = invCheck2.data?.data?.find((i) => i.assetTag === 'EDU-IT-2025-002');
    assert(
      verifiedAsset && verifiedAsset.itemName === 'Dell Latitude Core i5 Laptop',
      'Step E3: Physical asset cataloged in Inventory with Asset Tag EDU-IT-2025-002'
    );

    // Step F: Reverse Case Test (Admin Rejects a pledge -> Quantities do NOT change)
    const pledge2Res = await makeRequest(
      '/contributions',
      'POST',
      {
        driveId: createdDrive._id,
        contributionType: 'Donate Item',
        itemDetails: 'Broken CRT Monitor',
        quantity: 1,
      },
      tokens['community_member']
    );

    const pledge2 = pledge2Res.data?.data;
    const rejectRes = await makeRequest(
      `/contributions/${pledge2._id}/review`,
      'PUT',
      {
        action: 'REJECT',
        adminRemarks: 'Item specifications do not meet school lab requirements.',
      },
      tokens['headmaster_admin']
    );

    assert(
      rejectRes.status === 200 && rejectRes.data?.data?.status === 'REJECTED',
      'Step F1: Admin rejects unsuitable pledge -> Status becomes REJECTED'
    );

    const needCheckAfterReject = await makeRequest(`/school-needs/${createdNeed._id}`);
    assert(
      needCheckAfterReject.data?.data?.receivedQuantity === 1 && needCheckAfterReject.data?.data?.remainingQuantity === 1,
      'Step F2: Rejected pledge does NOT alter School Need received or remaining quantities'
    );

    // Step G: Community Impact Endpoint
    const impactRes = await makeRequest('/impact/stats');
    assert(
      impactRes.status === 200 && impactRes.data?.data?.summary?.totalItemsVerified >= 1,
      'Step G: Community Impact Dashboard reflects verified contributions'
    );

    // 7. Announcements & Reports
    const annRes = await makeRequest('/announcements');
    assert(annRes.status === 200 && Array.isArray(annRes.data?.data), 'Announcements API operational');

    const reportRes = await makeRequest('/reports/school-summary', 'GET', null, tokens['headmaster_admin']);
    assert(reportRes.status === 200 && reportRes.data?.data?.students?.total >= 0, 'School summary analytics report operational');

    console.log(`\n========================================`);
    console.log(`📊 TEST SUITE SUMMARY:`);
    console.log(`✅ Total Tests Passed: ${passed}`);
    console.log(`❌ Total Tests Failed: ${failed}`);
    console.log(`========================================\n`);
  } catch (error) {
    console.error('Fatal test error:', error);
  }
};

runAllTests();
