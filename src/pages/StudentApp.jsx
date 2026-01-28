import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Home, User, UserPlus, Calendar, FileCheck, Search, Eye, Users, BookOpen, Clock, AlertCircle, CheckCircle, ChevronRight, Briefcase, GraduationCap, Phone, MapPin } from 'lucide-react';

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

const INITIAL_ASSESSMENT_FORM = {
  schoolCompany: '', address: '', assessmentId: '', assessmentTitle: '',
  surname: '', firstname: '', middlename: '', middleInitial: '',
  mailingAddress: { numberStreet: '', barangay: '', district: '', city: '', province: '', region: '', zipCode: '' },
  motherName: '', fatherName: '',
  sex: '', civilStatus: '',
  email: '', mobile: '',
  educationAttainment: '', educationOthers: '',
  employmentStatus: '',
  birthDate: '', birthPlace: '', age: '',
  paymentMethod: '', // 'Online' or 'No'
  senderGcash: '', referenceNumber: '', proofOfPayment: '' // Base64
};

export default function StudentApp() {

  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeSubSection, setActiveSubSection] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const [totalStudents, setTotalStudents] = useState(0);
  const [availableCourses, setAvailableCourses] = useState(0);
  const [upcomingSchedules, setUpcomingSchedules] = useState(0);
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [assessmentSearch, setAssessmentSearch] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorContext, setErrorContext] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // --- Assessment Application State ---
  const [assessmentStep, setAssessmentStep] = useState(0); // 0: List, 1: Form, 2: Payment, 3: Success
  const [assessmentPage, setAssessmentPage] = useState(1);
  const ASSESSMENT_ITEMS_PER_PAGE = 6;
  const [schedulePage, setSchedulePage] = useState(1);
  const SCHEDULE_ITEMS_PER_PAGE = 6;
  const [assessmentForm, setAssessmentForm] = useState(INITIAL_ASSESSMENT_FORM);
  const [isAssessmentFixed, setIsAssessmentFixed] = useState(false);

  const [assessmentErrors, setAssessmentErrors] = useState({});
  const [paymentConfig, setPaymentConfig] = useState({ gcashNumber: '0917-123-4567', qrCodeImage: '' });
  const [zoomedImage, setZoomedImage] = useState(null);

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
  const [isScheduleFixed, setIsScheduleFixed] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // --- Make loadData reusable (so we can refresh after submitting) ---
  const loadData = async () => {
    try {
      const [schedulesRes, assessmentsRes, studentsRes, applicationsRes, settingsRes] = await Promise.all([
        fetch('/api/schedules'),
        fetch('/api/assessments'),
        fetch('/api/students'),
        fetch('/api/assessment-applications'),
        fetch('/api/system-settings/payment_config')
      ]);

      if (!schedulesRes.ok || !assessmentsRes.ok || !studentsRes.ok || !applicationsRes.ok) {
        throw new Error('Failed to load data');
      }

      const [schedulesData, assessmentsData, studentsData, applicationsData, settingsData] = await Promise.all([
        schedulesRes.json(),
        assessmentsRes.json(),
        studentsRes.json(),
        applicationsRes.json(),
        settingsRes.ok ? settingsRes.json() : null
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
        status: a.status,
        capacity: a.capacity || 0
      }));

      setSchedules(mappedSchedules);
      setAssessments(mappedAssessments);
      setApplications(Array.isArray(applicationsData) ? applicationsData : []);
      setTotalStudents(Array.isArray(studentsData) ? studentsData.length : 0);
      const courseIds = new Set(schedulesData.map((s) => s.courseId).filter(Boolean));
      setAvailableCourses(courseIds.size);
      const now = new Date();
      const upcoming = schedulesData.filter((s) => s.trainingDate && new Date(s.trainingDate) >= now).length;
      setUpcomingSchedules(upcoming);
      
      if (settingsData && settingsData.value) {
        setPaymentConfig(settingsData.value);
      }

      setError('');
      setErrorVisible(false);
    } catch (e) {
      setError('Failed to load data from server');
      setErrorVisible(true);
      setErrorContext('load');
    }
  };


  // --- Validation Helper ---
  const validateForm = () => {
    const errors = {};
    if (!registrationForm.scheduleId) errors.scheduleId = 'Please select a Training Course.';
    if (!registrationForm.firstName.trim()) errors.firstName = 'Please enter First Name.';
    if (!registrationForm.lastName.trim()) errors.lastName = 'Please enter Last Name.';
    if (!registrationForm.email.trim()) errors.email = 'Please enter Email Address.';
    if (!registrationForm.dateOfBirth) errors.dateOfBirth = 'Please enter Date of Birth.';
    if (!registrationForm.completeAddress.trim()) errors.completeAddress = 'Please enter Complete Address.';
    if (!registrationForm.sex) errors.sex = 'Please select Sex.';
    if (!registrationForm.civilStatus) errors.civilStatus = 'Please select Civil Status.';
    
    const mobile = String(registrationForm.mobileNo || '').replace(/\D/g, '');
    if (!mobile) {
      errors.mobileNo = 'Please enter Mobile Number.';
    } else if (mobile.length !== 11) {
      errors.mobileNo = 'Mobile number must be exactly 11 digits.';
    }

    const ageNum = Number(registrationForm.age);
    if (!registrationForm.age) {
      errors.age = 'Please enter Age.';
    } else if (!Number.isInteger(ageNum) || ageNum < 1) {
      errors.age = 'Age must be a whole number and at least 1.';
    }
    const yearsNum = Number(registrationForm.yearsExp);
    if (registrationForm.yearsExp && (yearsNum < 0 || !Number.isFinite(yearsNum))) errors.yearsExp = 'Years of experience cannot be negative.';
    return errors;
  };

  const handleStartRegistration = () => {
    // Check for full schedule
    const selectedSchedule = schedules.find(s => s.id === registrationForm.scheduleId);
    if (selectedSchedule) {
      const isFull = selectedSchedule.registered >= selectedSchedule.capacity;
      if (isFull) {
        setError('The selected training course is full. Please choose another one.');
        setErrorVisible(true);
        setShowErrorModal(true);
        return;
      }
    }

    const errors = validateForm();
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      setError('Please check the form, something is wrong.');
      setErrorVisible(true);
      setErrorContext('form');
      setShowErrorModal(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setShowTerms(true);
  };

  // --- Create/find student, then create registration ---
  const submitRegistrationToServer = async () => {
    try {
      // Re-validate just in case
      const errors = validateForm();
      if (Object.keys(errors).length) {
        setFormErrors(errors);
        setError('Please fix the highlighted fields.');
        setErrorVisible(true);
        setErrorContext('form');
        return;
      }
      
      const mobile = String(registrationForm.mobileNo || '').replace(/\D/g, '');
      const ageNum = Number(registrationForm.age);
      const yearsNum = Number(registrationForm.yearsExp);

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
      setShowSuccessModal(true);

      setRegistrationForm({
        firstName: '', lastName: '', middleName: '', email: '', scheduleId: '', mobileNo: '', telephoneNo: '',
        age: '', yearsExp: '', dateOfBirth: '', completeAddress: '', sex: '', civilStatus: '', nationality: '', religion: '',
        educationCollege: '', educationCourse: '', employmentCompany: '', employmentPosition: '', employmentDepartment: '',
        employmentStatus: '', employmentDate: '', employmentReferences: '', ojtIndustry: '', ojtCompany: '', ojtAddress: ''
      });
      setActiveSection('dashboard');
      setActiveSubSection('');

      loadData(); // Refresh data in background without blocking UI
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

  const renderDashboard = () => {
    // Schedules Logic - Limit to 3
    const sortedSchedules = [...schedules].sort((a, b) => new Date(b.date) - new Date(a.date));
    const displayedSchedules = sortedSchedules.slice(0, 3);

    // Assessments Logic - Limit to 3
    const displayedAssessments = assessments.slice(0, 3);

    return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <motion.h2 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold text-gray-800"
      >
        Dashboard Overview
      </motion.h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Students</p>
              <p className="text-3xl font-bold mt-2">{totalStudents}</p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Available Courses</p>
              <p className="text-3xl font-bold mt-2">{availableCourses}</p>
            </div>
            <BookOpen className="w-12 h-12 text-green-200" />
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Upcoming Schedules</p>
              <p className="text-3xl font-bold mt-2">{upcomingSchedules}</p>
            </div>
            <Clock className="w-12 h-12 text-purple-200" />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow p-6 flex flex-col h-full"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Recent Schedules
            </h3>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {displayedSchedules.map(schedule => {
              const isFull = schedule.registered >= schedule.capacity;
              return (
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
                  {isFull ? (
                    <span className="text-red-500 font-medium bg-red-50 px-3 py-1 rounded-full text-xs">Full</span>
                  ) : (
                    <button 
                      onClick={() => setActiveSection('schedules')}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            )})}
            {displayedSchedules.length === 0 && <p className="text-gray-500 text-center py-4">No schedules available</p>}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow p-6 flex flex-col h-full"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-purple-500" />
              Available Assessments
            </h3>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {displayedAssessments.map(assessment => {
              const studentCount = applications.filter(app => app.assessmentId === assessment.id).length;
              const isFull = studentCount >= (assessment.capacity || 0);
              const isOpen = assessment.status === 'Open' || assessment.status === 'Active';

              return (
                <div key={assessment.id} className="p-4 border rounded-lg hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-800">{assessment.title}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      isOpen ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {assessment.status}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 mb-2">
                    <span className="text-sm text-gray-600">Fee: {assessment.fee}</span>
                    <span className="text-sm text-gray-500">{studentCount}/{assessment.capacity || 0} students applied</span>
                  </div>
                  <div className="flex items-center justify-end text-sm">
                    {isOpen && !isFull ? (
                      <button 
                        onClick={() => { 
                          setActiveSection('assessment'); 
                          setAssessmentForm({
                            ...INITIAL_ASSESSMENT_FORM,
                            assessmentId: assessment.id,
                            assessmentTitle: assessment.title
                          });
                          setAssessmentStep(1); 
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Apply Now
                      </button>
                    ) : (
                      <span className={`font-medium cursor-not-allowed px-3 py-1 rounded-full text-xs ${isFull ? 'bg-red-100 text-red-600' : 'text-gray-400'}`}>
                        {isFull ? 'Full' : 'Unavailable'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
             {displayedAssessments.length === 0 && <p className="text-gray-500 text-center py-4">No assessments available</p>}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
  };

  const renderRegistrations = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 max-w-5xl mx-auto"
    >
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Student Registration</h2>
            <p className="text-gray-500 mt-1">Register for training courses and manage your profile</p>
         </div>
      </div>
      
      {!activeSubSection && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center hover:shadow-md transition-shadow"
        >
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
               <UserPlus className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">New Student Registration</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
               Start a new registration for a training course. You'll need to provide your personal details and educational background.
            </p>
            <button 
              onClick={() => {
                setIsScheduleFixed(false);
                setRegistrationForm(f => ({ ...f, scheduleId: '' }));
                setActiveSubSection('student-registration');
              }}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-medium inline-flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Start Registration
            </button>
        </motion.div>
      )}

      {activeSubSection === 'student-registration' && (
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
           {/* Section 1: Course Selection */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                 <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <BookOpen className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-semibold text-gray-900">Course Selection</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registration Date</label>
                  <input 
                     type="date" 
                     className="w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50" 
                     min={new Date().toISOString().split('T')[0]}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Training Course</label>
                  {isScheduleFixed ? (
                     <input 
                        type="text" 
                        className="w-full border border-gray-400 rounded-xl px-4 py-2.5 bg-gray-100 text-gray-700 cursor-not-allowed focus:outline-none"
                        value={schedules.find(s => s.id === registrationForm.scheduleId)?.title || ''}
                        readOnly
                     />
                  ) : (
                     <select
                        className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${formErrors.scheduleId ? 'border-red-300 ring-red-200' : ''}`}
                        value={registrationForm.scheduleId}
                        onChange={(e) => {
                           setRegistrationForm(f => ({ ...f, scheduleId: e.target.value }));
                           if (e.target.value) setFormErrors(prev => { const c = { ...prev }; delete c.scheduleId; return c; });
                        }}
                     >
                        <option value="">-- Choose a Course --</option>
                        {schedules.length === 0 && errorContext === 'load' ? (
                           <option disabled>Unable to load courses (Server Error)</option>
                        ) : (
                           schedules.map(s => {
                              const isFull = s.registered >= s.capacity;
                              return (
                                 <option key={s.id} value={s.id} disabled={isFull}>
                                    {s.title} {isFull ? '(Full)' : ''}
                                 </option>
                              );
                           })
                        )}
                     </select>
                  )}
                  {formErrors.scheduleId && !isScheduleFixed && <p className="text-sm text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {formErrors.scheduleId}</p>}
               </div>
              </div>
           </div>

           {/* Section 2: Personal Information */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                 <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <User className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              </div>
              <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div>
                       <input type="text" placeholder="Last Name" className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.lastName ? 'border-red-500 ring-2 ring-red-200' : ''}`} value={registrationForm.lastName} onChange={(e) => setRegistrationForm(f => ({ ...f, lastName: e.target.value }))} />
                       {formErrors.lastName && <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>}
                     </div>
                     <div>
                       <input type="text" placeholder="First Name" className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.firstName ? 'border-red-500 ring-2 ring-red-200' : ''}`} value={registrationForm.firstName} onChange={(e)  => setRegistrationForm(f => ({ ...f, firstName: e.target.value }))} />
                       {formErrors.firstName && <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>}
                     </div>
                     <input type="text" placeholder="Middle Name" className="w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={registrationForm.middleName} onChange={(e) => setRegistrationForm(f => ({ ...f, middleName: e.target.value }))} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input type="date" className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.dateOfBirth ? 'border-red-500 ring-2 ring-red-200' : ''}`} max={new Date().toISOString().slice(0, 10)} value={registrationForm.dateOfBirth || ""} onChange={(e) => setRegistrationForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
                        {formErrors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{formErrors.dateOfBirth}</p>}
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Complete Address</label>
                        <input type="text" placeholder="House No., Street, Barangay, City, Province" className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.completeAddress ? 'border-red-500 ring-2 ring-red-200' : ''}`} value={registrationForm.completeAddress} onChange={(e) => setRegistrationForm(f => ({ ...f, completeAddress: e.target.value }))} />
                        {formErrors.completeAddress && <p className="text-xs text-red-500 mt-1">{formErrors.completeAddress}</p>}
                     </div>
                  </div>

                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <select className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.sex ? 'border-red-500 ring-2 ring-red-200' : ''}`} value={registrationForm.sex} onChange={(e) => setRegistrationForm(f => ({ ...f, sex: e.target.value }))}>
                         <option value="">Sex</option>
                         <option value="Male">Male</option>
                         <option value="Female">Female</option>
                      </select>
                      {formErrors.sex && <p className="text-xs text-red-500 mt-1">{formErrors.sex}</p>}
                    </div>
                    <div>
                       <input type="number" placeholder="Age" className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.age ? 'border-red-500 ring-2 ring-red-200' : ''}`} min="1" step="1" value={registrationForm.age} onChange={(e) => {
                          const v = e.target.value;
                          setRegistrationForm(f => ({ ...f, age: v }));
                          const ageNum = Number(v);
                          if (v && (isNaN(ageNum) || ageNum < 1 || !Number.isInteger(ageNum))) {
                             setFormErrors(prev => ({ ...prev, age: 'Age must be a whole number (1 or above)' }));
                          } else {
                             setFormErrors(prev => { const c = { ...prev }; delete c.age; return c; });
                          }
                       }} />
                       {formErrors.age && <p className="text-xs text-red-500 mt-1">{formErrors.age}</p>}
                    </div>
                    <div>
                      <select className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.civilStatus ? 'border-red-500 ring-2 ring-red-200' : ''}`} value={registrationForm.civilStatus} onChange={(e) => setRegistrationForm(f => ({ ...f, civilStatus: e.target.value }))}>
                         <option value="">Civil Status</option>
                         <option value="Single">Single</option>
                         <option value="Married">Married</option>
                         <option value="Divorced">Divorced</option>
                         <option value="Widowed">Widowed</option>
                      </select>
                      {formErrors.civilStatus && <p className="text-xs text-red-500 mt-1">{formErrors.civilStatus}</p>}
                    </div>
                    <input type="text" placeholder="Nationality" className="w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={registrationForm.nationality} onChange={(e) => setRegistrationForm(f => ({ ...f, nationality: e.target.value }))} />
                 </div>
                 <input type="text" placeholder="Religion" className="w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={registrationForm.religion} onChange={(e) => setRegistrationForm(f => ({ ...f, religion: e.target.value }))} />
              </div>
           </div>

           {/* Section 3: Contact Details */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                 <div className="p-2 bg-green-100 rounded-lg text-green-600">
                    <Phone className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-semibold text-gray-900">Contact Details</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div>
                    <input type="tel" placeholder="Telephone No." className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.telephoneNo ? 'border-red-300' : ''}`} value={registrationForm.telephoneNo} onChange={(e) => {
                       const v = e.target.value.replace(/[^0-9-+() ]/g, '').slice(0, 20);
                       setRegistrationForm(f => ({ ...f, telephoneNo: v }));
                       setFormErrors(prev => { const c = { ...prev }; delete c.telephoneNo; return c; });
                    }} />
                 </div>
                 <div>
                    <input type="tel" placeholder="Mobile No. (11 digits)" className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.mobileNo ? 'border-red-300' : ''}`} value={registrationForm.mobileNo} onChange={(e) => {
                       const v = e.target.value.replace(/\D/g, '').slice(0, 11);
                       setRegistrationForm(f => ({ ...f, mobileNo: v }));
                       if (v && v.length !== 11) {
                          setFormErrors(prev => ({ ...prev, mobileNo: 'Must be 11 digits' }));
                       } else {
                          setFormErrors(prev => { const c = { ...prev }; delete c.mobileNo; return c; });
                       }
                    }} />
                    {formErrors.mobileNo && <p className="text-xs text-red-500 mt-1">{formErrors.mobileNo}</p>}
                 </div>
                 <div>
                    <input type="email" placeholder="Email Address" className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.email ? 'border-red-300' : ''}`} value={registrationForm.email} onChange={(e) => {
                       const v = e.target.value;
                       setRegistrationForm(f => ({ ...f, email: v }));
                       if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
                          setFormErrors(prev => ({ ...prev, email: 'Invalid email' }));
                       } else {
                          setFormErrors(prev => { const c = { ...prev }; delete c.email; return c; });
                       }
                    }} />
                    {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                 </div>
              </div>
           </div>

           {/* Section 4: Education & Work */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                 <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <Briefcase className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-semibold text-gray-900">Education & Work</h3>
              </div>
              <div className="p-6 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" placeholder="College/School" className="border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={registrationForm.educationCollege} onChange={(e) => setRegistrationForm(f => ({ ...f, educationCollege: e.target.value }))} />
                    <input type="text" placeholder="Course (BS/TechVoc)" className="border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={registrationForm.educationCourse} onChange={(e) => setRegistrationForm(f => ({ ...f, educationCourse: e.target.value }))} />
                 </div>
                 <div className="border-t border-gray-100"></div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" placeholder="Company Employed" className="border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={registrationForm.employmentCompany} onChange={(e) => setRegistrationForm(f => ({ ...f, employmentCompany: e.target.value }))} />
                    <input type="text" placeholder="Position" className="border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={registrationForm.employmentPosition} onChange={(e) => setRegistrationForm(f => ({ ...f, employmentPosition: e.target.value }))} />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" placeholder="Department" className="border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={registrationForm.employmentDepartment} onChange={(e) => setRegistrationForm(f => ({ ...f, employmentDepartment: e.target.value }))} />
                    <div>
                        <input type="number" placeholder="Years of Experience" className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.yearsExp ? 'border-red-300' : ''}`} min={0} value={registrationForm.yearsExp} onChange={(e) => {
                          const v = e.target.value;
                          setRegistrationForm(f => ({ ...f, yearsExp: v }));
                          const yearsNum = parseFloat(v);
                          if (v && (isNaN(yearsNum) || yearsNum < 0)) {
                             setFormErrors(prev => ({ ...prev, yearsExp: 'Experience cannot be negative' }));
                          } else {
                             setFormErrors(prev => { const c = { ...prev }; delete c.yearsExp; return c; });
                          }
                       }} />
                       {formErrors.yearsExp && <p className="text-xs text-red-500 mt-1">{formErrors.yearsExp}</p>}
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <select className="border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={registrationForm.employmentStatus} onChange={(e) => setRegistrationForm(f => ({ ...f, employmentStatus: e.target.value }))}>
                       <option value="">Employment Status</option>
                       <option value="Regular">Regular</option>
                       <option value="Contractual">Contractual</option>
                       <option value="Part-time">Part-time</option>
                       <option value="Self-employed">Self-employed</option>
                    </select>
                    <input type="date" placeholder="Date Employed" className="border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={registrationForm.employmentDate} onChange={(e) => setRegistrationForm(f => ({ ...f, employmentDate: e.target.value }))} />
                 </div>
                 <input type="text" placeholder="References" className="w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={registrationForm.employmentReferences} onChange={(e) => setRegistrationForm(f => ({ ...f, employmentReferences: e.target.value }))} />
              </div>
           </div>

           {/* Section 5: Additional Info */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                 <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <FileCheck className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-semibold text-gray-900">Additional Information (OJT / Others)</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input type="text" placeholder="OJT Industry" className="border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={registrationForm.ojtIndustry} onChange={(e) => setRegistrationForm(f => ({ ...f, ojtIndustry: e.target.value }))} />
                  <input type="text" placeholder="OJT Company" className="border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={registrationForm.ojtCompany} onChange={(e) => setRegistrationForm(f => ({ ...f, ojtCompany: e.target.value }))} />
                </div>
                <input type="text" placeholder="OJT Address" className="w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={registrationForm.ojtAddress} onChange={(e) => setRegistrationForm(f => ({ ...f, ojtAddress: e.target.value }))} />
                
                <div className="border-t border-gray-100 pt-4">
                   <p className="text-sm text-gray-500 mb-4">Other Specifications</p>
                   <div className="space-y-4">
                      <input type="text" placeholder="Area of Specialization" className="w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      <textarea placeholder="Other Specification" rows="3" className="w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"></textarea>
                   </div>
                </div>
              </div>
           </div>

           <div className="flex justify-end gap-4 pt-4 sticky bottom-0 bg-white/80 backdrop-blur-sm p-4 border-t border-gray-100 z-10 rounded-xl">
              <button 
                type="button"
                onClick={() => setActiveSubSection('')}
                className="px-6 py-2.5 rounded-xl border border-gray-400 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleStartRegistration}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Submit Registration
              </button>
           </div>
        </motion.form>
      )}
    </motion.div>
  );

  useEffect(() => {
    setSchedulePage(1);
  }, [scheduleSearch]);

  const renderSchedules = () => {
    // 1. Calculate Filtered List
    const filteredSchedules = schedules.filter(s => {
      const q = scheduleSearch.trim().toLowerCase();
      if (!q) return true;
      const title = String(s.title || '').toLowerCase();
      const id = String(s.courseId || '').toLowerCase();
      const date = String(s.date || '').toLowerCase();
      return title.includes(q) || id.includes(q) || date.includes(q);
    });

    // 2. Pagination Logic
    const totalPages = Math.ceil(filteredSchedules.length / SCHEDULE_ITEMS_PER_PAGE);
    const startIndex = (schedulePage - 1) * SCHEDULE_ITEMS_PER_PAGE;
    const currentSchedules = filteredSchedules.slice(startIndex, startIndex + SCHEDULE_ITEMS_PER_PAGE);

    return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Course Schedules</h2>
           <p className="text-gray-500 mt-1">Browse and register for upcoming training sessions</p>
        </div>
        
        {/* Modern Search Bar */}
        <div className="relative w-full md:w-72 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search courses..." 
            value={scheduleSearch}
            onChange={(e) => setScheduleSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
          />
        </div>
      </div>

      <div className="relative min-h-[1000px] lg:min-h-[800px] transition-all duration-500 ease-in-out">
          {/* Previous Button (Left) */}
          <motion.button 
             onClick={() => setSchedulePage(p => Math.max(1, p - 1))} 
             disabled={schedulePage === 1} 
             whileHover={{ x: -6, boxShadow: "0 0 20px rgba(59,130,246,0.6)" }} 
             whileTap={{ scale: 0.9 }} 
             transition={{ type: "spring", stiffness: 300, damping: 20 }} 
             style={{ y: "-50%" }}
             className={` 
               fixed left-2 md:left-6 top-[65%] 
               z-40 
               w-10 h-10 
               rounded-full 
               flex items-center justify-center 
               border transition-colors 
               ${ 
                 schedulePage === 1 
                   ? 'bg-gray-50 border-gray-200 text-gray-300 opacity-50 cursor-not-allowed' 
                   : 'bg-white border-gray-100 text-gray-600 hover:text-blue-600' 
               } 
             `} 
           > 
             <ChevronRight className="w-5 h-5 rotate-180" /> 
           </motion.button>

          {/* Next Button (Right) */}
          <motion.button 
             onClick={() => setSchedulePage(p => Math.min(totalPages || 1, p + 1))} 
             disabled={schedulePage === (totalPages || 1)} 
             whileHover={{ x: 6, boxShadow: "0 0 20px rgba(59,130,246,0.6)" }} 
             whileTap={{ scale: 0.9 }} 
             transition={{ type: "spring", stiffness: 300, damping: 20 }} 
             style={{ y: "-50%" }}
             className={` 
               fixed right-2 md:right-6 top-[65%] 
               z-40 
               w-10 h-10 
               rounded-full 
               flex items-center justify-center 
               border transition-colors 
               ${ 
                 schedulePage === (totalPages || 1) 
                   ? 'bg-gray-50 border-gray-200 text-gray-300 opacity-50 cursor-not-allowed' 
                   : 'bg-white border-gray-100 text-gray-600 hover:text-blue-600' 
               } 
             `} 
           > 
             <ChevronRight className="w-5 h-5" /> 
           </motion.button>

          <AnimatePresence mode="wait">
            <motion.div 
               key={schedulePage}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.3, ease: "easeInOut" }}
               className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredSchedules.length === 0 ? (
                 <div className="col-span-full text-center py-12">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Search className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No schedules found</h3>
                    <p className="text-gray-500">Try adjusting your search terms</p>
                 </div>
              ) : (
                currentSchedules.map((schedule) => {
                   const capacity = schedule.capacity || 0;
                   const registered = schedule.registered || 0;
                   const isFull = registered >= capacity;
                   const percentage = capacity > 0 ? Math.min((registered / capacity) * 100, 100) : (isFull ? 100 : 0);
                   
                   return (
                    <div key={schedule.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                      {/* Card Header with Pattern/Gradient */}
                      <div className="h-24 bg-gradient-to-br from-blue-600 to-indigo-700 relative p-6">
                         <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white border border-white/10">
                            {schedule.courseId}
                         </div>
                         <div className="absolute -bottom-6 left-6 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-blue-600">
                            <BookOpen className="w-6 h-6" />
                         </div>
                      </div>

                      <div className="pt-8 p-6 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {schedule.title}
                        </h3>
                        
                        <div className="space-y-3 mb-6 flex-1">
                          <div className="flex items-center text-gray-500 text-sm">
                            <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                            {schedule.date}
                          </div>
                          
                          {/* Capacity Indicator */}
                          <div className="space-y-1.5">
                             <div className="flex justify-between text-xs font-medium">
                                <span className={isFull ? "text-red-500" : "text-gray-500"}>
                                  {isFull ? "Class Full" : "Slots Available"}
                                </span>
                                <span className="text-gray-700">{registered} / {capacity}</span>
                             </div>
                             <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-green-500'}`}
                                  style={{ width: `${percentage}%` }}
                                />
                             </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedSchedule(schedule);
                            setActiveSubSection('schedule-details');
                            // Smooth scroll to details
                            setTimeout(() => {
                              document.getElementById('schedule-details-view')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }}
                          className="w-full mt-auto py-2.5 px-4 bg-gray-50 text-gray-700 font-medium rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors border border-gray-100 hover:border-blue-200 flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                    </div>
                   );
                })
              )}
            </motion.div>
          </AnimatePresence>
      </div>

      {/* Schedule Details Section - Modernized */}
      {activeSubSection === 'schedule-details' && selectedSchedule && (
        <div id="schedule-details-view" className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
           <div className="p-8 grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                 <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedSchedule.title}</h3>
                    <div className="flex flex-wrap gap-3">
                       <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">
                         ID: {selectedSchedule.courseId}
                       </span>
                       <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-100 flex items-center gap-1">
                         <Calendar className="w-3.5 h-3.5" /> {selectedSchedule.date}
                       </span>
                    </div>
                 </div>
                 
                 <div className="prose prose-blue max-w-none text-gray-600 bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <p>
                       This training course is designed to provide comprehensive knowledge and hands-on experience. 
                       Please ensure you meet all requirements before registering.
                    </p>
                 </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col justify-center items-center text-center">
                 <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-blue-600" />
                 </div>
                 <div className="mb-6">
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Current Enrollment</p>
                    <p className="text-3xl font-bold text-gray-900 my-1">
                      {selectedSchedule.registered} <span className="text-lg text-gray-400 font-normal">/ {selectedSchedule.capacity}</span>
                    </p>
                    {selectedSchedule.registered >= selectedSchedule.capacity && (
                       <span className="inline-block mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wide">
                          Full Capacity
                       </span>
                    )}
                 </div>
                 
                 <button
                    type="button"
                    onClick={() => {
                      if (selectedSchedule.registered >= selectedSchedule.capacity) {
                        setError('This course is already full. Please select another schedule.');
                        setShowErrorModal(true);
                        return;
                      }
                      setRegistrationForm((f) => ({
                        ...f,
                        scheduleId: selectedSchedule.id
                      }));
                      setIsScheduleFixed(true);
                      setActiveSection('registrations');
                      setActiveSubSection('student-registration');
                    }}
                    className={`w-full py-3 px-6 rounded-xl font-bold text-white shadow-lg transform transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                      selectedSchedule.registered >= selectedSchedule.capacity
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-200'
                    }`}
                  >
                    {selectedSchedule.registered >= selectedSchedule.capacity
                      ? 'Registration Closed'
                      : 'Register Now'}
                  </button>
                  
                  <button 
                    onClick={() => setActiveSubSection('')}
                    className="mt-4 text-gray-500 hover:text-gray-700 text-sm font-medium underline-offset-4 hover:underline"
                  >
                    Close Details
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAssessmentForm(prev => ({ ...prev, proofOfPayment: reader.result }));
        setAssessmentErrors(prev => { const c = {...prev}; delete c.proofOfPayment; return c; });
      };
      reader.readAsDataURL(file);
    }
  };

  const submitAssessment = async () => {
    try {
      setSubmitting(true);
      
      // Map flat form state to nested schema structure
      const payload = {
        schoolCompany: assessmentForm.schoolCompany,
        address: assessmentForm.address,
        assessmentId: assessmentForm.assessmentId,
        assessmentTitle: assessmentForm.assessmentTitle,
        name: {
          surname: assessmentForm.surname,
          firstname: assessmentForm.firstname,
          middlename: assessmentForm.middlename,
          middleInitial: assessmentForm.middleInitial
        },
        mailingAddress: assessmentForm.mailingAddress,
        parents: {
          motherName: assessmentForm.motherName,
          fatherName: assessmentForm.fatherName
        },
        sex: assessmentForm.sex,
        civilStatus: assessmentForm.civilStatus,
        contact: {
          email: assessmentForm.email,
          mobile: assessmentForm.mobile
        },
        education: {
          attainment: assessmentForm.educationAttainment,
          othersSpecification: assessmentForm.educationOthers
        },
        employmentStatus: assessmentForm.employmentStatus,
        birth: {
          date: assessmentForm.birthDate,
          place: assessmentForm.birthPlace,
          age: assessmentForm.age
        },
        payment: {
          isOnline: assessmentForm.paymentMethod === 'Online',
          senderGcashNumber: assessmentForm.senderGcash,
          referenceNumber: assessmentForm.referenceNumber,
          proofOfPayment: assessmentForm.proofOfPayment
        }
      };

      const res = await fetch('/api/assessment-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to submit application');
      
      setAssessmentStep(3); // Show Instructions immediately
      loadData(); // Refresh list in background
    } catch (err) {
      setError(err.message);
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const validateAssessmentStep1 = () => {
    const errors = {};
    if (!assessmentForm.schoolCompany) errors.schoolCompany = "School/Company Name is required.";
    if (!assessmentForm.address) errors.address = "Address is required.";
    if (!assessmentForm.assessmentId) errors.assessmentId = "Please select an Assessment.";
    
    // Personal Info
    if (!assessmentForm.surname) errors.surname = "Surname is required.";
    if (!assessmentForm.firstname) errors.firstname = "First Name is required.";
    if (!assessmentForm.age) {
       errors.age = "Age is required.";
     } else {
       const ageNum = Number(assessmentForm.age);
       if (isNaN(ageNum) || ageNum < 1 || !Number.isInteger(ageNum)) {
         errors.age = "Age must be a whole number (1 or above).";
       }
     }
    if (!assessmentForm.birthDate) errors.birthDate = "Birth Date is required.";
    if (!assessmentForm.sex) errors.sex = "Sex is required.";
    if (!assessmentForm.civilStatus) errors.civilStatus = "Civil Status is required.";
    
    // Contact
    if (!assessmentForm.email) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assessmentForm.email)) {
      errors.email = "Invalid email format.";
    }
    if (!assessmentForm.mobile) {
      errors.mobile = "Mobile Number is required.";
    } else if (assessmentForm.mobile.length !== 11) {
      errors.mobile = "Mobile number must be 11 digits.";
    }
    
    return errors;
  };

  const validateAssessmentForm = () => {
    const errors = validateAssessmentStep1();
    if (!assessmentForm.paymentMethod) errors.paymentMethod = "Payment Method is required.";
    if (assessmentForm.paymentMethod === 'Online') {
      if (!assessmentForm.proofOfPayment) errors.proofOfPayment = "Proof of Payment is required for online payment.";
      if (!assessmentForm.senderGcash) {
        errors.senderGcash = "Sender GCash Number is required.";
      } else if (assessmentForm.senderGcash.length !== 11) {
        errors.senderGcash = "GCash Number must be exactly 11 digits.";
      }
    }
    return errors;
  };

  const renderAssessment = () => {
    // 1. Calculate Filtered List
    const filteredAssessments = assessments.filter(a => {
      const q = assessmentSearch.trim().toLowerCase();
      if (!q) return true;
      return (a.title || '').toLowerCase().includes(q) || (a.status || '').toLowerCase().includes(q);
    });

    // 2. Pagination Logic
    const totalPages = Math.ceil(filteredAssessments.length / ASSESSMENT_ITEMS_PER_PAGE);
    const startIndex = (assessmentPage - 1) * ASSESSMENT_ITEMS_PER_PAGE;
    const currentAssessments = filteredAssessments.slice(startIndex, startIndex + ASSESSMENT_ITEMS_PER_PAGE);

    return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Assessments</h2>
           <p className="text-gray-500 mt-1">Apply for certification and skills assessment</p>
        </div>
        
        {assessmentStep === 0 && (
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
             <div className="relative w-full md:w-64 group">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
               </div>
               <input 
                 type="text" 
                 placeholder="Search assessments..." 
                 value={assessmentSearch}
                 onChange={(e) => {
                    setAssessmentSearch(e.target.value);
                    setAssessmentPage(1);
                 }}
                 className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
               />
             </div>

             <button
               onClick={() => {
                 setAssessmentForm(INITIAL_ASSESSMENT_FORM);
                 setIsAssessmentFixed(false);
                 setAssessmentStep(1);
               }}
               className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 font-medium whitespace-nowrap"
             >
               <UserPlus className="w-5 h-5" />
               New Application
             </button>
          </div>
        )}
      </div>

      {assessmentStep === 0 ? (
        <div className="relative min-h-[1000px] lg:min-h-[800px] transition-all duration-500 ease-in-out">
          {/* Previous Button (Left) */}
          <motion.button 
             onClick={() => setAssessmentPage(p => Math.max(1, p - 1))} 
             disabled={assessmentPage === 1} 
             whileHover={{ x: -6, boxShadow: "0 0 20px rgba(59,130,246,0.6)" }} 
             whileTap={{ scale: 0.9 }} 
             transition={{ type: "spring", stiffness: 300, damping: 20 }} 
             style={{ y: "-50%" }}
             className={` 
               fixed left-2 md:left-6 top-[65%] 
               z-40 
               w-10 h-10 
               rounded-full 
               flex items-center justify-center 
               border transition-colors 
               ${ 
                 assessmentPage === 1 
                   ? 'bg-gray-50 border-gray-200 text-gray-300 opacity-50 cursor-not-allowed' 
                   : 'bg-white border-gray-100 text-gray-600 hover:text-blue-600' 
               } 
             `} 
           > 
             <ChevronRight className="w-5 h-5 rotate-180" /> 
           </motion.button>

          {/* Next Button (Right) */}
          <motion.button 
             onClick={() => setAssessmentPage(p => Math.min(totalPages || 1, p + 1))} 
             disabled={assessmentPage === (totalPages || 1)} 
             whileHover={{ x: 6, boxShadow: "0 0 20px rgba(59,130,246,0.6)" }} 
             whileTap={{ scale: 0.9 }} 
             transition={{ type: "spring", stiffness: 300, damping: 20 }} 
             style={{ y: "-50%" }}
             className={` 
               fixed right-2 md:right-6 top-[65%] 
               z-40 
               w-10 h-10 
               rounded-full 
               flex items-center justify-center 
               border transition-colors 
               ${ 
                 assessmentPage === (totalPages || 1) 
                   ? 'bg-gray-50 border-gray-200 text-gray-300 opacity-50 cursor-not-allowed' 
                   : 'bg-white border-gray-100 text-gray-600 hover:text-blue-600' 
               } 
             `} 
           > 
             <ChevronRight className="w-5 h-5" /> 
           </motion.button>

          <AnimatePresence mode="wait">
            <motion.div 
               key={assessmentPage}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.3, ease: "easeInOut" }}
               className="flex flex-wrap justify-start gap-6"
            >
            {filteredAssessments.length === 0 ? (
             <div className="w-full text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                   <FileCheck className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No assessments found</h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
             </div>
          ) : (
            currentAssessments.map((assessment) => {
              const studentCount = applications.filter(a => a.assessmentId === assessment.id).length;
              const isOpen = assessment.status === 'Open' || assessment.status === 'Active';
              const isFull = studentCount >= (assessment.capacity || 0);
              const capacity = assessment.capacity || 0;
              const percentage = capacity > 0 ? Math.min((studentCount / capacity) * 100, 100) : (isFull ? 100 : 0);

              return (
                <div key={assessment.id} className="w-full md:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1.5rem)] max-w-sm group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
                   
                   <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                         <div className={`p-3 rounded-xl ${isOpen ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                            <FileCheck className="w-6 h-6" />
                         </div>
                         <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                            isOpen 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                            {assessment.status}
                          </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {assessment.title}
                      </h3>
                      
                      <div className="space-y-4 mb-6 flex-1">
                         <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            <span className="font-medium">Assessment Fee</span>
                            <span className="font-bold text-gray-900">{assessment.fee}</span>
                         </div>

                         {/* Capacity */}
                         <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium">
                               <span className={isFull ? "text-red-500" : "text-gray-500"}>
                                 {isFull ? "Slots Full" : "Slots Available"}
                               </span>
                               <span className="text-gray-700">{studentCount} / {capacity}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                               <div 
                                 className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-green-500'}`}
                                 style={{ width: `${percentage}%` }}
                               />
                            </div>
                         </div>
                      </div>

                      <button
                        onClick={() => {
                          setAssessmentForm({
                            ...INITIAL_ASSESSMENT_FORM,
                            assessmentId: assessment.id,
                            assessmentTitle: assessment.title
                          });
                          setIsAssessmentFixed(true);
                          setAssessmentStep(1);
                        }}
                        disabled={!isOpen || isFull}
                        className={`w-full py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                           isOpen && !isFull
                             ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg shadow-blue-200'
                             : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                        }`}
                      >
                        {isOpen && !isFull ? (
                           <>Apply Now <ChevronRight className="w-4 h-4" /></>
                        ) : (
                           <span>{isFull ? 'Full Capacity' : 'Unavailable'}</span>
                        )}
                      </button>
                   </div>
                </div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>
      </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className={`flex items-center ${assessmentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${assessmentStep >= 1 ? 'border-blue-600 bg-blue-50' : 'border border-gray-400'}`}>1</div>
              <span className="ml-2 font-medium">Form</span>
            </div>
            <div className={`w-16 h-1 bg-gray-300 mx-4 ${assessmentStep >= 2 ? 'bg-blue-600' : ''}`} />
            <div className={`flex items-center ${assessmentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${assessmentStep >= 2 ? 'border-blue-600 bg-blue-50' : 'border border-gray-400'}`}>2</div>
              <span className="ml-2 font-medium">Payment</span>
            </div>
            <div className={`w-16 h-1 bg-gray-300 mx-4 ${assessmentStep >= 3 ? 'bg-blue-600' : ''}`} />
            <div className={`flex items-center ${assessmentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${assessmentStep >= 3 ? 'border-blue-600 bg-blue-50' : 'border border-gray-400'}`}>3</div>
              <span className="ml-2 font-medium">Done</span>
            </div>
          </div>

          {/* Step 1: Form */}
          {assessmentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Section 1: Assessment & School Details */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                   <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <Briefcase className="w-5 h-5" />
                   </div>
                   <h3 className="text-lg font-semibold text-gray-900">Application Details</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Title</label>
                    {isAssessmentFixed ? (
                      <input 
                        type="text" 
                        className="w-full border border-gray-400 rounded-xl px-4 py-2.5 bg-gray-100 text-gray-700 cursor-not-allowed focus:outline-none"
                        value={assessmentForm.assessmentTitle}
                        readOnly
                      />
                    ) : (
                      <select 
                        className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.assessmentId ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                        value={assessmentForm.assessmentId}
                        onChange={e => {
                          const selected = assessments.find(a => a.id === e.target.value);
                          setAssessmentForm({
                            ...assessmentForm, 
                            assessmentId: e.target.value,
                            assessmentTitle: selected ? selected.title : ''
                          });
                          if (e.target.value) setAssessmentErrors(prev => { const c = {...prev}; delete c.assessmentId; return c; });
                        }}
                      >
                        <option value="">-- Select Assessment --</option>
                        {assessments
                          .filter(a => a.status === 'Open' || a.status === 'Active')
                          .map(a => (
                            <option key={a.id} value={a.id}>{a.title}</option>
                          ))}
                      </select>
                    )}
                    {assessmentErrors.assessmentId && !isAssessmentFixed && <p className="text-sm text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {assessmentErrors.assessmentId}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School/Company Name</label>
                    <input 
                      type="text" 
                      className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.schoolCompany ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                      value={assessmentForm.schoolCompany}
                      onChange={e => {
                        setAssessmentForm({...assessmentForm, schoolCompany: e.target.value});
                        if (e.target.value) setAssessmentErrors(prev => { const c = {...prev}; delete c.schoolCompany; return c; });
                      }}
                    />
                    {assessmentErrors.schoolCompany && <p className="text-sm text-red-500 mt-1">{assessmentErrors.schoolCompany}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School/Company Address</label>
                    <input 
                      type="text" 
                      className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.address ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                      value={assessmentForm.address}
                      onChange={e => {
                        setAssessmentForm({...assessmentForm, address: e.target.value});
                        if (e.target.value) setAssessmentErrors(prev => { const c = {...prev}; delete c.address; return c; });
                      }}
                    />
                    {assessmentErrors.address && <p className="text-sm text-red-500 mt-1">{assessmentErrors.address}</p>}
                  </div>
                </div>
              </div>

              {/* Section 2: Personal Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                   <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                      <User className="w-5 h-5" />
                   </div>
                   <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1">
                      <input 
                        type="text" 
                        placeholder="Surname" 
                        className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.surname ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                        value={assessmentForm.surname} 
                        onChange={e => {
                          setAssessmentForm({...assessmentForm, surname: e.target.value});
                          if (e.target.value) setAssessmentErrors(prev => { const c = {...prev}; delete c.surname; return c; });
                        }} 
                      />
                      {assessmentErrors.surname && <p className="text-sm text-red-500 mt-1">{assessmentErrors.surname}</p>}
                    </div>
                    <div className="md:col-span-1">
                      <input 
                        type="text" 
                        placeholder="First Name" 
                        className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.firstname ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                        value={assessmentForm.firstname} 
                        onChange={e => {
                          setAssessmentForm({...assessmentForm, firstname: e.target.value});
                          if (e.target.value) setAssessmentErrors(prev => { const c = {...prev}; delete c.firstname; return c; });
                        }} 
                      />
                      {assessmentErrors.firstname && <p className="text-sm text-red-500 mt-1">{assessmentErrors.firstname}</p>}
                    </div>
                    <input type="text" placeholder="Middle Name" className="border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={assessmentForm.middlename} onChange={e => setAssessmentForm({...assessmentForm, middlename: e.target.value})} />
                    <input type="text" placeholder="M.I." className="border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-24" value={assessmentForm.middleInitial} onChange={e => setAssessmentForm({...assessmentForm, middleInitial: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <select 
                        className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.sex ? 'border-red-500 ring-2 ring-red-200' : ''}`} 
                        value={assessmentForm.sex} 
                        onChange={e => {
                          setAssessmentForm({...assessmentForm, sex: e.target.value});
                          if (e.target.value) setAssessmentErrors(prev => { const c = {...prev}; delete c.sex; return c; });
                        }}
                      >
                        <option value="">-- Sex --</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                      {assessmentErrors.sex && <p className="text-sm text-red-500 mt-1">{assessmentErrors.sex}</p>}
                    </div>

                    <div>
                      <select 
                        className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.civilStatus ? 'border-red-500 ring-2 ring-red-200' : ''}`} 
                        value={assessmentForm.civilStatus} 
                        onChange={e => {
                          setAssessmentForm({...assessmentForm, civilStatus: e.target.value});
                          if (e.target.value) setAssessmentErrors(prev => { const c = {...prev}; delete c.civilStatus; return c; });
                        }}
                      >
                        <option value="">-- Civil Status --</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Separated">Separated</option>
                      </select>
                      {assessmentErrors.civilStatus && <p className="text-sm text-red-500 mt-1">{assessmentErrors.civilStatus}</p>}
                    </div>

                    <div className="md:col-span-1">
                      <input 
                        type="number" 
                        placeholder="Age" 
                        className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.age ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                        value={assessmentForm.age} 
                        min="1"
                        step="1"
                        onChange={e => {
                          const val = e.target.value;
                          setAssessmentForm({...assessmentForm, age: val});
                          
                          const ageNum = Number(val);
                          if (val && (isNaN(ageNum) || ageNum < 1 || !Number.isInteger(ageNum))) {
                             setAssessmentErrors(prev => ({ ...prev, age: 'Age must be a whole number (1 or above)' }));
                          } else {
                             setAssessmentErrors(prev => { const c = {...prev}; delete c.age; return c; });
                          }
                        }} 
                      />
                      {assessmentErrors.age && <p className="text-sm text-red-500 mt-1">{assessmentErrors.age}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                      <input 
                        type="date" 
                        className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.birthDate ? 'border-red-500 ring-2 ring-red-200' : ''}`} 
                        value={assessmentForm.birthDate} 
                        onChange={e => {
                          setAssessmentForm({...assessmentForm, birthDate: e.target.value});
                          if (e.target.value) setAssessmentErrors(prev => { const c = {...prev}; delete c.birthDate; return c; });
                        }} 
                      />
                      {assessmentErrors.birthDate && <p className="text-sm text-red-500 mt-1">{assessmentErrors.birthDate}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birth Place</label>
                      <input type="text" className="w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={assessmentForm.birthPlace} onChange={e => setAssessmentForm({...assessmentForm, birthPlace: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" placeholder="Mother's Name" className="border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={assessmentForm.motherName} onChange={e => setAssessmentForm({...assessmentForm, motherName: e.target.value})} />
                    <input type="text" placeholder="Father's Name" className="border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={assessmentForm.fatherName} onChange={e => setAssessmentForm({...assessmentForm, fatherName: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Section 3: Mailing Address */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                   <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                      <MapPin className="w-5 h-5" />
                   </div>
                   <h3 className="text-lg font-semibold text-gray-900">Mailing Address</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <input type="text" placeholder="Number, Street" className="md:col-span-3 border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={assessmentForm.mailingAddress.numberStreet} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, numberStreet: e.target.value}})} />
                  <input type="text" placeholder="Barangay" className="border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={assessmentForm.mailingAddress.barangay} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, barangay: e.target.value}})} />
                  <input type="text" placeholder="District" className="border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={assessmentForm.mailingAddress.district} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, district: e.target.value}})} />
                  <input type="text" placeholder="City" className="border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={assessmentForm.mailingAddress.city} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, city: e.target.value}})} />
                  <input type="text" placeholder="Province" className="border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={assessmentForm.mailingAddress.province} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, province: e.target.value}})} />
                  <input type="text" placeholder="Region" className="border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={assessmentForm.mailingAddress.region} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, region: e.target.value}})} />
                  <input type="text" placeholder="Zip Code" className="border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={assessmentForm.mailingAddress.zipCode} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, zipCode: e.target.value}})} />
                </div>
              </div>

              {/* Section 4: Contact & Education */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                   <div className="p-2 bg-green-100 rounded-lg text-green-600">
                      <GraduationCap className="w-5 h-5" />
                   </div>
                   <h3 className="text-lg font-semibold text-gray-900">Education & Contact</h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input 
                        type="email" 
                        placeholder="Email" 
                        className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.email ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                        value={assessmentForm.email} 
                        onChange={e => {
                          setAssessmentForm({...assessmentForm, email: e.target.value});
                          if (e.target.value) setAssessmentErrors(prev => { const c = {...prev}; delete c.email; return c; });
                        }} 
                      />
                      {assessmentErrors.email && <p className="text-sm text-red-500 mt-1">{assessmentErrors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                      <input 
                        type="text" 
                        placeholder="Mobile Number" 
                        className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.mobile ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                        value={assessmentForm.mobile} 
                        onChange={e => {
                          setAssessmentForm({...assessmentForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 11)});
                          if (e.target.value) setAssessmentErrors(prev => { const c = {...prev}; delete c.mobile; return c; });
                        }} 
                      />
                      {assessmentErrors.mobile && <p className="text-sm text-red-500 mt-1">{assessmentErrors.mobile}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Highest Educational Attainment</label>
                      <select 
                        className="w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        value={assessmentForm.educationAttainment}
                        onChange={e => setAssessmentForm({...assessmentForm, educationAttainment: e.target.value})}
                      >
                        <option value="">-- Select --</option>
                        <option value="Elementary Graduate">Elementary Graduate</option>
                        <option value="High School Graduate">High School Graduate</option>
                        <option value="TVET Graduate">TVET Graduate</option>
                        <option value="College Graduate">College Graduate</option>
                        <option value="Others">Others</option>
                      </select>
                      {assessmentForm.educationAttainment === 'Others' && (
                        <input 
                          type="text" 
                          placeholder="Please specify" 
                          className="mt-2 w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          value={assessmentForm.educationOthers}
                          onChange={e => setAssessmentForm({...assessmentForm, educationOthers: e.target.value})}
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
                      <select 
                        className="w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        value={assessmentForm.employmentStatus}
                        onChange={e => setAssessmentForm({...assessmentForm, employmentStatus: e.target.value})}
                      >
                        <option value="">-- Select --</option>
                        <option value="Casual">Casual</option>
                        <option value="Job Order">Job Order</option>
                        <option value="Probationary">Probationary</option>
                        <option value="Permanent">Permanent</option>
                        <option value="Self-Employed">Self-Employed</option>
                        <option value="OFW">OFW</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white/80 backdrop-blur-sm p-4 border-t border-gray-100 z-10 rounded-xl">
                <button 
                  onClick={() => setAssessmentStep(0)}
                  className="px-6 py-2.5 rounded-xl border border-gray-400 text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    const selectedAssessment = assessments.find(a => a.id === assessmentForm.assessmentId);
                    const currentCount = applications.filter(app => app.assessmentId === assessmentForm.assessmentId).length;
                    
                    if (selectedAssessment) {
                      const isFull = currentCount >= selectedAssessment.capacity;
                      const isClosed = selectedAssessment.status !== 'Open' && selectedAssessment.status !== 'Active';
                      
                      if (isFull || isClosed) {
                        setError('This assessment is closed or has reached full capacity. You cannot proceed with the application.');
                        setShowErrorModal(true);
                        return;
                      }
                    }

                    const errors = validateAssessmentStep1();
                    if (Object.keys(errors).length > 0) {
                      setAssessmentErrors(errors);
                      setError('Please check the form, something is wrong.');
                      setShowErrorModal(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      setAssessmentStep(2);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  Next: Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {assessmentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold border-b pb-2">Payment Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="flex gap-4">
                  <label className={`flex items-center gap-2 border p-4 rounded-lg cursor-pointer hover:bg-gray-50 w-full ${assessmentErrors.paymentMethod ? 'border-red-500 bg-red-50' : ''}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="Online" 
                      checked={assessmentForm.paymentMethod === 'Online'}
                      onChange={e => {
                        setAssessmentForm({...assessmentForm, paymentMethod: e.target.value});
                        setAssessmentErrors(prev => { const c = {...prev}; delete c.paymentMethod; return c; });
                      }}
                    />
                    <div>
                      <span className="font-bold block">Online Payment (GCash)</span>
                      <span className="text-sm text-gray-500">Pay via GCash and upload proof</span>
                    </div>
                  </label>
                  <label className={`flex items-center gap-2 border p-4 rounded-lg cursor-pointer hover:bg-gray-50 w-full ${assessmentErrors.paymentMethod ? 'border-red-500 bg-red-50' : ''}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="No" 
                      checked={assessmentForm.paymentMethod === 'No'}
                      onChange={e => {
                        setAssessmentForm({...assessmentForm, paymentMethod: e.target.value});
                        setAssessmentErrors(prev => { const c = {...prev}; delete c.paymentMethod; return c; });
                      }}
                    />
                    <div>
                      <span className="font-bold block">No / On-site Payment</span>
                      <span className="text-sm text-gray-500">Pay at the office</span>
                    </div>
                  </label>
                </div>
                {assessmentErrors.paymentMethod && <p className="text-sm text-red-600 mt-1">{assessmentErrors.paymentMethod}</p>}
              </div>

              {assessmentForm.paymentMethod === 'Online' && (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-24 h-24 bg-white flex items-center justify-center border rounded overflow-hidden cursor-zoom-in" onClick={() => paymentConfig.qrCodeImage && setZoomedImage(paymentConfig.qrCodeImage)}>
                      {paymentConfig.qrCodeImage ? (
                        <img src={paymentConfig.qrCodeImage} alt="GCash QR" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xs text-gray-500">QR CODE</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-lg">MTC Official GCash</p>
                      <p className="text-blue-800 text-xl font-mono">{paymentConfig.gcashNumber || '0917-123-4567'}</p>
                      <p className="text-sm text-gray-600">Please pay the exact amount: <span className="font-bold">P500.00</span></p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input 
                        type="text" 
                        placeholder="Sender GCash Number" 
                        className={`w-full border rounded px-3 py-2 ${assessmentErrors.senderGcash ? 'border-red-500 bg-red-50' : ''}`}
                        value={assessmentForm.senderGcash}
                        maxLength={11}
                        onChange={e => {
                           const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                           setAssessmentForm({...assessmentForm, senderGcash: val});
                           if (val.length === 11) {
                              setAssessmentErrors(prev => { const c = {...prev}; delete c.senderGcash; return c; });
                           }
                         }}
                      />
                      {assessmentErrors.senderGcash && <p className="text-xs text-red-600 mt-1">{assessmentErrors.senderGcash}</p>}
                    </div>
                    <input 
                      type="text" 
                      placeholder="Reference Number" 
                      className="border rounded px-3 py-2"
                      value={assessmentForm.referenceNumber}
                      onChange={e => setAssessmentForm({...assessmentForm, referenceNumber: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Proof of Payment (Screenshot)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      className={`w-full border rounded px-3 py-2 bg-white ${assessmentErrors.proofOfPayment ? 'border-red-500' : ''}`}
                    />
                    {assessmentErrors.proofOfPayment && <p className="text-sm text-red-600 mt-1">{assessmentErrors.proofOfPayment}</p>}
                    {assessmentForm.proofOfPayment && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Image uploaded
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => setAssessmentStep(1)}
                  className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Back
                </button>
                <button 
                  onClick={() => {
                    const error = validateAssessmentForm();
                    if (error && Object.keys(error).length > 0) {
                      setAssessmentErrors(error);
                      setError('Please check the form, something is wrong.');
                      setShowErrorModal(true);
                    } else {
                      submitAssessment();
                    }
                  }}
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {assessmentStep === 3 && (
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Application Submitted!</h3>
                <p className="text-gray-600 mt-2">Your assessment application has been successfully recorded.</p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-left max-w-2xl mx-auto">
                <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Next Steps
                </h4>
                <ul className="list-disc list-inside space-y-2 text-yellow-900">
                  <li>Visit the MTC office to submit your physical requirements.</li>
                  <li>Fill up the actual Competency Assessment Application Form (TESDA-SOP-CO-01-F11).</li>
                  <li>Bring 3 passport size pictures with collar and white background.</li>
                  <li>Bring your self-assessment guide results.</li>
                </ul>
              </div>

              <button 
                onClick={() => {
                  setActiveSection('dashboard');
                  setAssessmentStep(0);
                }}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                    onClick={() => {
                      // Only use this for registration. Assessment uses its own button.
                      if (activeSection !== 'assessment') {
                        submitRegistrationToServer();
                      }
                    }}
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
              onClick={() => { setActiveSection('assessment'); setActiveSubSection(''); setAssessmentStep(0); }}
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
        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'registrations' && renderRegistrations()}
        {activeSection === 'schedules' && renderSchedules()}
        {activeSection === 'assessment' && renderAssessment()}
      </div>

      {/* Custom Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Attention Needed</h3>
              <p className="text-gray-600 mb-6 text-lg">
                {error || 'Please check the form, something is wrong.'}
              </p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold text-lg"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {activeSection === 'assessment' ? 'Application Submitted!' : 'Registration Successful!'}
              </h3>
              <p className="text-gray-600 mb-6 text-lg">
                Your application has been submitted successfully.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold text-lg"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Zoomed Image Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm p-4 cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img 
              src={zoomedImage} 
              alt="Zoomed" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            <p className="absolute bottom-4 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-full">
              Click anywhere to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
