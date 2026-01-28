const http = require('http');

// Helper for requests
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTest() {
  console.log('--- Starting Delete All Notifications Test ---');

  try {
    // 1. Create a dummy notification (using existing endpoint if possible, or just checking if any exist)
    // Since we don't have a direct "create notification" endpoint exposed for testing easily (it's usually internal),
    // we will assume there might be notifications or we can trigger one via registration/assessment if needed.
    // However, to be safe and simple, let's just check the count first.

    console.log('Checking initial notification count...');
    const listRes = await request('GET', '/api/notifications');
    const initialNotifications = JSON.parse(listRes.body);
    console.log(`Initial count: ${initialNotifications.length}`);

    // If 0, we can't really verify "delete all" removed anything, but we can verify it doesn't crash.
    // Ideally we'd create one. Let's try to hit the assessment application endpoint to create one if 0.
    if (initialNotifications.length === 0) {
        console.log('No notifications found. Attempting to create one via assessment application...');
        // We need a valid student ID. Let's fetch students first.
        const studentsRes = await request('GET', '/api/students');
        const students = JSON.parse(studentsRes.body);
        
        if (students.length > 0) {
            const studentId = students[0]._id;
            await request('POST', '/api/assessment-applications', {
                studentId: studentId,
                assessmentId: 'TEST-DEL-001',
                assessmentTitle: 'Test Delete',
                status: 'Pending',
                paymentStatus: 'Pending',
                requirements: {}
            });
            console.log('Created dummy assessment application to trigger notification.');
            
            // Wait a bit for async notification creation
            await new Promise(r => setTimeout(r, 1000));
        } else {
            console.log('No students available to create notification. Skipping creation.');
        }
    }

    // 2. Call Delete All
    console.log('Calling Delete All endpoint...');
    const deleteRes = await request('DELETE', '/api/notifications/delete-all');
    console.log('Delete Response:', deleteRes.status, deleteRes.body);

    if (deleteRes.status === 200) {
        // 3. Verify count is 0
        console.log('Verifying count is 0...');
        const verifyRes = await request('GET', '/api/notifications');
        const finalNotifications = JSON.parse(verifyRes.body);
        console.log(`Final count: ${finalNotifications.length}`);
        
        if (finalNotifications.length === 0) {
            console.log('SUCCESS: All notifications deleted.');
        } else {
            console.log('FAILURE: Notifications still exist.');
        }
    } else {
        console.log('FAILURE: Delete endpoint returned error.');
    }

  } catch (err) {
    console.error('Test Error:', err);
  }
}

runTest();
