import React, { useState, useEffect } from 'react';
import { Home, User, UserPlus, Calendar, FileCheck, Search, Plus, Eye, Users, BookOpen, Clock, AlertCircle, X } from 'lucide-react';

// Helper for fetch with timeout
const fetchWithTimeout = async (resource, options = {}) => {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal  
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export default function StudentApp() {

  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeSubSection, setActiveSubSection] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [error, setError] = useState('');
  const [totalStudents, setTotalStudents] = useState(0);
  const [availableCourses, setAvailableCourses] = useState(0);
  const [upcomingSchedules, setUpcomingSchedules] = useState(0);
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorContext, setErrorContext] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // --- Registration form state (minimum fields needed by your backend) ---
  const [registrationForm, setRegistrationForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    scheduleId: '',
    mobileNo: '',
    telephoneNo: '',
    age: '',
    yearsExp: '',
    dateOfBirth: '',
    completeAddress: '',
    sex: '',
    civilStatus: '',
    nationality: '',
    religion: '',
    educationCollege: '',
    educationCourse: '',
    employmentCompany: '',
    employmentPosition: '',
    employmentDepartment: '',
    employmentStatus: '',
    employmentDate: '',
    employmentReferences: '',
    ojtIndustry: '',
    ojtCompany: '',
    ojtAddress: ''
  });

  const [submitting, setSubmitting] = useState(false);

  // --- Make loadData reusable (so we can refresh after submitting) ---
  const loadData = async () => {
    try {
      const [schedulesRes, assessmentsRes, studentsRes] = await Promise.all([
        fetch('/api/schedules'),
        fetch('/api/assessments'),
        fetch('/api/students')
      ]);

      if (!schedulesRes.ok || !assessmentsRes.ok || !studentsRes.ok) {
        throw new Error('Failed to load data');
      }

      const [schedulesData, assessmentsData, studentsData] = await Promise.all([
        schedulesRes.json(),
        assessmentsRes.json(),
        studentsRes.json()
      ]);

      const mappedSchedules = schedulesData.map((s) => ({
        id: s._id, // IMPORTANT: use Mongo _id for registrations
        courseId: s.courseId,
        title: s.courseTitle || s.title,
        date: s.trainingDate ? String(s.trainingDate).slice(0, 10) : '',
        registered: typeof s.registered === 'number' ? s.registered : 0,
        capacity: typeof s.capacity === 'number' ? s.capacity : 0
      }));

      const mappedAssessments = assessmentsData.map((a) => ({
        id: a._id || a.assessmentId,
        title: a.title,
        fee: a.fee,
        status: a.status
      }));

      setSchedules(mappedSchedules);
      setAssessments(mappedAssessments);
      setTotalStudents(Array.isArray(studentsData) ? studentsData.length : 0);
      const courseIds = new Set(schedulesData.map((s) => s.courseId).filter(Boolean));
      setAvailableCourses(courseIds.size);
      const now = new Date();
      const upcoming = schedulesData.filter((s) => s.trainingDate && new Date(s.trainingDate) >= now).length;
      setUpcomingSchedules(upcoming);
      setError('');
      setErrorVisible(false);
    } catch (e) {
      setError('Failed to load data from server');
      setErrorVisible(true);
      setErrorContext('load');
    }
  };


  // --- Create/find student, then create registration ---
  const submitRegistrationToServer = async () => {
    try {
      const errors = {};
      if (!registrationForm.scheduleId) errors.scheduleId = 'Please select a Training Course.';
      if (!registrationForm.firstName.trim()) errors.firstName = 'Please enter First Name.';
      if (!registrationForm.lastName.trim()) errors.lastName = 'Please enter Last Name.';
      if (!registrationForm.email.trim()) errors.email = 'Please enter Email Address.';
      const mobile = String(registrationForm.mobileNo || '').replace(/\D/g, '');
      if (mobile && mobile.length !== 11) errors.mobileNo = 'Mobile number must be exactly 11 digits.';
      const ageNum = Number(registrationForm.age);
      if (registrationForm.age && (!Number.isInteger(ageNum) || ageNum < 1)) errors.age = 'Age must be a whole number and at least 1.';
      const yearsNum = Number(registrationForm.yearsExp);
      if (registrationForm.yearsExp && (yearsNum < 0 || !Number.isFinite(yearsNum))) errors.yearsExp = 'Years of experience cannot be negative.';
      if (Object.keys(errors).length) {
        setFormErrors(errors);
        setError('Please fix the highlighted fields.');
        setErrorVisible(true);
        setErrorContext('form');
        return;
      }

      setSubmitting(true);
      setError('');
      setErrorVisible(false);
      setFormErrors({});

      let student;
      const studentRes = await fetchWithTimeout('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: registrationForm.firstName.trim(),
          lastName: registrationForm.lastName.trim(),
          middleName: registrationForm.middleName.trim(),
          email: registrationForm.email.trim(),
          mobileNo: mobile || undefined,
          telephoneNo: registrationForm.telephoneNo ? registrationForm.telephoneNo.trim() : undefined,
          age: registrationForm.age ? ageNum : undefined,
          yearsOfExperience: registrationForm.yearsExp ? yearsNum : undefined,
          dateOfBirth: registrationForm.dateOfBirth || undefined,
          completeAddress: registrationForm.completeAddress.trim(),
          sex: registrationForm.sex,
          civilStatus: registrationForm.civilStatus,
          nationality: registrationForm.nationality.trim(),
          religion: registrationForm.religion.trim(),
          educationCollege: registrationForm.educationCollege.trim(),
          educationCourse: registrationForm.educationCourse.trim(),
          employmentCompany: registrationForm.employmentCompany.trim(),
          employmentPosition: registrationForm.employmentPosition.trim(),
          employmentDepartment: registrationForm.employmentDepartment.trim(),
          employmentStatus: registrationForm.employmentStatus,
          employmentDate: registrationForm.employmentDate || undefined,
          employmentReferences: registrationForm.employmentReferences.trim(),
          ojtIndustry: registrationForm.ojtIndustry.trim(),
          ojtCompany: registrationForm.ojtCompany.trim(),
          ojtAddress: registrationForm.ojtAddress.trim()
        })
      });

      // Check for JSON response
      const contentType = studentRes.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await studentRes.text();
        throw new Error(text.includes('Proxy error') ? 'Backend server is down (Proxy Error)' : `Server error: ${text.slice(0, 50)}`);
      }

      const studentData = await studentRes.json();

      if (!studentRes.ok) {
        if (studentData?.error === 'Email already exists') {
          const allStudentsRes = await fetch('/api/students');
          const allStudents = await allStudentsRes.json();
          student = allStudents.find(
            (s) => String(s.email).toLowerCase() === registrationForm.email.trim().toLowerCase()
          );
          if (!student?._id) {
            throw new Error('Email already exists, but could not find the student record.');
          }
        } else {
          const msg = studentData?.error || 'Failed to create student';
          if (/Mobile number/i.test(msg)) {
            setFormErrors(f => ({ ...f, mobileNo: msg }));
          } else if (/Age must/i.test(msg)) {
            setFormErrors(f => ({ ...f, age: msg }));
          } else if (/Years of experience/i.test(msg)) {
            setFormErrors(f => ({ ...f, yearsExp: msg }));
          } else if (/email/i.test(msg)) {
            setFormErrors(f => ({ ...f, email: msg }));
          }
          throw new Error(msg);
        }
      } else {
        student = studentData;
      }

      const regRes = await fetchWithTimeout('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student._id,
          scheduleId: registrationForm.scheduleId,
          termsAccepted: true
        })
      });

      // Check for JSON response
      const regContentType = regRes.headers.get("content-type");
      if (!regContentType || !regContentType.includes("application/json")) {
        const text = await regRes.text();
        throw new Error(text.includes('Proxy error') ? 'Backend server is down (Proxy Error)' : `Server error: ${text.slice(0, 50)}`);
      }

      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData?.error || 'Failed to submit registration');

      setShowTerms(false);
      alert('Registration submitted successfully!');

      await loadData();

      setRegistrationForm({
        firstName: '', lastName: '', middleName: '', email: '', scheduleId: '', mobileNo: '', telephoneNo: '',
        age: '', yearsExp: '', dateOfBirth: '', completeAddress: '', sex: '', civilStatus: '', nationality: '', religion: '',
        educationCollege: '', educationCourse: '', employmentCompany: '', employmentPosition: '', employmentDepartment: '',
        employmentStatus: '', employmentDate: '', employmentReferences: '', ojtIndustry: '', ojtCompany: '', ojtAddress: ''
      });
      setActiveSection('dashboard');
      setActiveSubSection('');
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setShowTerms(false);
      setErrorVisible(true);
      setErrorContext('submit');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (error && errorVisible) {
      if (errorContext === 'load') return; // Don't auto-dismiss load errors
      const t = setTimeout(() => setErrorVisible(false), 5000);
      return () => clearTimeout(t);
    }
  }, [error, errorVisible, errorContext]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Students</p>
              <p className="text-3xl font-bold mt-2">{totalStudents}</p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Available Courses</p>
              <p className="text-3xl font-bold mt-2">{availableCourses}</p>
            </div>
            <BookOpen className="w-12 h-12 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Upcoming Schedules</p>
              <p className="text-3xl font-bold mt-2">{upcomingSchedules}</p>
            </div>
            <Clock className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Schedules</h3>
          <div className="space-y-3">
            {([...schedules].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)).map(schedule => (
              <div key={schedule.id} className="p-4 border rounded-lg hover:bg-gray-50 transition cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{schedule.title}</p>
                    <p className="text-sm text-gray-600">{schedule.courseId}</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{schedule.date}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{schedule.registered}/{schedule.capacity} students</span>
                  <button 
                    onClick={() => setActiveSection('schedules')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Assessments</h3>
          <div className="space-y-3">
            {assessments.map(assessment => (
              <div key={assessment.id} className="p-4 border rounded-lg hover:bg-gray-50 transition">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-gray-800">{assessment.title}</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    assessment.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {assessment.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Fee: {assessment.fee}</span>
                  <button 
                    onClick={() => setActiveSection('assessment')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRegistrations = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Student Registration</h2>


      
      <div className="bg-white rounded-lg shadow p-6">
        <button 
          onClick={() => setActiveSubSection('student-registration')}
          className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          New Student Registration
        </button>
      </div>

      {activeSubSection === 'student-registration' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-6">Registration Form</h3>
          
          <form className="space-y-6">
            {/* Date and Course */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input type="date" className="w-full border rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Training Course</label>
                <select
                  className={`w-full border rounded-lg px-4 py-2 ${formErrors.scheduleId ? 'border-red-500' : ''}`}
                  value={registrationForm.scheduleId}
                  onChange={(e) => {
                    setRegistrationForm(f => ({ ...f, scheduleId: e.target.value }));
                    if (e.target.value) setFormErrors(prev => { const c = { ...prev }; delete c.scheduleId; return c; });
                  }}
                >
                  <option value="">Select Course</option>
                  {schedules.length === 0 && errorContext === 'load' ? (
                    <option disabled>Unable to load courses (Server Error)</option>
                  ) : (
                    schedules.map(s  => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))
                  )}
                </select>
                {formErrors.scheduleId && <p className="text-sm text-red-600 mt-1">{formErrors.scheduleId}</p>}
              </div>
            </div>

            {/* Participant Profile */}
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-800 mb-4">Participant Profile</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Last Name"
                    className="border rounded-lg px-4 py-2"
                    value={registrationForm.lastName}
                    onChange={(e) => setRegistrationForm(f => ({ ...f, lastName: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="First Name"
                    className="border rounded-lg px-4 py-2"
                    value={registrationForm.firstName}
                    onChange={(e)  => setRegistrationForm(f => ({ ...f, firstName: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Middle Name"
                    className="border rounded-lg px-4 py-2"
                    value={registrationForm.middleName}
                    onChange={(e) => setRegistrationForm(f => ({ ...f, middleName: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      className="border rounded-lg px-4 py-2 w-full"
                      max={new Date().toISOString().slice(0, 10)}
                      value={registrationForm.dateOfBirth || ""}
                      onChange={(e) => setRegistrationForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Complete Address"
                    className="border rounded-lg px-4 py-2"
                    value={registrationForm.completeAddress}
                    onChange={(e) => setRegistrationForm(f => ({ ...f, completeAddress: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="md:col-span-2 lg:col-span-1">
                  <input
                    type="tel"
                    placeholder="Telephone No."
                    className={`w-full border rounded-lg px-4 py-2 ${formErrors.telephoneNo ? 'border-red-500' : ''}`}
                    value={registrationForm.telephoneNo}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9-+() ]/g, '').slice(0, 20);
                      setRegistrationForm(f => ({ ...f, telephoneNo: v }));
                      setFormErrors(prev => { const c = { ...prev }; delete c.telephoneNo; return c; });
                    }}
                  />
                  {formErrors.telephoneNo && <p className="text-sm text-red-600 mt-1">{formErrors.telephoneNo}</p>}
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Mobile No. (11 digits)"
                      className={`w-full border rounded-lg px-4 py-2 ${formErrors.mobileNo ? 'border-red-500' : ''}`}
                      value={registrationForm.mobileNo}
                      onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setRegistrationForm(f => ({ ...f, mobileNo: v }));
                      if (v && v.length !== 11) {
                        setFormErrors(prev => ({ ...prev, mobileNo: 'Mobile number must be exactly 11 digits' }));
                      } else {
                        setFormErrors(prev => { const c = { ...prev }; delete c.mobileNo; return c; });
                      }
                    }}
                    />
                    {formErrors.mobileNo && <p className="text-sm text-red-600 mt-1">{formErrors.mobileNo}</p>}
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email Address"
                      className={`w-full border rounded-lg px-4 py-2 ${formErrors.email ? 'border-red-500' : ''}`}
                      value={registrationForm.email}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRegistrationForm(f => ({ ...f, email: v }));
                        if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
                          setFormErrors(prev => ({ ...prev, email: 'Invalid email format' }));
                        } else {
                          setFormErrors(prev => { const c = { ...prev }; delete c.email; return c; });
                        }
                      }}
                    />
                    {formErrors.email && <p className="text-sm text-red-600 mt-1">{formErrors.email}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <select
                    className="w-full border rounded-lg px-4 py-2"
                    value={registrationForm.sex}
                    onChange={(e) => setRegistrationForm(f => ({ ...f, sex: e.target.value }))}
                  >
                    <option value="">Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <div>
                    <input
                      type="number"
                      placeholder="Age (min 1)"
                      className={`w-full border rounded-lg px-4 py-2 ${formErrors.age ? 'border-red-500' : ''}`}
                      min={1}
                      step={1}
                      value={registrationForm.age}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRegistrationForm(f => ({ ...f, age: v }));
                        const ageNum = parseInt(v, 10);
                        if (v && (isNaN(ageNum) || ageNum < 1)) {
                          setFormErrors(prev => ({ ...prev, age: 'Age must be at least 1' }));
                        } else {
                          setFormErrors(prev => { const c = { ...prev }; delete c.age; return c; });
                        }
                      }}
                    />
                    {formErrors.age && <p className="text-sm text-red-600 mt-1">{formErrors.age}</p>}
                  </div>
                  <select
                    className="w-full border rounded-lg px-4 py-2"
                    value={registrationForm.civilStatus}
                    onChange={(e) => setRegistrationForm(f => ({ ...f, civilStatus: e.target.value }))}
                  >
                    <option value="">Civil Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Nationality"
                    className="w-full border rounded-lg px-4 py-2"
                    value={registrationForm.nationality}
                    onChange={(e) => setRegistrationForm(f => ({ ...f, nationality: e.target.value }))}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Religion"
                  className="w-full border rounded-lg px-4 py-2"
                  value={registrationForm.religion}
                  onChange={(e) => setRegistrationForm(f => ({ ...f, religion: e.target.value }))}
                />
              </div>
            </div>

            {/* Education */}
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-800 mb-4">Education Attainment</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="College/School"
                  className="border rounded-lg px-4 py-2"
                  value={registrationForm.educationCollege}
                  onChange={(e) => setRegistrationForm(f => ({ ...f, educationCollege: e.target.value }))}
                />
                <input
                  type="text"
                  placeholder="Course (BS/TechVoc)"
                  className="border rounded-lg px-4 py-2"
                  value={registrationForm.educationCourse}
                  onChange={(e) => setRegistrationForm(f => ({ ...f, educationCourse: e.target.value }))}
                />
              </div>
            </div>

            {/* Employment */}
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-800 mb-1">Employment Background</h4>
              <p className="text-sm text-gray-500 mb-4">Optional — you may skip if not applicable.</p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Company Employed"
                    className="border rounded-lg px-4 py-2"
                    value={registrationForm.employmentCompany}
                    onChange={(e) => setRegistrationForm(f => ({ ...f, employmentCompany: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Position"
                    className="border rounded-lg px-4 py-2"
                    value={registrationForm.employmentPosition}
                    onChange={(e) => setRegistrationForm(f => ({ ...f, employmentPosition: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Department"
                    className="border rounded-lg px-4 py-2"
                    value={registrationForm.employmentDepartment}
                    onChange={(e) => setRegistrationForm(f => ({ ...f, employmentDepartment: e.target.value }))}
                  />
                  <div>
                    <input
                      type="number"
                      placeholder="Years of Experience (0 or more)"
                      className={`w-full border rounded-lg px-4 py-2 ${formErrors.yearsExp ? 'border-red-500' : ''}`}
                      min={0}
                      step={1}
                      value={registrationForm.yearsExp}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRegistrationForm(f => ({ ...f, yearsExp: v }));
                        const yearsNum = parseFloat(v);
                        if (v && (isNaN(yearsNum) || yearsNum < 0)) {
                          setFormErrors(prev => ({ ...prev, yearsExp: 'Experience cannot be negative' }));
                        } else {
                          setFormErrors(prev => { const c = { ...prev }; delete c.yearsExp; return c; });
                        }
                      }}
                    />
                    {formErrors.yearsExp && <p className="text-sm text-red-600 mt-1">{formErrors.yearsExp}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    className="border rounded-lg px-4 py-2"
                    value={registrationForm.employmentStatus}
                    onChange={(e) => setRegistrationForm(f => ({ ...f, employmentStatus: e.target.value }))}
                  >
                    <option value="">Employment Status</option>
                    <option value="Regular">Regular</option>
                    <option value="Contractual">Contractual</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Self-employed">Self-employed</option>
                  </select>
                  <input
                    type="date"
                    placeholder="Date Employed"
                    className="border rounded-lg px-4 py-2"
                    value={registrationForm.employmentDate}
                    onChange={(e) => setRegistrationForm(f => ({ ...f, employmentDate: e.target.value }))}
                  />
                </div>
                <input
                  type="text"
                  placeholder="References"
                  className="w-full border rounded-lg px-4 py-2"
                  value={registrationForm.employmentReferences}
                  onChange={(e) => setRegistrationForm(f => ({ ...f, employmentReferences: e.target.value }))}
                />
              </div>
            </div>

            {/* OJT */}
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-800 mb-1">OJT</h4>
              <p className="text-sm text-gray-500 mb-4">Optional — you may skip if not applicable.</p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Industry"
                    className="border rounded-lg px-4 py-2"
                    value={registrationForm.ojtIndustry}
                    onChange={(e) => setRegistrationForm(f => ({ ...f, ojtIndustry: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    className="border rounded-lg px-4 py-2"
                    value={registrationForm.ojtCompany}
                    onChange={(e) => setRegistrationForm(f => ({ ...f, ojtCompany: e.target.value }))}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Address"
                  className="w-full border rounded-lg px-4 py-2"
                  value={registrationForm.ojtAddress}
                  onChange={(e) => setRegistrationForm(f => ({ ...f, ojtAddress: e.target.value }))}
                />
              </div>
            </div>

            {/* Others */}
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-800 mb-4">Others</h4>
              <p className="text-sm text-gray-500 mb-4">Optional — you may skip if not applicable.</p>
              <div className="space-y-4">
                <input type="text" placeholder="Area of Specialization" className="w-full border rounded-lg px-4 py-2" />
                <textarea placeholder="Other Specification" rows="3" className="w-full border rounded-lg px-4 py-2"></textarea>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setShowTerms(true)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Submit Registration
              </button>
              <button 
                type="button"
                onClick={() => setActiveSubSection('')}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  const renderSchedules = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Course Schedules</h2>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={scheduleSearch}
              onChange={(e) => setScheduleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Course ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Course Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Training Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Enrolled</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
{schedules
  .filter((s) => {
    const q = scheduleSearch.trim().toLowerCase();
    if (!q) return true;
    const title = String(s.title || '').toLowerCase();
    const id = String(s.courseId || '').toLowerCase();
    const date = String(s.date || '').toLowerCase();
    return title.includes(q) || id.includes(q) || date.includes(q);
  })
  .map((schedule) => (
  <tr key={schedule.id} className="hover:bg-gray-50">
    <td className="px-4 py-3 text-sm">{schedule.courseId}</td>
    <td className="px-4 py-3 text-sm">{schedule.title}</td>
    <td className="px-4 py-3 text-sm">{schedule.date}</td>
    <td className="px-4 py-3 text-sm">
      {schedule.registered}/{schedule.capacity}
    </td>
    <td className="px-4 py-3 text-sm">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setSelectedSchedule(schedule);
            setActiveSubSection('schedule-details');
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          <Eye className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedSchedule(schedule); // optional but helpful
            setActiveSection('registrations');
          }}
          className="text-green-600 hover:text-green-800"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </td>
  </tr>
))}

            </tbody>
          </table>
        </div>
      </div>

      {activeSubSection === 'schedule-details' && selectedSchedule && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Schedule Details</h3>
          <div className="space-y-3">
            <p><span className="font-semibold">Course:</span> {selectedSchedule.title}</p>
            <p><span className="font-semibold">Course ID:</span> {selectedSchedule.courseId}</p>
            <p><span className="font-semibold">Date:</span> {selectedSchedule.date}</p>
            <p><span className="font-semibold">Capacity:</span> {selectedSchedule.registered}/{selectedSchedule.capacity}</p>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setRegistrationForm((f) => ({
                  ...f,
                  scheduleId: selectedSchedule.id
                }));
                setActiveSection('registrations');
                setActiveSubSection('student-registration');
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Register Now
            </button>
            <button 
              onClick={() => setActiveSubSection('')}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderAssessment = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Assessment Applications</h2>
        <button 
          onClick={() => setActiveSubSection('apply-assessment')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Apply for Assessment
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Available Assessments</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Assessment ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fee</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assessments.map((assessment) => (
                <tr key={assessment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{assessment.id}</td>
                  <td className="px-4 py-3 text-sm">{assessment.title}</td>
                  <td className="px-4 py-3 text-sm">{assessment.fee}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      assessment.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {assessment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4" /></button>
                      <button 
                        onClick={() => setActiveSubSection('apply-assessment')}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeSubSection === 'apply-assessment' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Apply for Assessment</h3>
          <form className="space-y-4">
            <select className="w-full border rounded-lg px-4 py-2">
              <option>Select Assessment</option>
              {assessments.map(a => <option key={a.id}>{a.title}</option>)}
            </select>
            <input type="text" placeholder="Applicant Name" className="w-full border rounded-lg px-4 py-2" />
            <input type="email" placeholder="Email" className="w-full border rounded-lg px-4 py-2" />
            <input type="date" placeholder="Preferred Date" className="w-full border rounded-lg px-4 py-2" />
            <div className="flex gap-3">
              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                Submit Application
              </button>
              <button 
                type="button"
                onClick={() => setActiveSubSection('')}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white p-6">
              <h2 className="text-2xl font-bold">Terms and Conditions</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3 text-gray-700">
                <p><strong>1.</strong> Enrollment will be confirmed prior to the start of the course.</p>
                <p><strong>2.</strong> Requirements should be submitted on or before start of the training.</p>
                <p><strong>3.</strong> Failure to submit requirements will result in cancellation.</p>
                <p><strong>4.</strong> Participants should observe proper decorum during training.</p>
                <p><strong>5.</strong> MTC reserves the right to modify course contents and schedules.</p>
              </div>
              <div className="border-t pt-6 mt-6">
                <p className="text-gray-800 font-medium mb-4">Do you agree to these terms?</p>
                <div className="flex gap-3">
                  
                  <button 
                    onClick={submitRegistrationToServer}
                    disabled={submitting}
                    className={`flex-1 ${submitting ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'} text-white px-6 py-3 rounded-lg font-medium`}
                  >
                    {submitting ? 'Submitting...' : 'I Agree'}
                  </button>
                  <button 
                    onClick={() => setShowTerms(false)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    I Disagree
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Home className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">MTC</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Student User</span>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                SU
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveSection('dashboard'); setActiveSubSection(''); }}
              className={`px-6 py-4 font-medium transition flex items-center gap-2 ${
                activeSection === 'dashboard' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <User className="w-5 h-5" />
              DASHBOARD
            </button>
            <button
              onClick={() => { setActiveSection('registrations'); setActiveSubSection(''); }}
              className={`px-6 py-4 font-medium transition flex items-center gap-2 ${
                activeSection === 'registrations' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              REGISTRATIONS
            </button>
            <button
              onClick={() => { setActiveSection('schedules'); setActiveSubSection(''); }}
              className={`px-6 py-4 font-medium transition flex items-center gap-2 ${
                activeSection === 'schedules' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar className="w-5 h-5" />
              SCHEDULES
            </button>
            <button
              onClick={() => { setActiveSection('assessment'); setActiveSubSection(''); }}
              className={`px-6 py-4 font-medium transition flex items-center gap-2 ${
                activeSection === 'assessment' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FileCheck className="w-5 h-5" />
              ASSESSMENT
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && errorVisible && (
          <div className="mb-6 flex items-start gap-3 p-4 border border-red-200 bg-red-50 text-red-800 rounded">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">There was a problem</div>
              <div className="mt-1 whitespace-pre-line">{error}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (errorContext === 'load') {
                    loadData();
                  }
                  setErrorVisible(false);
                }}
                className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Retry
              </button>
              <button
                onClick={() => { setError(''); setErrorVisible(false); }}
                className="text-red-700 hover:text-red-900"
                aria-label="Dismiss error"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'registrations' && renderRegistrations()}
        {activeSection === 'schedules' && renderSchedules()}
        {activeSection === 'assessment' && renderAssessment()}
      </div>
    </div>
  );
};
