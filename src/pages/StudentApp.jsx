import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from 'react-hot-toast';
import { User, UserPlus, Calendar, FileCheck, Search, Eye, Users, BookOpen, Clock, AlertCircle, CheckCircle, ChevronRight, Briefcase, GraduationCap, Phone, MapPin, LogOut, Bell, ChevronDown, Settings, Mail, Camera, Save, X, Loader2, Trash2 } from 'lucide-react';
import CustomDropdown from '../components/CustomDropdown';

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
  const [user, setUser] = useState(null);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [profileForm, setProfileForm] = useState({
    firstName: '', lastName: '', email: '', mobileNo: '', profilePicture: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeSubSection, setActiveSubSection] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [error, setError] = useState('');
  const [upcomingSchedules, setUpcomingSchedules] = useState(0);
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [assessmentSearch, setAssessmentSearch] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorContext, setErrorContext] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [hiddenSchedules, setHiddenSchedules] = useState([]);
  const authedFetch = (input, init = {}) => {
    const token = localStorage.getItem('studentToken');
    const headers = {
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    return window.fetch(input, { ...init, headers });
  };
  const fetch = authedFetch;
  const withStudentAuthHeaders = (headers = {}) => {
    const token = localStorage.getItem('studentToken');
    return { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  useEffect(() => {
     // Check for payment return
     const params = new URLSearchParams(window.location.search);
     if (params.get('payment_status') === 'success') {
       const ref = params.get('ref');
       const savedForm = localStorage.getItem('assessmentFormTemp');
       if (savedForm) {
          const parsed = JSON.parse(savedForm);
          setAssessmentForm({
             ...parsed,
             paymentMethod: 'Online',
             referenceNumber: ref,
             senderGcash: '09XX-XXX-XXXX',
             proofOfPayment: 'https://placehold.co/400x600/005CEE/white?text=PAYMENT+VERIFIED' // Dummy proof
          });
          // Clear temp data
          localStorage.removeItem('assessmentFormTemp');
          // Set section back
          setActiveSection('assessment');
          setAssessmentStep(2);
          
          // Clear URL
          window.history.replaceState({}, document.title, window.location.pathname);
       }
     }

     const stored = localStorage.getItem('hiddenSchedules');
     if (stored) {
       setHiddenSchedules(JSON.parse(stored));
     }
  }, []);

  // eslint-disable-next-line no-unused-vars
  const hideSchedule = (scheduleId) => {
     const updated = [...hiddenSchedules, scheduleId];
     setHiddenSchedules(updated);
     localStorage.setItem('hiddenSchedules', JSON.stringify(updated));
  };

  // --- Assessment Application State ---
  const [assessmentStep, setAssessmentStep] = useState(0); // 0: List, 1: Form, 2: Payment, 3: Success
  const [assessmentPage, setAssessmentPage] = useState(1);
  const ASSESSMENT_ITEMS_PER_PAGE = 6;
  const [schedulePage, setSchedulePage] = useState(1);
  const SCHEDULE_ITEMS_PER_PAGE = 6;
  const [assessmentForm, setAssessmentForm] = useState({
    ...INITIAL_ASSESSMENT_FORM,
    fee: 0 // Initialize fee
  });
  const [isAssessmentFixed, setIsAssessmentFixed] = useState(false);

  const [assessmentErrors, setAssessmentErrors] = useState({});
  // eslint-disable-next-line no-unused-vars
  const [paymentConfig, setPaymentConfig] = useState({ gcashNumber: '0917-123-4567', qrCodeImage: '' });
  // eslint-disable-next-line no-unused-vars
  const [zoomedImage, setZoomedImage] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrPollId, setQrPollId] = useState(null);

  // --- Notification State ---
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

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
      const storedInfo = localStorage.getItem('studentInfo');
      const studentId = storedInfo ? JSON.parse(storedInfo)._id : null;

      const promises = [
        fetch('/api/schedules'),
        fetch('/api/assessments'),
        fetch('/api/system-settings/payment_config')
      ];

      if (studentId) {
        promises.push(fetch(`/api/registrations/student/${studentId}`));
        promises.push(fetch(`/api/assessment-applications/student/${studentId}`));
        promises.push(fetch('/api/notifications/student'));
        promises.push(fetch('/api/notifications/student/unread-count'));
      }

      const results = await Promise.all(promises);
      
      // Check core results
      if (!results[0].ok || !results[1].ok) {
        throw new Error('Failed to load data');
      }

      const schedulesData = await results[0].json();
      const assessmentsData = await results[1].json();
      const settingsData = results[2].ok ? await results[2].json() : null;
      
      let myRegs = [];
      let myApps = [];

      // Handle student-specific data
      if (studentId) {
         if (results[3] && results[3].ok) myRegs = await results[3].json();
         // NOTE: The promise index depends on whether we pushed 2 items or not.
         // If studentId exists, we pushed:
         // 3: registrations/student/:id
         // 4: assessment-applications/student/:id
         // 5: notifications
         // 6: unread-count
         
         if (results[4] && results[4].ok) {
            myApps = await results[4].json();
         }
         
         if (results[5] && results[5].ok) {
            setNotifications(await results[5].json());
         }

         if (results[6] && results[6].ok) {
            const countData = await results[6].json();
            setUnreadCount(countData.count || 0);
         }
      }

      const mappedSchedules = schedulesData.map((s) => ({
        id: s._id, // IMPORTANT: use Mongo _id for registrations
        courseId: s.courseId,
        title: s.courseTitle || s.title,
        date: s.trainingDate ? String(s.trainingDate).slice(0, 10) : '',
        registered: typeof s.registered === 'number' ? s.registered : 0,
        capacity: typeof s.capacity === 'number' ? s.capacity : 0,
        status: s.status || 'Active'
      }));

      const mappedAssessments = assessmentsData.map((a) => ({
        id: a._id || a.assessmentId,
        title: a.title,
        fee: a.fee,
        status: a.status,
        capacity: a.capacity || 0,
        enrolledCount: a.enrolledCount || 0
      }));

      setSchedules(mappedSchedules);
      setAssessments(mappedAssessments);
      setMyRegistrations(myRegs);
      setMyApplications(myApps);
      const now = new Date();
      const upcoming = schedulesData.filter((s) => s.trainingDate && new Date(s.trainingDate) >= now).length;
      setUpcomingSchedules(upcoming);
      
      if (settingsData && settingsData.value) {
        setPaymentConfig(settingsData.value);
      }

      setError('');
      setErrorVisible(false);
    } catch (e) {
      console.error(e);
      setError('Failed to load data from server');
      setErrorVisible(true);
      setErrorContext('load');
    }
  };


  const renderProfile = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden relative">
        {/* Cover Photo */}
        <div className="h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start -mt-16 relative z-10">
             {/* Profile Picture */}
             <div className="relative group">
               <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-2xl overflow-hidden flex items-center justify-center relative">
                 {profileForm.profilePicture ? (
                   <img src={profileForm.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                     <User className="w-12 h-12 text-gray-300" />
                   </div>
                 )}
                 
                 {/* Edit Overlay */}
                 {isEditingProfile && (
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                     <Camera className="w-8 h-8 text-white" />
                   </div>
                 )}
               </div>
               
               {isEditingProfile && (
                 <label className="absolute bottom-1 right-1 bg-blue-600 text-white p-2.5 rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition-transform hover:scale-105 border-2 border-white">
                   <Camera className="w-4 h-4" />
                   <input type="file" accept="image/*" className="hidden" onChange={handleProfilePicUpload} />
                 </label>
               )}
             </div>

             {/* Name and Basic Info */}
             <div className="flex-1 pt-16 md:pt-20">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div>
                   <h2 className="text-3xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h2>
                   <p className="text-gray-500 font-medium flex items-center gap-2 mt-1">
                     <Mail className="w-4 h-4" /> {user?.email}
                   </p>
                 </div>
                 
                 <button 
                   onClick={() => setIsEditingProfile(!isEditingProfile)}
                   className={`px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm ${
                     isEditingProfile 
                       ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                       : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                   }`}
                 >
                   {isEditingProfile ? (
                     <>
                       <X className="w-4 h-4" /> Cancel
                     </>
                   ) : (
                     <>
                       <Settings className="w-4 h-4" /> Edit Profile
                     </>
                   )}
                 </button>
               </div>
             </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 my-8"></div>

          {/* Form Section */}
          <form onSubmit={handleProfileUpdate}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               {/* Left Column: Navigation/Summary (Optional, keeping simple for now) */}
               <div className="lg:col-span-1 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Details</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Manage your personal information and contact details. This information is used for your course registrations and certificates.
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900 text-sm">Account Status</p>
                        <p className="text-blue-700 text-xs mt-0.5">Active Student</p>
                      </div>
                    </div>
                  </div>
               </div>

               {/* Right Column: Inputs */}
               <div className="lg:col-span-2 space-y-8">
                  {/* Name Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-500" /> Identity
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">First Name</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            disabled={!isEditingProfile}
                            className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
                              isEditingProfile 
                                ? 'border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white' 
                                : 'border-transparent bg-gray-50 text-gray-600'
                            }`}
                            value={profileForm.firstName}
                            onChange={e => setProfileForm({...profileForm, firstName: e.target.value})}
                          />
                          <User className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Last Name</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            disabled={!isEditingProfile}
                            className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
                              isEditingProfile 
                                ? 'border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white' 
                                : 'border-transparent bg-gray-50 text-gray-600'
                            }`}
                            value={profileForm.lastName}
                            onChange={e => setProfileForm({...profileForm, lastName: e.target.value})}
                          />
                          <User className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-500" /> Contact Info
                    </h4>
                    <div className="grid grid-cols-1 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                        <div className="relative">
                          <input 
                            type="email" 
                            disabled={true} 
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-transparent bg-gray-50 text-gray-500 cursor-not-allowed"
                            value={profileForm.email}
                          />
                          <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                          <span className="absolute right-4 top-3.5 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Verified</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Mobile Number</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            disabled={!isEditingProfile}
                            placeholder="+63"
                            className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
                              isEditingProfile 
                                ? 'border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white' 
                                : 'border-transparent bg-gray-50 text-gray-600'
                            }`}
                            value={profileForm.mobileNo}
                            onChange={e => setProfileForm({...profileForm, mobileNo: e.target.value})}
                          />
                          <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Button Area */}
                  {isEditingProfile && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-6 flex justify-end"
                    >
                      <button 
                        type="submit" 
                        disabled={submitting}
                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-70 flex items-center gap-2"
                      >
                        {submitting ? (
                          <>Saving Changes...</>
                        ) : (
                          <>
                            <Save className="w-5 h-5" /> Save Changes
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}
               </div>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );

  const renderMyActivity = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">My Activity</h2>
            <p className="text-gray-500 mt-1">Manage your training schedules and assessment applications</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Schedules */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
             <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <BookOpen className="w-5 h-5" />
             </div>
             <h3 className="text-lg font-semibold text-gray-900">Training Schedules</h3>
          </div>
          <div className="p-6">
            {myRegistrations.filter(reg => !hiddenSchedules.includes(reg._id)).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No training courses registered yet.</p>
                <button 
                  onClick={() => setActiveSection('registrations')}
                  className="mt-4 text-blue-600 font-medium hover:underline"
                >
                  Browse Schedules
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myRegistrations
                  .filter(reg => !hiddenSchedules.includes(reg._id))
                  .map(reg => {
                  const sched = reg.scheduleId || {};
                  return (
                    <div key={reg._id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors relative group">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-900">{sched.courseTitle || sched.title || 'Unknown Course'}</h4>
                          <p className="text-sm text-gray-500 mt-1">{sched.courseId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                             reg.status === 'active' ? 'bg-green-100 text-green-700' : 
                             reg.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                           }`}>
                             {reg.status}
                           </span>
                           {['completed', 'drop', 'cancelled'].includes((reg.status || '').toLowerCase()) && (
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 if(window.confirm('Remove this schedule from view? This will not delete the record from the database.')) {
                                    hideSchedule(reg._id);
                                 }
                               }}
                               className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
                               title="Remove from view"
                             >
                               <X className="w-4 h-4" />
                             </button>
                           )}
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {sched.trainingDate ? new Date(sched.trainingDate).toLocaleDateString() : 'TBA'}
                          </span>
                        </div>
                        {reg.remarks && (
                          <div className="text-sm bg-gray-50 p-2 rounded text-gray-600 border border-gray-100">
                            <span className="font-medium text-gray-700">Note:</span> {reg.remarks}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* My Assessments */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
             <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <FileCheck className="w-5 h-5" />
             </div>
             <h3 className="text-lg font-semibold text-gray-900">Assessment Applications</h3>
          </div>
          <div className="p-6">
            {myApplications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No assessment applications submitted yet.</p>
                <button 
                  onClick={() => setActiveSection('assessment')}
                  className="mt-4 text-blue-600 font-medium hover:underline"
                >
                  View Assessments
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myApplications.map(app => (
                  <div key={app._id} className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900">{app.assessmentTitle || 'Unknown Assessment'}</h4>
                        <p className="text-sm text-gray-500 mt-1">ID: {app._id.slice(-6).toUpperCase()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                        app.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                        app.status === 'Rejected' ? 'bg-red-100 text-red-700' : 
                        app.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Applied: {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                          {app.payment?.isOnline && (
                             <span className="text-blue-600 font-medium">Online Payment</span>
                          )}
                        </div>
                      </div>
                      {app.remarks && (
                        <div className="text-sm bg-gray-50 p-2 rounded text-gray-600 border border-gray-100">
                          <span className="font-medium text-gray-700">Note:</span> {app.remarks}
                        </div>
                      )}
                      
                      {/* Allow deletion only if pending */}
                      {app.status === 'Pending' && (
                        <div className="flex justify-end pt-2">
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              // eslint-disable-next-line no-restricted-globals
                              if(!confirm('Are you sure you want to cancel this application?')) return;
                              try {
                                const res = await fetch(`/api/assessment-applications/${app._id}`, {
                                  method: 'DELETE'
                                });
                                if(res.ok) {
                                  toast.success('Application cancelled.');
                                  loadData();
                                } else {
                                  toast.error('Failed to cancel application.');
                                }
                              } catch(err) {
                                toast.error('Error cancelling application.');
                              }
                            }}
                            className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  useEffect(() => {
    const token = localStorage.getItem('studentToken');
    const studentInfo = localStorage.getItem('studentInfo');
    if (token && studentInfo) {
      const u = JSON.parse(studentInfo);
      setUser(u);
      setProfileForm({
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        email: u.email || '',
        mobileNo: u.mobileNo || '',
        profilePicture: u.profilePicture || ''
      });
      // Pre-fill form
      setRegistrationForm(prev => ({
        ...prev,
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        middleName: u.middleName || '',
        email: u.email || '',
        mobileNo: u.mobileNo || '',
        telephoneNo: u.telephoneNo || '',
        age: u.age || '',
        dateOfBirth: u.dateOfBirth ? u.dateOfBirth.slice(0, 10) : '',
        completeAddress: u.completeAddress || '',
        sex: u.sex || '',
        civilStatus: u.civilStatus || '',
        nationality: u.nationality || '',
        religion: u.religion || '',
        educationCollege: u.educationCollege || '',
        educationCourse: u.educationCourse || '',
        employmentCompany: u.employmentCompany || '',
        employmentPosition: u.employmentPosition || '',
        employmentDepartment: u.employmentDepartment || '',
        employmentStatus: u.employmentStatus || '',
        employmentDate: u.employmentDate ? u.employmentDate.slice(0, 10) : '',
        employmentReferences: u.employmentReferences || '',
        ojtIndustry: u.ojtIndustry || '',
        ojtCompany: u.ojtCompany || '',
        ojtAddress: u.ojtAddress || ''
      }));
    }
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch(`/api/students/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      
      if (!res.ok) throw new Error('Failed to update profile');
      
      const updatedUser = await res.json();
      setUser(updatedUser);
      localStorage.setItem('studentInfo', JSON.stringify(updatedUser));
      setIsEditingProfile(false);
      setShowSuccessModal(true);
    } catch (err) {
      setError(err.message);
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfilePicUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm(prev => ({ ...prev, profilePicture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentInfo');
    setUser(null);
    window.location.href = '/student/login';
  };

  const handleMarkRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications/student/${id}/read`, { method: 'PUT' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/student/read-all', { method: 'PUT' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
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
      
      // If user is logged in, update their profile first instead of creating new student
      if (user) {
        const studentRes = await fetchWithTimeout(`/api/students/${user._id}`, {
          method: 'PUT',
          headers: withStudentAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            firstName: registrationForm.firstName.trim(),
            lastName: registrationForm.lastName.trim(),
            middleName: registrationForm.middleName.trim(),
            // Don't update email if it's the same to avoid unique constraint issues
            ...(registrationForm.email.trim() !== user.email ? { email: registrationForm.email.trim() } : {}),
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

        if (!studentRes.ok) {
           const text = await studentRes.text();
           throw new Error(`Failed to update profile: ${text}`);
        }
        
        student = await studentRes.json();
        // Update local storage user
        setUser(student);
        localStorage.setItem('studentInfo', JSON.stringify(student));
      } else {
        throw new Error('Please log in or register before enrolling.');
      }

      const regRes = await fetchWithTimeout('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('studentToken') ? { Authorization: `Bearer ${localStorage.getItem('studentToken')}` } : {})
        },
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
      setShowErrorModal(true);
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

  const handleDeleteNotification = async (id) => {
    try {
      const res = await fetch(`/api/notifications/student/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n._id !== id));
        toast.success('Notification deleted');
        // Update unread count if deleted notification was unread
        const deletedNotif = notifications.find(n => n._id === id);
        if (deletedNotif && !deletedNotif.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else {
        toast.error('Failed to delete notification');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting notification');
    }
  };

  const handleDeleteAllNotifications = async () => {
    if(!window.confirm('Are you sure you want to delete all notifications?')) return;
    try {
      const res = await fetch('/api/notifications/student/all', { method: 'DELETE' });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
        toast.success('All notifications deleted');
      } else {
        toast.error('Failed to clear notifications');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error clearing notifications');
    }
  };

  const renderNotificationsPage = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Notifications</h2>
            <p className="text-gray-500 mt-1">Manage your alerts and messages</p>
         </div>
         {notifications.length > 0 && (
           <div className="flex gap-3">
             {unreadCount > 0 && (
               <button 
                 onClick={handleMarkAllRead}
                 className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 px-4 py-2 hover:bg-blue-50 rounded-lg transition-colors"
               >
                 <CheckCircle className="w-4 h-4" />
                 Mark All as Read
               </button>
             )}
             <button 
               onClick={handleDeleteAllNotifications}
               className="text-red-600 hover:text-red-700 font-medium flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
             >
               <Trash2 className="w-4 h-4" />
               Delete All
             </button>
           </div>
         )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-300" />
             </div>
             <h3 className="text-lg font-semibold text-gray-900 mb-1">No notifications</h3>
             <p>You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(notification => (
              <div 
                key={notification._id} 
                className={`p-6 hover:bg-gray-50 transition-colors flex gap-4 ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
              >
                 <div className={`mt-1 p-2 rounded-full shrink-0 h-fit ${
                    notification.type === 'success' ? 'bg-green-100 text-green-600' :
                    notification.type === 'error' ? 'bg-red-100 text-red-600' :
                    notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
                     notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
                     notification.type === 'warning' ? <AlertCircle className="w-5 h-5" /> :
                     <Bell className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                       <div>
                          <p className={`text-base ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                            {notification.message}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                       </div>
                       <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <button 
                              onClick={() => handleMarkRead(notification._id)}
                              className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteNotification(notification._id)}
                            className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );

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
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => setActiveSection('my-activity')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">My Registrations</p>
              <p className="text-3xl font-bold mt-2">{myRegistrations.length}</p>
            </div>
            <BookOpen className="w-12 h-12 text-blue-200" />
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => setActiveSection('my-activity')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">My Assessments</p>
              <p className="text-3xl font-bold mt-2">{myApplications.length}</p>
            </div>
            <FileCheck className="w-12 h-12 text-purple-200" />
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => setActiveSection('schedules')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Upcoming Schedules</p>
              <p className="text-3xl font-bold mt-2">{upcomingSchedules}</p>
            </div>
            <Clock className="w-12 h-12 text-green-200" />
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
                  </div>
                  <div className="flex items-center justify-end text-sm">
                    {isOpen ? (
                      <button 
                        onClick={() => { 
                          setActiveSection('assessment'); 
                          
                          const prefilled = user ? {
                             ...INITIAL_ASSESSMENT_FORM,
                             surname: user.lastName || '',
                             firstname: user.firstName || '',
                             middlename: user.middleName || '',
                             email: user.email || '',
                             mobile: user.mobileNo || '',
                             sex: user.sex || '',
                             civilStatus: user.civilStatus || '',
                             birthDate: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
                             age: user.age || '',
                             educationAttainment: user.educationCourse || '',
                             employmentStatus: user.employmentStatus || '',
                             address: user.completeAddress || ''
                          } : INITIAL_ASSESSMENT_FORM;

                          setAssessmentForm({
                            ...prefilled,
                            assessmentId: assessment.id,
                            assessmentTitle: assessment.title,
                            fee: assessment.fee || 0 // Capture fee
                          });
                          setAssessmentStep(1); 
                        }}
                        className={`text-blue-600 hover:text-blue-700 font-medium ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!user}
                      >
                        Apply Now
                      </button>
                    ) : (
                      <span className="font-medium cursor-not-allowed px-3 py-1 rounded-full text-xs text-gray-400">
                        Unavailable
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
        <div className="space-y-8">
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
                  // Don't reset everything, keep pre-filled data if exists
                  setRegistrationForm(prev => ({ ...prev, scheduleId: '' }));
                  setActiveSubSection('student-registration');
                }}
                className={`bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-medium inline-flex items-center gap-2 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!user}
              >
                <UserPlus className="w-5 h-5" />
                Start Registration
              </button>
          </motion.div>

          {/* My Registrations List (moved from My Activity) */}
          {myRegistrations.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                 <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <BookOpen className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-semibold text-gray-900">My Training Schedules</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {myRegistrations.map(reg => {
                    const sched = reg.scheduleId || {};
                    return (
                      <div key={reg._id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-gray-900">{sched.courseTitle || sched.title || 'Unknown Course'}</h4>
                            <p className="text-sm text-gray-500 mt-1">{sched.courseId}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                            reg.status === 'active' ? 'bg-green-100 text-green-700' : 
                            reg.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                          }`}>
                            {reg.status}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {sched.trainingDate ? new Date(sched.trainingDate).toLocaleDateString() : 'TBA'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
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
                     className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} 
                     min={new Date().toISOString().split('T')[0]}
                     disabled={!user}
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
                        disabled={!user}
                     />
                  ) : (
                     <CustomDropdown
                        options={[
                           { value: '', label: '-- Choose a Course --' },
                           ...(schedules.length === 0 && errorContext === 'load' 
                              ? [{ value: '', label: 'Unable to load courses (Server Error)', disabled: true }] 
                              : schedules.map(s => {
                                 const isFull = s.registered >= s.capacity;
                                 return {
                                    value: s.id,
                                    label: `${s.title} ${isFull ? '(Full)' : ''}`,
                                    disabled: isFull
                                 };
                              })
                           )
                        ]}
                        value={registrationForm.scheduleId}
                        onChange={(val) => {
                           setRegistrationForm(f => ({ ...f, scheduleId: val }));
                           if (val) setFormErrors(prev => { const c = { ...prev }; delete c.scheduleId; return c; });
                        }}
                        placeholder="-- Choose a Course --"
                        className="w-full"
                        disabled={!user}
                        buttonClassName={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${formErrors.scheduleId ? 'border-red-300 ring-red-200' : ''}`}
                     />
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
                       <input type="text" placeholder="Last Name" disabled={!user} className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.lastName ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.lastName} onChange={(e) => {
                          setRegistrationForm(f => ({ ...f, lastName: e.target.value }));
                          if (formErrors.lastName) setFormErrors(prev => { const c = { ...prev }; delete c.lastName; return c; });
                       }} />
                       {formErrors.lastName && <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>}
                     </div>
                     <div>
                       <input type="text" placeholder="First Name" disabled={!user} className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.firstName ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.firstName} onChange={(e) => {
                          setRegistrationForm(f => ({ ...f, firstName: e.target.value }));
                          if (formErrors.firstName) setFormErrors(prev => { const c = { ...prev }; delete c.firstName; return c; });
                       }} />
                       {formErrors.firstName && <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>}
                     </div>
                     <input type="text" placeholder="Middle Name" disabled={!user} className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.middleName} onChange={(e) => setRegistrationForm(f => ({ ...f, middleName: e.target.value }))} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input type="date" disabled={!user} className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.dateOfBirth ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} max={new Date().toISOString().slice(0, 10)} value={registrationForm.dateOfBirth || ""} onChange={(e) => {
                           setRegistrationForm(f => ({ ...f, dateOfBirth: e.target.value }));
                           if (formErrors.dateOfBirth) setFormErrors(prev => { const c = { ...prev }; delete c.dateOfBirth; return c; });
                        }} />
                        {formErrors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{formErrors.dateOfBirth}</p>}
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Complete Address</label>
                        <input type="text" placeholder="House No., Street, Barangay, City, Province" disabled={!user} className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.completeAddress ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.completeAddress} onChange={(e) => {
                           setRegistrationForm(f => ({ ...f, completeAddress: e.target.value }));
                           if (formErrors.completeAddress) setFormErrors(prev => { const c = { ...prev }; delete c.completeAddress; return c; });
                        }} />
                        {formErrors.completeAddress && <p className="text-xs text-red-500 mt-1">{formErrors.completeAddress}</p>}
                     </div>
                  </div>

                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <CustomDropdown
                         options={[
                            { value: '', label: 'Sex' },
                            { value: 'Male', label: 'Male' },
                            { value: 'Female', label: 'Female' }
                         ]}
                         value={registrationForm.sex}
                         onChange={(val) => {
                            setRegistrationForm(f => ({ ...f, sex: val }));
                            if (formErrors.sex) setFormErrors(prev => { const c = { ...prev }; delete c.sex; return c; });
                         }}
                         placeholder="Sex"
                         className="w-full"
                         disabled={!user}
                         buttonClassName={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.sex ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                      />
                      {formErrors.sex && <p className="text-xs text-red-500 mt-1">{formErrors.sex}</p>}
                    </div>
                    <div>
                       <input type="number" placeholder="Age" disabled={!user} className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.age ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} min="1" step="1" value={registrationForm.age} onChange={(e) => {
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
                      <CustomDropdown
                        options={[
                           { value: '', label: 'Civil Status' },
                           { value: 'Single', label: 'Single' },
                           { value: 'Married', label: 'Married' },
                           { value: 'Divorced', label: 'Divorced' },
                           { value: 'Widowed', label: 'Widowed' }
                        ]}
                        value={registrationForm.civilStatus}
                        onChange={(val) => {
                           setRegistrationForm(f => ({ ...f, civilStatus: val }));
                           if (formErrors.civilStatus) setFormErrors(prev => { const c = { ...prev }; delete c.civilStatus; return c; });
                        }}
                        placeholder="Civil Status"
                        className="w-full"
                        disabled={!user}
                        buttonClassName={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.civilStatus ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                     />
                      {formErrors.civilStatus && <p className="text-xs text-red-500 mt-1">{formErrors.civilStatus}</p>}
                    </div>
                    <input type="text" placeholder="Nationality" disabled={!user} className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.nationality} onChange={(e) => setRegistrationForm(f => ({ ...f, nationality: e.target.value }))} />
                 </div>
                 <input type="text" placeholder="Religion" disabled={!user} className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.religion} onChange={(e) => setRegistrationForm(f => ({ ...f, religion: e.target.value }))} />
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
                    <input type="tel" placeholder="Telephone No." disabled={!user} className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.telephoneNo ? 'border-red-300' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.telephoneNo} onChange={(e) => {
                       const v = e.target.value.replace(/[^0-9-+() ]/g, '').slice(0, 20);
                       setRegistrationForm(f => ({ ...f, telephoneNo: v }));
                       setFormErrors(prev => { const c = { ...prev }; delete c.telephoneNo; return c; });
                    }} />
                 </div>
                 <div>
                    <input type="tel" placeholder="Mobile No. (11 digits)" disabled={!user} className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.mobileNo ? 'border-red-300' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.mobileNo} onChange={(e) => {
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
                    <input type="email" placeholder="Email Address" disabled={!user} className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.email ? 'border-red-300' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.email} onChange={(e) => {
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
                    <input type="text" placeholder="College/School" disabled={!user} className={`border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.educationCollege} onChange={(e) => setRegistrationForm(f => ({ ...f, educationCollege: e.target.value }))} />
                    <input type="text" placeholder="Course (BS/TechVoc)" disabled={!user} className={`border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.educationCourse} onChange={(e) => setRegistrationForm(f => ({ ...f, educationCourse: e.target.value }))} />
                 </div>
                 <div className="border-t border-gray-100"></div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" placeholder="Company Employed" disabled={!user} className={`border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.employmentCompany} onChange={(e) => setRegistrationForm(f => ({ ...f, employmentCompany: e.target.value }))} />
                    <input type="text" placeholder="Position" disabled={!user} className={`border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.employmentPosition} onChange={(e) => setRegistrationForm(f => ({ ...f, employmentPosition: e.target.value }))} />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" placeholder="Department" disabled={!user} className={`border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.employmentDepartment} onChange={(e) => setRegistrationForm(f => ({ ...f, employmentDepartment: e.target.value }))} />
                    <div>
                        <input type="number" placeholder="Years of Experience" disabled={!user} className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.yearsExp ? 'border-red-300' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} min={0} value={registrationForm.yearsExp} onChange={(e) => {
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
                    <CustomDropdown
                       options={[
                          { value: '', label: 'Employment Status' },
                          { value: 'Regular', label: 'Regular' },
                          { value: 'Contractual', label: 'Contractual' },
                          { value: 'Part-time', label: 'Part-time' },
                          { value: 'Self-employed', label: 'Self-employed' }
                       ]}
                       value={registrationForm.employmentStatus}
                       onChange={(val) => setRegistrationForm(f => ({ ...f, employmentStatus: val }))}
                       placeholder="Employment Status"
                       className="w-full"
                       disabled={!user}
                       buttonClassName={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <input type="date" placeholder="Date Employed" disabled={!user} className={`border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.employmentDate} onChange={(e) => setRegistrationForm(f => ({ ...f, employmentDate: e.target.value }))} />
                 </div>
                 <input type="text" placeholder="References" disabled={!user} className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.employmentReferences} onChange={(e) => setRegistrationForm(f => ({ ...f, employmentReferences: e.target.value }))} />
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
                  <input type="text" placeholder="OJT Industry" disabled={!user} className={`border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.ojtIndustry} onChange={(e) => setRegistrationForm(f => ({ ...f, ojtIndustry: e.target.value }))} />
                  <input type="text" placeholder="OJT Company" disabled={!user} className={`border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.ojtCompany} onChange={(e) => setRegistrationForm(f => ({ ...f, ojtCompany: e.target.value }))} />
                </div>
                <input type="text" placeholder="OJT Address" disabled={!user} className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.ojtAddress} onChange={(e) => setRegistrationForm(f => ({ ...f, ojtAddress: e.target.value }))} />
                
                <div className="border-t border-gray-100 pt-4">
                   <p className="text-sm text-gray-500 mb-4">Other Specifications</p>
                   <div className="space-y-4">
                      <input type="text" placeholder="Area of Specialization" disabled={!user} className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} />
                      <textarea placeholder="Other Specification" rows="3" disabled={!user} className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}></textarea>
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
                disabled={!user || submitting}
                className={`bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition-all ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {submitting ? 'Submitting...' : 'Submit Registration'}
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
           <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Paid Training</h2>
           <p className="text-gray-500 mt-1">Browse and register for upcoming training sessions</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 items-center">
          {/* Start Registration Button */}
          <button
            onClick={() => {
              setRegistrationForm({ ...registrationForm, scheduleId: '' });
              setIsScheduleFixed(false);
              setActiveSection('registrations'); // This will need to be handled carefully since we removed the tab
              setActiveSubSection('student-registration');
            }}
            className={`bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 font-medium whitespace-nowrap ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!user}
          >
            <UserPlus className="w-5 h-5" />
            Start Registration
          </button>

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
                         <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm shadow-sm ${
                            schedule.status === 'Active' || schedule.status === 'Ongoing' ? 'bg-green-100 text-green-800 border-green-200' :
                            schedule.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            'bg-red-100 text-red-800 border-red-200'
                         }`}>
                            {schedule.status}
                         </div>
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
                       <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                          selectedSchedule.status === 'Active' || selectedSchedule.status === 'Ongoing' ? 'bg-green-100 text-green-800 border-green-200' :
                          selectedSchedule.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-red-100 text-red-800 border-red-200'
                       }`}>
                         {selectedSchedule.status}
                       </span>
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
                    disabled={!user || selectedSchedule.registered >= selectedSchedule.capacity}
                    className={`w-full py-3 px-6 rounded-xl font-bold text-white shadow-lg transform transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                      (!user || selectedSchedule.registered >= selectedSchedule.capacity)
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-200'
                    }`}
                  >
                    {!user ? 'Login to Register' : (selectedSchedule.registered >= selectedSchedule.capacity
                      ? 'Registration Closed'
                      : 'Register Now')}
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
      <Toaster position="top-right" />
    </div>
  );
};

  // eslint-disable-next-line no-unused-vars
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
      
      // Get studentId from localStorage to ensure linkage
      const storedInfo = localStorage.getItem('studentInfo');
      const studentId = storedInfo ? JSON.parse(storedInfo)._id : null;

      // Map flat form state to nested schema structure
      const payload = {
        studentId: studentId, // Explicitly add studentId
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
                 const prefilled = user ? {
                    ...INITIAL_ASSESSMENT_FORM,
                    surname: user.lastName || '',
                    firstname: user.firstName || '',
                    middlename: user.middleName || '',
                    email: user.email || '',
                    mobile: user.mobileNo || '',
                    sex: user.sex || '',
                    civilStatus: user.civilStatus || '',
                    birthDate: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
                    age: user.age || '',
                    educationAttainment: user.educationCourse || '',
                    employmentStatus: user.employmentStatus || '',
                    address: user.completeAddress || ''
                 } : INITIAL_ASSESSMENT_FORM;

                 setAssessmentForm(prefilled);
                 setIsAssessmentFixed(false);
                 setAssessmentStep(1);
               }}
               disabled={!user}
               className={`bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 font-medium whitespace-nowrap ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              const isOpen = assessment.status === 'Open' || assessment.status === 'Active';
              const hasApplied = myApplications.some(app => app.assessmentId === assessment.id);

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
                      </div>

                      <button
                        onClick={() => {
                          const prefilled = user ? {
                             ...INITIAL_ASSESSMENT_FORM,
                             surname: user.lastName || '',
                             firstname: user.firstName || '',
                             middlename: user.middleName || '',
                             email: user.email || '',
                             mobile: user.mobileNo || '',
                             sex: user.sex || '',
                             civilStatus: user.civilStatus || '',
                             birthDate: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
                             age: user.age || '',
                             educationAttainment: user.educationCourse || '',
                             employmentStatus: user.employmentStatus || '',
                             address: user.completeAddress || ''
                          } : INITIAL_ASSESSMENT_FORM;

                          setAssessmentForm({
                            ...prefilled,
                            assessmentId: assessment.id,
                            assessmentTitle: assessment.title,
                            fee: assessment.fee || 0 // Capture fee
                          });
                          setIsAssessmentFixed(true);
                          setAssessmentStep(1);
                        }}
                        disabled={!user || !isOpen || hasApplied}
                        className={`w-full py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                           user && isOpen && !hasApplied
                             ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg shadow-blue-200'
                             : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                        }`}
                      >
                        {!user ? (
                           <span>Login to Apply</span>
                        ) : hasApplied ? (
                           <span>Already Applied</span>
                        ) : isOpen ? (
                           <>Apply Now <ChevronRight className="w-4 h-4" /></>
                        ) : (
                           <span>Unavailable</span>
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
                      <CustomDropdown
                        options={[
                          { value: '', label: '-- Select Assessment --' },
                          ...assessments
                            .filter(a => a.status === 'Open' || a.status === 'Active')
                            .map(a => ({ value: a.id, label: a.title }))
                        ]}
                        value={assessmentForm.assessmentId}
                        onChange={val => {
                          const selected = assessments.find(a => a.id === val);
                          setAssessmentForm({
                            ...assessmentForm, 
                            assessmentId: val,
                            assessmentTitle: selected ? selected.title : '',
                            fee: selected ? selected.fee : 0 // Capture fee
                          });
                          if (val) setAssessmentErrors(prev => { const c = {...prev}; delete c.assessmentId; return c; });
                        }}
                        placeholder="-- Select Assessment --"
                        className="w-full"
                        disabled={!user}
                        buttonClassName={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.assessmentId ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    )}
                    {assessmentErrors.assessmentId && !isAssessmentFixed && <p className="text-sm text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {assessmentErrors.assessmentId}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School/Company Name</label>
                    <input 
                      type="text" 
                      disabled={!user}
                      className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.schoolCompany ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                      disabled={!user}
                      className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.address ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        disabled={!user}
                        className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.surname ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        disabled={!user}
                        className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.firstname ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                        value={assessmentForm.firstname} 
                        onChange={e => {
                          setAssessmentForm({...assessmentForm, firstname: e.target.value});
                          if (e.target.value) setAssessmentErrors(prev => { const c = {...prev}; delete c.firstname; return c; });
                        }} 
                      />
                      {assessmentErrors.firstname && <p className="text-sm text-red-500 mt-1">{assessmentErrors.firstname}</p>}
                    </div>
                    <input type="text" placeholder="Middle Name" disabled={!user} className={`border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.middlename} onChange={e => setAssessmentForm({...assessmentForm, middlename: e.target.value})} />
                    <input type="text" placeholder="M.I." disabled={!user} className={`border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-24 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.middleInitial} onChange={e => setAssessmentForm({...assessmentForm, middleInitial: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <CustomDropdown
                        options={[
                          { value: '', label: '-- Sex --' },
                          { value: 'Male', label: 'Male' },
                          { value: 'Female', label: 'Female' }
                        ]}
                        value={assessmentForm.sex}
                        onChange={val => {
                          setAssessmentForm({...assessmentForm, sex: val});
                          if (val) setAssessmentErrors(prev => { const c = {...prev}; delete c.sex; return c; });
                        }}
                        placeholder="-- Sex --"
                        className="w-full"
                        disabled={!user}
                        buttonClassName={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.sex ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      {assessmentErrors.sex && <p className="text-sm text-red-500 mt-1">{assessmentErrors.sex}</p>}
                    </div>

                    <div>
                      <CustomDropdown
                        options={[
                          { value: '', label: '-- Civil Status --' },
                          { value: 'Single', label: 'Single' },
                          { value: 'Married', label: 'Married' },
                          { value: 'Widowed', label: 'Widowed' },
                          { value: 'Separated', label: 'Separated' }
                        ]}
                        value={assessmentForm.civilStatus}
                        onChange={val => {
                          setAssessmentForm({...assessmentForm, civilStatus: val});
                          if (val) setAssessmentErrors(prev => { const c = {...prev}; delete c.civilStatus; return c; });
                        }}
                        placeholder="-- Civil Status --"
                        className="w-full"
                        disabled={!user}
                        buttonClassName={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.civilStatus ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      {assessmentErrors.civilStatus && <p className="text-sm text-red-500 mt-1">{assessmentErrors.civilStatus}</p>}
                    </div>

                    <div className="md:col-span-1">
                      <input 
                        type="number" 
                        placeholder="Age" 
                        disabled={!user}
                        className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.age ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        disabled={!user}
                        className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.birthDate ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} 
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
                      <input type="text" disabled={!user} className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.birthPlace} onChange={e => setAssessmentForm({...assessmentForm, birthPlace: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" placeholder="Mother's Name" disabled={!user} className={`border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.motherName} onChange={e => setAssessmentForm({...assessmentForm, motherName: e.target.value})} />
                    <input type="text" placeholder="Father's Name" disabled={!user} className={`border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.fatherName} onChange={e => setAssessmentForm({...assessmentForm, fatherName: e.target.value})} />
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
                  <input type="text" placeholder="Number, Street" disabled={!user} className={`md:col-span-3 border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.mailingAddress.numberStreet} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, numberStreet: e.target.value}})} />
                  <input type="text" placeholder="Barangay" disabled={!user} className={`border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.mailingAddress.barangay} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, barangay: e.target.value}})} />
                  <input type="text" placeholder="District" disabled={!user} className={`border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.mailingAddress.district} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, district: e.target.value}})} />
                  <input type="text" placeholder="City" disabled={!user} className={`border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.mailingAddress.city} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, city: e.target.value}})} />
                  <input type="text" placeholder="Province" disabled={!user} className={`border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.mailingAddress.province} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, province: e.target.value}})} />
                  <input type="text" placeholder="Region" disabled={!user} className={`border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.mailingAddress.region} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, region: e.target.value}})} />
                  <input type="text" placeholder="Zip Code" disabled={!user} className={`border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.mailingAddress.zipCode} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, zipCode: e.target.value}})} />
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
                        disabled={!user}
                        className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.email ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        disabled={!user}
                        className={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${assessmentErrors.mobile ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                      <CustomDropdown
                        options={[
                          { value: '', label: '-- Select --' },
                          { value: 'Elementary Graduate', label: 'Elementary Graduate' },
                          { value: 'High School Graduate', label: 'High School Graduate' },
                          { value: 'TVET Graduate', label: 'TVET Graduate' },
                          { value: 'College Graduate', label: 'College Graduate' },
                          { value: 'Others', label: 'Others' }
                        ]}
                        value={assessmentForm.educationAttainment}
                        onChange={val => setAssessmentForm({...assessmentForm, educationAttainment: val})}
                        placeholder="-- Select --"
                        className="w-full"
                        disabled={!user}
                        buttonClassName={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      {assessmentForm.educationAttainment === 'Others' && (
                        <input 
                          type="text" 
                          placeholder="Please specify" 
                          disabled={!user}
                          className={`mt-2 w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                          value={assessmentForm.educationOthers}
                          onChange={e => setAssessmentForm({...assessmentForm, educationOthers: e.target.value})}
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
                      <CustomDropdown
                        options={[
                          { value: '', label: '-- Select --' },
                          { value: 'Casual', label: 'Casual' },
                          { value: 'Job Order', label: 'Job Order' },
                          { value: 'Probationary', label: 'Probationary' },
                          { value: 'Permanent', label: 'Permanent' },
                          { value: 'Self-Employed', label: 'Self-Employed' },
                          { value: 'OFW', label: 'OFW' }
                        ]}
                        value={assessmentForm.employmentStatus}
                        onChange={val => setAssessmentForm({...assessmentForm, employmentStatus: val})}
                        placeholder="-- Select --"
                        className="w-full"
                        disabled={!user}
                        buttonClassName={`w-full border border-gray-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
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
                    
                    if (selectedAssessment) {
                      const isClosed = selectedAssessment.status !== 'Open' && selectedAssessment.status !== 'Active';
                      
                      if (isClosed) {
                        setError('This assessment is closed. You cannot proceed with the application.');
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
                  disabled={!user}
                  className={`bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition-all ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  <label className={`flex items-center gap-2 border p-4 rounded-lg cursor-pointer hover:bg-gray-50 w-full ${assessmentErrors.paymentMethod ? 'border-red-500 bg-red-50' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="Online" 
                      disabled={!user}
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
                  <label className={`flex items-center gap-2 border p-4 rounded-lg cursor-pointer hover:bg-gray-50 w-full ${assessmentErrors.paymentMethod ? 'border-red-500 bg-red-50' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="No" 
                      disabled={!user}
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
                  <div className="flex flex-col items-center justify-center text-center gap-4 py-4">
                     <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                        <span className="font-bold text-blue-600 text-xl">G</span>
                     </div>
                     <div>
                       <h4 className="font-bold text-gray-900 text-lg">Pay with GCash</h4>
                       <p className="text-gray-600 text-sm max-w-xs mx-auto">
                         You will be redirected to a secure payment gateway to complete your transaction.
                       </p>
                     </div>
                     
                     {assessmentForm.proofOfPayment ? (
                        <div className="w-full bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-left">
                           <div className="bg-green-100 p-2 rounded-full text-green-600">
                             <CheckCircle className="w-5 h-5" />
                           </div>
                           <div>
                             <p className="font-bold text-green-800">Payment Verified</p>
                             <p className="text-sm text-green-700">Ref: {assessmentForm.referenceNumber}</p>
                           </div>
                           <button 
                             onClick={() => setAssessmentForm({...assessmentForm, proofOfPayment: '', referenceNumber: '', senderGcash: ''})}
                             className={`ml-auto text-sm text-red-500 hover:underline ${!user ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                             disabled={!user}
                           >
                             Change
                           </button>
                        </div>
                     ) : (
                       <button
                         onClick={async () => {
                           try {
                             setSubmitting(true);
                             const fee = assessmentForm.fee || 500;
                             
                             const res = await fetch('/api/payment/create-qr', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                   amount: fee,
                                   description: `Payment for ${assessmentForm.assessmentTitle} - ${Date.now()}` // Unique description
                                })
                             });
                             
                             const data = await res.json();
                             
                             if (data.isConfigError) {
                                // Fallback to simulator
                                window.location.href = `/payment-gateway?amount=${fee}`;
                             } else if (data.qrImageUrl) {
                                // Show QR Code Modal
                                setQrCodeData({
                                    url: data.qrImageUrl,
                                    intentId: data.paymentIntentId,
                                    deepLink: data.qrUrl
                                });
                                
                                // Start Polling
                                const pollInterval = setInterval(async () => {
                                    try {
                                        const statusRes = await fetch(`/api/payment/status/${data.paymentIntentId}`);
                                        const statusData = await statusRes.json();
                                        
                                        if (statusData.status === 'succeeded') {
                                            clearInterval(pollInterval);
                                            setQrCodeData(null);
                                            
                                            // 1. Update form state locally
                                            const updatedForm = {
                                                ...assessmentForm,
                                                paymentMethod: 'Online',
                                                referenceNumber: statusData.payments[0]?.id || 'QR-' + Date.now(),
                                                senderGcash: 'QR-PH',
                                                proofOfPayment: 'QR-PH-VERIFIED'
                                            };
                                            setAssessmentForm(updatedForm);
                                            toast.success('Payment Successful! Submitting Application...');
                                            
                                            // 2. Automatically Submit the Application
                                            // We need to call submitAssessment but it depends on the state 'assessmentForm'.
                                            // Since setState is async, we pass the updated form directly to a modified submit function or wrap it.
                                            // For simplicity, let's call a modified version of submit logic here directly.
                                            
                                            try {
                                              setSubmitting(true);
                                              
                                              // Get studentId from localStorage to ensure linkage
                                              const storedInfo = localStorage.getItem('studentInfo');
                                              const studentId = storedInfo ? JSON.parse(storedInfo)._id : null;
                                              
                                              const payload = {
                                                studentId: studentId, // Explicitly add studentId
                                                schoolCompany: updatedForm.schoolCompany,
                                                address: updatedForm.address,
                                                assessmentId: updatedForm.assessmentId,
                                                assessmentTitle: updatedForm.assessmentTitle,
                                                name: {
                                                  surname: updatedForm.surname,
                                                  firstname: updatedForm.firstname,
                                                  middlename: updatedForm.middlename,
                                                  middleInitial: updatedForm.middleInitial
                                                },
                                                mailingAddress: updatedForm.mailingAddress,
                                                parents: {
                                                  motherName: updatedForm.motherName,
                                                  fatherName: updatedForm.fatherName
                                                },
                                                sex: updatedForm.sex,
                                                civilStatus: updatedForm.civilStatus,
                                                contact: {
                                                  email: updatedForm.email,
                                                  mobile: updatedForm.mobile
                                                },
                                                education: {
                                                  attainment: updatedForm.educationAttainment,
                                                  othersSpecification: updatedForm.educationOthers
                                                },
                                                employmentStatus: updatedForm.employmentStatus,
                                                birth: {
                                                  date: updatedForm.birthDate,
                                                  place: updatedForm.birthPlace,
                                                  age: updatedForm.age
                                                },
                                                payment: {
                                                  isOnline: true,
                                                  senderGcashNumber: '09000000000', // Use dummy valid format for QR
                                                  referenceNumber: updatedForm.referenceNumber,
                                                  proofOfPayment: 'QR-PH-VERIFIED'
                                                }
                                              };

                                              const res = await fetch('/api/assessment-applications', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify(payload)
                                              });
                                              if (!res.ok) {
                                                const errorData = await res.json();
                                                throw new Error(errorData.error || 'Failed to submit application');
                                              }
                                              
                                              setAssessmentStep(3); // Success
                                              loadData(); 
                                            } catch (err) {
                                              setError('Application failed to save: ' + err.message);
                                              setShowErrorModal(true);
                                            } finally {
                                              setSubmitting(false);
                                            }
                                        }
                                    } catch (e) {
                                        console.error('Polling error', e);
                                    }
                                }, 3000); // Check every 3 seconds
                                
                                // Store interval ID to clear it later if needed (e.g. user closes modal)
                                setQrPollId(pollInterval);
                                
                             } else {
                                throw new Error(data.error || 'QR generation failed');
                             }
                           } catch (err) {
                             toast.error('Payment Error: ' + err.message);
                           } finally {
                             setSubmitting(false);
                           }
                         }}
                         disabled={submitting || !user}
                         className={`bg-[#005CEE] text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 w-full md:w-auto flex items-center justify-center gap-2 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                       >
                         {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : null}
                         Generate QR Ph Code
                       </button>
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
                  disabled={submitting || !user}
                  className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  loadData(); // Ensure data is reloaded on return
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
                    disabled={submitting || !user}
                    className={`flex-1 ${submitting || !user ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white px-6 py-3 rounded-lg font-medium`}
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

      {/* Dynamic QR Ph Modal */}
      <AnimatePresence>
        {qrCodeData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => {}}
          >
             <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative"
                onClick={e => e.stopPropagation()}
             >
                <button 
                  onClick={() => {
                      setQrCodeData(null);
                      if (qrPollId) clearInterval(qrPollId);
                  }}
                  className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                   <X className="w-5 h-5 text-gray-500" />
                </button>

                <div className="text-center space-y-6">
                   <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
                      <div className="font-bold text-xl">QR</div>
                   </div>
                   
                   <div>
                      <h3 className="text-xl font-bold text-gray-900">Scan to Pay</h3>
                      <p className="text-gray-500 text-sm mt-1">Use GCash, Maya, or any QR Ph app</p>
                   </div>

                   <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-4">
                      <img src={qrCodeData.url} alt="QR Ph Code" className="w-full h-auto object-contain" />
                   </div>

                   <div>
                      <p className="text-2xl font-bold text-gray-900">₱{(assessmentForm.fee || 500).toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-2">Waiting for payment...</p>
                      <div className="flex justify-center mt-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      </div>
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-lg border border-gray-100 shadow-sm">
                <img src="/Logo_MTC.png" alt="MTC Logo" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-none">Mechatronic Training Corporation</h1>
                <p className="text-xs text-gray-500 font-medium">Student Portal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {user ? (
                <>
                  {/* Notification Bell */}
                  <div className="relative">
                    <button 
                      onClick={() => {
                        setShowNotifications(!showNotifications);
                        // Optional: Mark all as read when opening, or let user click "Mark all as read"
                        // For better UX, we usually keep them unread until interaction, but here we can just show them.
                      }}
                      className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                    >
                      <Bell className="w-6 h-6" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                      )}
                    </button>

                    <AnimatePresence>
                      {showNotifications && (
                        <>
                          <div 
                            className="fixed inset-0 z-10 cursor-default" 
                            onClick={() => setShowNotifications(false)}
                          />
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20"
                          >
                            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                              <h3 className="font-bold text-gray-900">Notifications</h3>
                              <div className="flex gap-3">
                                {unreadCount > 0 && (
                                  <button 
                                    onClick={handleMarkAllRead}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                  >
                                    Mark all as read
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                              {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                  <p className="text-sm">No notifications yet</p>
                                </div>
                              ) : (
                                <div className="divide-y divide-gray-100">
                                  {notifications.map(notification => (
                                    <div 
                                      key={notification._id} 
                                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-blue-50/50' : ''}`}
                                      onClick={() => {
                                        if(!notification.isRead) handleMarkRead(notification._id);
                                        setActiveSection('notifications');
                                        setShowNotifications(false);
                                      }}
                                    >
                                      <div className="flex gap-3">
                                        <div className={`mt-1 p-1.5 rounded-full shrink-0 ${
                                          notification.type === 'success' ? 'bg-green-100 text-green-600' :
                                          notification.type === 'error' ? 'bg-red-100 text-red-600' :
                                          notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                          'bg-blue-100 text-blue-600'
                                        }`}>
                                          {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                                           notification.type === 'error' ? <AlertCircle className="w-4 h-4" /> :
                                           notification.type === 'warning' ? <AlertCircle className="w-4 h-4" /> :
                                           <Bell className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1">
                                          <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                            {notification.message.length > 50 ? notification.message.substring(0, 50) + '...' : notification.message}
                                          </p>
                                          <p className="text-xs text-gray-400 mt-1">
                                            {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                          </p>
                                        </div>
                                        {!notification.isRead && (
                                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="p-2 border-t border-gray-100 bg-gray-50">
                               <button 
                                 onClick={() => {
                                   setActiveSection('notifications');
                                   setShowNotifications(false);
                                 }}
                                 className="w-full py-2 text-sm text-center text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                               >
                                 View All Notifications
                               </button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative">
                    <button 
                      onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                      className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-xl transition-all border border-transparent hover:border-gray-200"
                    >
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-500 font-medium">Student</p>
                      </div>
                      <div className="w-10 h-10 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-100 flex-shrink-0">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <User className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {isProfileDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-10 cursor-default" 
                            onClick={() => setIsProfileDropdownOpen(false)}
                          />
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                            className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 py-2"
                          >
                            <div className="px-4 py-3 border-b border-gray-100 mb-2 sm:hidden">
                              <p className="text-sm font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                              <p className="text-xs text-gray-500">Student</p>
                            </div>
                            
                            <button 
                              onClick={() => { setActiveSection('profile'); setIsProfileDropdownOpen(false); }}
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                              <User className="w-4 h-4 text-blue-500" />
                              Edit Profile
                            </button>
                            
                            <button 
                              onClick={() => { setActiveSection('my-activity'); setIsProfileDropdownOpen(false); }}
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                              <Clock className="w-4 h-4 text-purple-500" />
                              My Activity
                            </button>

                            <div className="my-2 border-t border-gray-100"></div>
                            
                            <button 
                              onClick={handleLogout}
                              className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              Logout
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <a href="/student/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    Log in
                  </a>
                  <a href="/student/register" className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Sign up
                  </a>
                </div>
              )}
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
              onClick={() => { setActiveSection('schedules'); setActiveSubSection(''); }}
              className={`px-6 py-4 font-medium transition flex items-center gap-2 ${
                activeSection === 'schedules' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar className="w-5 h-5" />
              PAID TRAINING
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
        {activeSection === 'my-activity' && renderMyActivity()}
        {activeSection === 'profile' && renderProfile()}
        {activeSection === 'notifications' && renderNotificationsPage()}
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
