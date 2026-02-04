
const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: responseBody });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: responseBody });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function runTest() {
  console.log('--- Starting Notification Test ---');

  // 1. Create a dummy student first (needed for ID)
  // Assuming POST /api/students works
  /*
  const studentData = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    mobileNo: '09123456789'
  };
  
  // Actually, let's skip student creation if possible or just use a fake ID if the backend validates it?
  // The backend looks up the student: const student = await Student.findById(req.body.studentId);
  // If it fails, it just says "Unknown Student".
  // But AssessmentApplication model might require a valid studentId depending on schema.
  */
 
  // Let's try to fetch existing students first to get a valid ID
  try {
    const studentsRes = await get('/api/students');
    const students = JSON.parse(studentsRes.body);
    
    let studentId;
    if (students.length > 0) {
      studentId = students[0]._id;
      console.log('Using existing student ID:', studentId);
    } else {
      console.log('No students found, cannot test reliably without a student ID.');
      return;
    }

    // 2. Create Assessment Application
    console.log('Creating Assessment Application...');
    const appRes = await post('/api/assessment-applications', {
      studentId: studentId,
      assessmentId: 'TEST-ASM-001', // Dummy ID
      assessmentTitle: 'Test Assessment',
      status: 'Pending',
      paymentStatus: 'Pending',
      requirements: {}
    });
    
    console.log('Application Response:', appRes.status, appRes.body);

    // 3. Check Notifications
    console.log('Checking Notifications...');
    const notifRes = await get('/api/notifications');
    const notifications = JSON.parse(notifRes.body);
    
    const found = notifications.find(n => n.type === 'assessment' && n.message.includes('New assessment application'));
    
    if (found) {
      console.log('SUCCESS: Notification found!');
      console.log(JSON.stringify(found, null, 2));
    } else {
      console.log('FAILURE: No matching notification found.');
      console.log('Recent notifications:', notifications.slice(0, 3));
    }

  } catch (err) {
    console.error('Test Error:', err);
  }
}

runTest();
