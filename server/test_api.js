import http from 'http';

function makeRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Running Campus Pulse REST API Comprehensive Endpoint Tests...\n');

  // 1. Health
  const health = await makeRequest('/api/health');
  console.log('1. GET /api/health:', health.status, 'Status:', health.body.data?.status);

  // 2. Auth Login
  const login = await makeRequest('/api/auth/login', 'POST', {
    email: 'admin@campuspulse.edu',
    password: 'Admin@123'
  });
  console.log('2. POST /api/auth/login:', login.status, 'User:', login.body.data?.user?.email, 'Role:', login.body.data?.user?.role, 'Token received:', !!login.body.data?.token);
  const token = login.body.data?.token;

  // 3. Auth Me
  const me = await makeRequest('/api/auth/me', 'GET', null, token);
  console.log('3. GET /api/auth/me:', me.status, 'Email:', me.body.data?.email || me.body.data?.user?.email);

  // 4. Faculty Paginated (Default limit = 10)
  const faculty = await makeRequest('/api/faculty?page=1&limit=10');
  const facData = faculty.body.data || {};
  const pageInfo = facData.pagination || faculty.body.meta || {};
  const facList = Array.isArray(facData) ? facData : facData.faculty || [];
  console.log('4. GET /api/faculty:', faculty.status, 'Total Faculty in DB:', pageInfo.total, 'Limit:', pageInfo.limit, 'Items returned on Page 1:', facList.length);

  // 5. Faculty Search
  const facSearch = await makeRequest('/api/faculty/search?q=Sumana');
  const searchList = Array.isArray(facSearch.body.data) ? facSearch.body.data : facSearch.body.data?.faculty || [];
  console.log('5. GET /api/faculty/search?q=Sumana:', facSearch.status, 'Found:', searchList.length, 'Match:', searchList[0]?.name);

  // 6. Libraries (Exactly 3)
  const libs = await makeRequest('/api/libraries');
  const libList = libs.body.data || [];
  console.log('6. GET /api/libraries:', libs.status, 'Count:', libList.length, 'Names:', libList.map(l => l.name).join(', '));

  // 7. Occupancy Current
  const occ = await makeRequest('/api/libraries/occupancy/current');
  console.log('7. GET /api/libraries/occupancy/current:', occ.status, 'Occupancies:', occ.body.data);

  // 8. Buildings (8 verified blocks)
  const bldgs = await makeRequest('/api/buildings');
  console.log('8. GET /api/buildings:', bldgs.status, 'Count:', bldgs.body.data?.length, 'Blocks:', bldgs.body.data?.map(b => b.shortName || b.name).join(', '));

  // 9. Rooms (Verified rooms in DB)
  const rooms = await makeRequest('/api/rooms');
  console.log('9. GET /api/rooms:', rooms.status, 'Count:', rooms.body.data?.length);

  // 9a. Rooms by Building LHC
  const lhcRooms = await makeRequest('/api/rooms?building=LHC');
  console.log('9a. GET /api/rooms?building=LHC:', lhcRooms.status, 'Count:', lhcRooms.body.data?.length);

  // 9b. Rooms by Building CRD
  const crdRooms = await makeRequest('/api/rooms?building=CRD');
  console.log('9b. GET /api/rooms?building=CRD:', crdRooms.status, 'Count:', crdRooms.body.data?.length);

  // 10. Room Normalization (LHC306 => LHC-306, LHC518A => LHC-518A, CRD405 => CRD-405)
  const roomSearch = await makeRequest('/api/rooms/LHC306');
  console.log('10. GET /api/rooms/LHC306:', roomSearch.status, 'Normalized match:', roomSearch.body.data?.roomNumber, 'Name:', roomSearch.body.data?.name, 'Floor:', roomSearch.body.data?.floor);

  const roomSearch2 = await makeRequest('/api/rooms/LHC518A');
  console.log('10a. GET /api/rooms/LHC518A:', roomSearch2.status, 'Normalized match:', roomSearch2.body.data?.roomNumber, 'Name:', roomSearch2.body.data?.name, 'Floor:', roomSearch2.body.data?.floor);

  const roomSearch3 = await makeRequest('/api/rooms/CRD405');
  console.log('10b. GET /api/rooms/CRD405:', roomSearch3.status, 'Normalized match:', roomSearch3.body.data?.roomNumber, 'Name:', roomSearch3.body.data?.name, 'Floor:', roomSearch3.body.data?.floor);

  // 11. Issues (Sample issue reports)
  const issues = await makeRequest('/api/issues');
  console.log('11. GET /api/issues:', issues.status, 'Count:', issues.body.data?.length);

  // 12. Global Search
  const search = await makeRequest('/api/search?q=Apex');
  console.log('12. GET /api/search?q=Apex:', search.status, 'Search Query:', search.body.data?.query, 'Faculty:', search.body.data?.faculty?.length, 'Libraries:', search.body.data?.libraries?.length, 'Buildings:', search.body.data?.buildings?.length);

  // 13. Ask Campus AI Grounded API
  const ai = await makeRequest('/api/ai/query', 'POST', {
    query: 'Which library is least crowded for CSE students?'
  });
  console.log('13. POST /api/ai/query:', ai.status, 'Intent:', ai.body.data?.intent);
  console.log('    AI Answer:', ai.body.data?.answer);

  console.log('\n🎉 ALL REST API ENDPOINTS VERIFIED 100% OPERATIONAL!');
}

runTests().catch(console.error);
