import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from 'react-hot-toast';
import { User, UserPlus, Calendar, FileCheck, Search, Eye, Users, BookOpen, Clock, AlertCircle, CheckCircle, ChevronRight, Briefcase, GraduationCap, Phone, MapPin, LogOut, Bell, ChevronDown, Settings, Mail, Camera, Save, X, Loader2, Trash2, CreditCard, Wallet, Megaphone, Sun, Moon, Award, Menu } from 'lucide-react';
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
    if (response.status === 401) {
      try { await response.clone().text(); } catch {}
      window.alert('Your session has expired. Please log in again.');
      try { localStorage.removeItem('studentToken'); } catch {}
      try { localStorage.removeItem('studentInfo'); } catch {}
      window.location.href = '/student/login';
      throw new Error('SESSION_EXPIRED');
    }
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error?.name === 'AbortError' || String(error?.message || '').toLowerCase().includes('aborted')) {
      throw new Error('Request timed out. Please try again.');
    }
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

function AnnouncementCarousel({ announcements, darkMode }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]'); } catch { return []; }
  });
  const [showAll, setShowAll] = useState(false);
  const visible = announcements.filter(a => !dismissed.includes(a._id));
  useEffect(() => {
    if (paused || visible.length <= 1) return;
    const id = setInterval(() => { setIndex(i => (i + 1) % visible.length); }, 5000);
    return () => clearInterval(id);
  }, [paused, visible.length]);
  useEffect(() => {
    if (index >= visible.length) setIndex(0);
  }, [visible.length, index]);
  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try { localStorage.setItem('dismissedAnnouncements', JSON.stringify(next)); } catch {}
  };
  const bg = (p) => {
    if (p === 'urgent') return darkMode ? 'from-red-700 to-orange-600' : 'from-red-500 to-orange-500';
    if (p === 'high') return darkMode ? 'from-orange-600 to-amber-500' : 'from-orange-500 to-amber-400';
    if (p === 'medium') return darkMode ? 'from-indigo-700 to-purple-600' : 'from-indigo-600 to-purple-600';
    return darkMode ? 'from-blue-700 to-cyan-600' : 'from-blue-600 to-cyan-500';
  };
  if (visible.length === 0) return null;
  return (
    <div className="space-y-4">
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="relative rounded-3xl overflow-hidden shadow-xl border"
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={visible[index]?._id || index}
            initial={{ opacity: 0, x: 28, scale: 0.995 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -28, scale: 0.995 }}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.55 }}
            className={`p-5 sm:p-6 md:p-8 bg-gradient-to-r ${bg(visible[index]?.priority)} ${darkMode ? 'text-white border-gray-700' : 'text-white border-white/20'}`}
          >
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-white/10' : 'bg-black/10'}`}>
                  {(() => {
                    const cat = visible[index]?.category;
                    const Icon = cat === 'Academic'
                      ? BookOpen
                      : cat === 'Facilities'
                        ? Settings
                        : cat === 'Assessment'
                          ? Award
                          : cat === 'Events'
                            ? Calendar
                            : cat === 'Health & Safety'
                              ? CheckCircle
                              : Megaphone;
                    return <Icon className="w-6 h-6" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{visible[index]?.title}</h3>
                  <p className="mt-2 text-sm/6 opacity-95">{visible[index]?.content}</p>
                  <div className="mt-3 text-xs opacity-80">{new Date(visible[index]?.createdAt).toLocaleDateString()} • Priority: {visible[index]?.priority || 'Normal'}</div>
                </div>
              </div>
              <div />
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-y-0 left-0 pl-3" />
        <div className="absolute inset-y-0 right-0 pr-3" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {visible.map((a, i) => (
            <button
              key={a._id}
              onClick={() => setIndex(i)}
              className={`p-2 md:p-2.5 rounded-full transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/60`}
              aria-label={`Go to announcement ${i + 1}`}
            >
              <span
                className={`block w-2.5 h-2.5 rounded-full ${i === index ? (darkMode ? 'bg-white' : 'bg-white') : (darkMode ? 'bg-white/40 hover:bg-white/70' : 'bg-white/50 hover:bg-white/80')}`}
              />
            </button>
          ))}
        </div>
      </div>
      <div className={`rounded-2xl border shadow-sm p-3 flex items-center justify-between ${darkMode ? 'bg-[#1e293b] border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-800'}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Announcements</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>{visible.length}</span>
        </div>
        <button
          onClick={() => setShowAll(s => !s)}
          className={`text-sm font-semibold px-4 py-2 rounded-xl transition ${darkMode ? 'text-purple-300 hover:text-white hover:bg-purple-900/30' : 'text-purple-700 hover:text-purple-800 hover:bg-purple-50'}`}
        >
          {showAll ? 'Hide Announcements' : 'View All Announcements'}
        </button>
      </div>
      <AnimatePresence>
        {showAll && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.4 }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {visible.map(ann => (
              <div
                key={ann._id}
                className={`p-5 rounded-2xl border transition-all ${darkMode ? 'bg-[#0b1220] border-gray-700 hover:bg-[#0f172a]' : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {(() => {
                      const cat = ann?.category;
                      const Icon = cat === 'Academic'
                        ? BookOpen
                        : cat === 'Facilities'
                          ? Settings
                          : cat === 'Assessment'
                            ? Award
                            : cat === 'Events'
                              ? Calendar
                              : cat === 'Health & Safety'
                                ? CheckCircle
                                : Megaphone;
                      return (
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                      );
                    })()}
                    <div>
                    <div className="text-xs font-bold mb-1">{ann.priority || 'Normal'}</div>
                    <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{ann.title}</h4>
                    <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{ann.content}</p>
                    <div className={`mt-3 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{new Date(ann.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => dismiss(ann._id)}
                    className={`p-2 rounded-lg transition ${darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'}`}
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StudentApp() {
  const [user, setUser] = useState(null);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [announcements, setAnnouncements] = useState([]); // Announcements state
  const [darkMode, setDarkMode] = useState(false);
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
  const [hiddenApplications, setHiddenApplications] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const authedFetch = async (input, init = {}) => {
    const token = localStorage.getItem('studentToken');
    const headers = {
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    const res = await window.fetch(input, { ...init, headers });
    if (res.status === 401) {
      try { await res.clone().text(); } catch {}
      window.alert('Your session has expired. Please log in again.');
      try { localStorage.removeItem('studentToken'); } catch {}
      try { localStorage.removeItem('studentInfo'); } catch {}
      window.location.href = '/student/login';
      throw new Error('SESSION_EXPIRED');
    }
    return res;
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

     const storedApps = localStorage.getItem('hiddenApplications');
     if (storedApps) {
       setHiddenApplications(JSON.parse(storedApps));
     }
  }, []);

  // eslint-disable-next-line no-unused-vars
  const hideSchedule = (scheduleId) => {
     const updated = [...hiddenSchedules, scheduleId];
     setHiddenSchedules(updated);
     localStorage.setItem('hiddenSchedules', JSON.stringify(updated));
  };

  const hideApplication = (appId) => {
     const updated = [...hiddenApplications, appId];
     setHiddenApplications(updated);
     localStorage.setItem('hiddenApplications', JSON.stringify(updated));
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
  // QR-based payment removed for assessments; using manual GCash upload only

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
    ojtAddress: '',
    paymentMethod: '', 
    senderGcash: '', 
    referenceNumber: '', 
    proofOfPayment: ''
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
        fetch('/api/system-settings/payment_config'),
        fetch('/api/announcements?active=true')
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
      
      // Announcements
      if (results[3] && results[3].ok) {
        setAnnouncements(await results[3].json());
      }
      
      let myRegs = [];
      let myApps = [];

      // Handle student-specific data
      if (studentId) {
         if (results[4] && results[4].ok) myRegs = await results[4].json();
         
         if (results[5] && results[5].ok) {
            myApps = await results[5].json();
         }
         
         if (results[6] && results[6].ok) {
            setNotifications(await results[6].json());
         }

         if (results[7] && results[7].ok) {
            const countData = await results[7].json();
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
        status: s.status || 'Active',
        price: typeof s.price === 'number' ? s.price : 0
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
      className="w-full max-w-none md:max-w-4xl mx-auto px-3 sm:px-4 space-y-6 md:space-y-8"
    >
      {/* Profile Header Card */}
      <div className={`rounded-3xl shadow-xl shadow-blue-900/5 overflow-hidden relative border ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
        {/* Cover Photo */}
        <div className="h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start -mt-16 relative z-10">
             {/* Profile Picture */}
             <div className="relative group">
               <div className={`w-32 h-32 rounded-full border-4 shadow-2xl overflow-hidden flex items-center justify-center relative ${darkMode ? 'border-gray-800 bg-gray-800' : 'border-white bg-white'}`}>
                 {profileForm.profilePicture ? (
                   <img src={profileForm.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                   <div className={`w-full h-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                     <User className={`w-12 h-12 ${darkMode ? 'text-gray-500' : 'text-gray-300'}`} />
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
                <label className={`absolute bottom-1 right-1 bg-blue-600 text-white p-2.5 rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition-transform hover:scale-105 border-2 ${darkMode ? 'border-gray-900' : 'border-white'}`}>
                   <Camera className="w-4 h-4" />
                   <input type="file" accept="image/*" className="hidden" onChange={handleProfilePicUpload} />
                 </label>
               )}
             </div>

             {/* Name and Basic Info */}
             <div className="flex-1 pt-16 md:pt-20">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div>
                   <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user?.firstName} {user?.lastName}</h2>
                   <p className={`font-medium flex items-center gap-2 mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                     <Mail className="w-4 h-4" /> {user?.email}
                   </p>
                 </div>
                 
                 <button 
                   onClick={() => setIsEditingProfile(!isEditingProfile)}
                   className={`px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm ${
                     isEditingProfile 
                       ? (darkMode ? 'bg-red-900/20 text-red-300 hover:bg-red-900/30 border border-red-800/40' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200')
                       : (darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200')
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
          <div className={`h-px my-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}></div>

          {/* Form Section */}
          <form onSubmit={handleProfileUpdate}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               {/* Left Column: Navigation/Summary (Optional, keeping simple for now) */}
               <div className="lg:col-span-1 space-y-6">
                  <div>
                    <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Personal Details</h3>
                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Manage your personal information and contact details. This information is used for your course registrations and certificates.
                    </p>
                  </div>
                  
                  <div className={`rounded-xl p-5 border ${darkMode ? 'bg-blue-900/20 border-blue-800/40' : 'bg-blue-50 border-blue-100'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>Account Status</p>
                        <p className={`text-xs mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Active Student</p>
                      </div>
                    </div>
                  </div>
               </div>

               {/* Right Column: Inputs */}
               <div className="lg:col-span-2 space-y-8">
                  {/* Name Section */}
                  <div className="space-y-4">
                    <h4 className={`text-sm font-semibold uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <User className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} /> Identity
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>First Name</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            disabled={!isEditingProfile}
                            className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
                              isEditingProfile 
                                ? (darkMode ? 'border-gray-600 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-[#0f172a] text-white placeholder-gray-400' : 'border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white') 
                                : (darkMode ? 'border-transparent bg-gray-800/50 text-gray-400' : 'border-transparent bg-gray-50 text-gray-600')
                            }`}
                            value={profileForm.firstName}
                            onChange={e => setProfileForm({...profileForm, firstName: e.target.value})}
                          />
                          <User className={`w-5 h-5 absolute left-3 top-3.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Last Name</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            disabled={!isEditingProfile}
                            className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
                              isEditingProfile 
                                ? (darkMode ? 'border-gray-600 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-[#0f172a] text-white placeholder-gray-400' : 'border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white') 
                                : (darkMode ? 'border-transparent bg-gray-800/50 text-gray-400' : 'border-transparent bg-gray-50 text-gray-600')
                            }`}
                            value={profileForm.lastName}
                            onChange={e => setProfileForm({...profileForm, lastName: e.target.value})}
                          />
                          <User className={`w-5 h-5 absolute left-3 top-3.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Section */}
                  <div className="space-y-4">
                    <h4 className={`text-sm font-semibold uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Phone className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-500'}`} /> Contact Info
                    </h4>
                    <div className="grid grid-cols-1 gap-5">
                      <div className="space-y-1.5">
                        <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email Address</label>
                        <div className="relative">
                          <input 
                            type="email" 
                            disabled={true} 
                            className={`w-full pl-10 pr-4 py-3 rounded-xl border cursor-not-allowed ${darkMode ? 'border-transparent bg-gray-800/50 text-gray-400' : 'border-transparent bg-gray-50 text-gray-500'}`}
                            value={profileForm.email}
                          />
                          <Mail className={`w-5 h-5 absolute left-3 top-3.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          <span className={`absolute right-4 top-3.5 text-xs font-medium px-2 py-0.5 rounded ${darkMode ? 'text-gray-400 bg-gray-800 border border-gray-700' : 'text-gray-400 bg-gray-100'}`}>Verified</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Mobile Number</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            disabled={!isEditingProfile}
                            placeholder="+63"
                            className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
                              isEditingProfile 
                                ? (darkMode ? 'border-gray-600 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-[#0f172a] text-white placeholder-gray-400' : 'border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white') 
                                : (darkMode ? 'border-transparent bg-gray-800/50 text-gray-400' : 'border-transparent bg-gray-50 text-gray-600')
                            }`}
                            value={profileForm.mobileNo}
                            onChange={e => setProfileForm({...profileForm, mobileNo: e.target.value})}
                          />
                          <Phone className={`w-5 h-5 absolute left-3 top-3.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
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
                        className={`px-8 py-3 rounded-xl font-bold hover:-translate-y-0.5 transition-all disabled:opacity-70 flex items-center gap-2 ${darkMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500' : 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700'}`}
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
            <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>My Activity</h2>
            <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage your training schedules and assessment applications</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Schedules */}
        <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className={`px-6 py-4 border-b flex items-center gap-3 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
             <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                <BookOpen className="w-5 h-5" />
             </div>
             <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Training Schedules</h3>
          </div>
          <div className="p-6">
            {myRegistrations.filter(reg => !hiddenSchedules.includes(reg._id)).length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <p>No training courses registered yet.</p>
                <button 
                  onClick={() => setActiveSection('registrations')}
                  className={`mt-4 font-medium hover:underline ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
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
                  const regStatus = String(reg.status || '').toLowerCase();
                  return (
                    <div key={reg._id} className={`border rounded-xl p-4 transition-colors relative group ${darkMode ? 'border-gray-700 hover:border-blue-500/50 bg-gray-800/30' : 'border-gray-200 hover:border-blue-300'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{sched.courseTitle || sched.title || 'Unknown Course'}</h4>
                          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{sched.courseId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                             regStatus === 'active' ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700') : 
                             ['cancelled', 'dropped', 'rejected'].includes(regStatus) ? (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700') : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600')
                           }`}>
                             {reg.status}
                           </span>
                           {['completed', 'dropped', 'cancelled', 'rejected'].includes(regStatus) && (
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 if(window.confirm('Remove this schedule from view? This will not delete the record from the database.')) {
                                    hideSchedule(reg._id);
                                 }
                               }}
                               className={`p-1 rounded transition-colors ${darkMode ? 'text-gray-400 hover:bg-red-900/20 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-500'}`}
                               title="Remove from view"
                             >
                               <X className="w-4 h-4" />
                             </button>
                           )}
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className={`flex items-center gap-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {sched.trainingDate ? new Date(sched.trainingDate).toLocaleDateString() : 'TBA'}
                          </span>
                        </div>
                        {reg.remarks && (
                          <div className={`text-sm p-2 rounded border ${darkMode ? 'bg-gray-800/50 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                            <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Note:</span> {reg.remarks}
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
        <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className={`px-6 py-4 border-b flex items-center gap-3 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
             <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                <FileCheck className="w-5 h-5" />
             </div>
             <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Assessment Applications</h3>
          </div>
          <div className="p-6">
            {myApplications.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <p>No assessment applications submitted yet.</p>
                <button 
                  onClick={() => setActiveSection('assessment')}
                  className={`mt-4 font-medium hover:underline ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                >
                  View Assessments
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myApplications
                  .filter(app => !hiddenApplications.includes(app._id))
                  .map(app => (
                  <div key={app._id} className={`border rounded-xl p-4 transition-colors ${darkMode ? 'border-gray-700 hover:border-purple-500/50 bg-gray-800/30' : 'border-gray-200 hover:border-purple-300'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{app.assessmentTitle || 'Unknown Assessment'}</h4>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>ID: {app._id.slice(-6).toUpperCase()}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                          app.status === 'Approved' ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700') : 
                          app.status === 'Rejected' ? (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700') : 
                          app.status === 'Pending' ? (darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700') : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600')
                        }`}>
                          {app.status}
                        </span>
                        {['Rejected', 'Drop', 'Cancelled'].includes(app.status) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              hideApplication(app._id);
                            }}
                            className={`p-1.5 rounded-full transition-colors ${darkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
                            title="Hide from list"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Applied: {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                          {app.payment?.isOnline && (
                             <span className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} font-medium`}>Online Payment</span>
                          )}
                        </div>
                      </div>
                      {app.remarks && (
                        <div className={`text-sm p-2 rounded border ${darkMode ? 'bg-gray-800/50 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                          <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Note:</span> {app.remarks}
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
                            className={`text-sm font-medium flex items-center gap-1 ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}
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
    
    // Payment Validation
    if (!registrationForm.paymentMethod) errors.paymentMethod = 'Please select a payment method.';
    if (registrationForm.paymentMethod === 'Online') {
      if (!registrationForm.senderGcash || registrationForm.senderGcash.replace(/\D/g, '').length !== 11) {
        errors.senderGcash = 'Please enter a valid 11-digit GCash number.';
      }
      if (!registrationForm.referenceNumber) errors.referenceNumber = 'Please enter the Reference Number.';
      if (!registrationForm.proofOfPayment) errors.proofOfPayment = 'Please upload Proof of Payment.';
    }

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
          termsAccepted: true,
          payment: {
            isOnline: registrationForm.paymentMethod === 'Online',
            senderGcashNumber: registrationForm.senderGcash,
            referenceNumber: registrationForm.referenceNumber,
            proofOfPayment: registrationForm.proofOfPayment
          }
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
  
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/announcements?active=true');
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data);
        }
      } catch (e) {
        // noop
      }
    }, 60000);
    return () => clearInterval(id);
  }, [fetch]);

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
            <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h2>
            <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage your alerts and messages</p>
         </div>
         {notifications.length > 0 && (
           <div className="flex gap-3">
             {unreadCount > 0 && (
               <button 
                 onClick={handleMarkAllRead}
                 className={`font-medium flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${darkMode ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/20' : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'}`}
               >
                 <CheckCircle className="w-4 h-4" />
                 Mark All as Read
               </button>
             )}
             <button 
               onClick={handleDeleteAllNotifications}
               className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium text-sm transition-all focus:outline-none
                 ${darkMode 
                   ? 'text-red-300 border border-red-400/40 ring-1 ring-red-800/30 bg-transparent hover:bg-red-900/20' 
                   : 'text-red-600 border border-red-300 ring-1 ring-red-200/50 bg-white hover:bg-red-50 shadow-sm'}`
               }
             >
                <Trash2 className="w-3.5 h-3.5" />
               Delete All
             </button>
           </div>
         )}
      </div>

      <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
        {notifications.length === 0 ? (
          <div className={`p-12 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
             <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <Bell className={`w-8 h-8 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
             </div>
             <h3 className={`text-lg font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>No notifications</h3>
             <p>You're all caught up!</p>
          </div>
        ) : (
          <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
            {notifications.map(notification => (
              <div 
                key={notification._id} 
                className={`p-6 transition-colors flex gap-4 ${
                  !notification.isRead 
                    ? (darkMode ? 'bg-blue-900/10' : 'bg-blue-50/30') 
                    : (darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50')
                }`}
              >
                 <div className={`mt-1 p-2 rounded-full shrink-0 h-fit ${
                    notification.type === 'success' ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600') :
                    notification.type === 'error' ? (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600') :
                    notification.type === 'warning' ? (darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-600') :
                    (darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600')
                  }`}>
                    {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
                     notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
                     notification.type === 'warning' ? <AlertCircle className="w-5 h-5" /> :
                     <Bell className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                       <div>
                          <p className={`text-base ${!notification.isRead ? (darkMode ? 'font-semibold text-white' : 'font-semibold text-gray-900') : (darkMode ? 'text-gray-300' : 'text-gray-800')}`}>
                            {notification.message}
                          </p>
                          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
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

    // Compute 30-day growth for registrations
    const registrationGrowth = (() => {
      try {
        const now = new Date();
        const start = new Date();
        start.setDate(now.getDate() - 30);
        const prevStart = new Date();
        prevStart.setDate(now.getDate() - 60);
        const getDate = (r) => new Date(r.createdAt || r.created_at || r.date || Date.now());
        const recent = myRegistrations.filter((r) => getDate(r) >= start);
        const prev = myRegistrations.filter((r) => {
          const d = getDate(r);
          return d >= prevStart && d < start;
        });
        const prevCount = prev.length;
        const diff = recent.length - prevCount;
        if (prevCount === 0) return recent.length > 0 ? 100 : 0;
        return Math.round((diff / prevCount) * 100);
      } catch {
        return 0;
      }
    })();

    return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {announcements.length > 0 && <AnnouncementCarousel announcements={announcements} darkMode={darkMode} />}

      <div>
        <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Dashboard Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`rounded-2xl p-4 md:p-6 shadow-lg cursor-pointer transition-all border ${
              darkMode 
                ? 'bg-[#1e293b] border-gray-700/50 hover:border-blue-500/50' 
                : 'bg-white border-gray-100 hover:border-blue-200'
            }`}
            onClick={() => setActiveSection('registrations')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <BookOpen className="w-6 h-6" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                registrationGrowth > 0 
                  ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
                  : registrationGrowth < 0
                  ? (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')
                  : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')
              }`}>
                 {registrationGrowth > 0 ? `+${registrationGrowth}%` : `${registrationGrowth}%`}
              </span>
            </div>
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>My Registrations</p>
            <p className={`text-3xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{myRegistrations.length}</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`rounded-2xl p-6 shadow-lg cursor-pointer transition-all border ${
              darkMode 
                ? 'bg-[#1e293b] border-gray-700/50 hover:border-purple-500/50' 
                : 'bg-white border-gray-100 hover:border-purple-200'
            }`}
            onClick={() => setActiveSection('assessment')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                <FileCheck className="w-6 h-6" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                 Active
              </span>
            </div>
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>My Assessments</p>
            <p className={`text-3xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{myApplications.length}</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`rounded-2xl p-6 shadow-lg cursor-pointer transition-all border ${
              darkMode 
                ? 'bg-[#1e293b] border-gray-700/50 hover:border-green-500/50' 
                : 'bg-white border-gray-100 hover:border-green-200'
            }`}
            onClick={() => setActiveSection('schedules')}
          >
            <div className="flex items-center justify-between mb-4">
               <div className={`p-3 rounded-xl ${darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-50 text-green-600'}`}>
                <Clock className="w-6 h-6" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                 Soon
              </span>
            </div>
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Upcoming Schedules</p>
            <p className={`text-3xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{upcomingSchedules}</p>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Schedules List */}
        <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className={`px-4 md:px-6 py-4 md:py-5 border-b flex items-center justify-between ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
             <h3 className={`font-bold text-base sm:text-lg flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Calendar className="w-5 h-5 text-blue-500" />
                Recent Schedules
             </h3>
             <button onClick={() => setActiveSection('schedules')} className={`text-sm font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                View All
             </button>
          </div>
              <div className="p-4 space-y-3">
             {displayedSchedules.length > 0 ? displayedSchedules.map(schedule => (
                <div key={schedule.id} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${darkMode ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' : 'bg-gray-50 border-gray-100 hover:bg-white hover:shadow-sm'}`}>
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                         {schedule.title.charAt(0)}
                      </div>
                      <div>
                         <h4 className={`font-bold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{schedule.title}</h4>
                         <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{schedule.courseId}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{schedule.date}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${schedule.registered >= schedule.capacity ? (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600') : (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600')}`}>
                         {schedule.registered}/{schedule.capacity}
                      </span>
                   </div>
                </div>
             )) : (
                <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No schedules available</div>
             )}
          </div>
        </div>

        {/* Available Assessments List */}
        <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className={`px-6 py-5 border-b flex items-center justify-between ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
             <h3 className={`font-bold text-lg flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <FileCheck className="w-5 h-5 text-purple-500" />
                Available Assessments
             </h3>
             <button onClick={() => setActiveSection('assessment')} className={`text-sm font-medium ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}`}>
                View All
             </button>
          </div>
          <div className="p-4 space-y-3">
             {displayedAssessments.length > 0 ? displayedAssessments.map(assessment => {
                const hasApplied = myApplications.some(app => {
                  const appAssessmentId = app.assessmentId?._id || app.assessmentId;
                  return String(appAssessmentId) === String(assessment.id) && ['Pending', 'Approved'].includes(app.status);
                });

                const isOpen = assessment.status === 'Open' || assessment.status === 'Active';

                return (
                  <div key={assessment.id} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${darkMode ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' : 'bg-gray-50 border-gray-100 hover:bg-white hover:shadow-sm'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                        {assessment.title.charAt(0)}
                      </div>
                      <div>
                        <h4 className={`font-bold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{assessment.title}</h4>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Fee: ₱{assessment.fee}</p>
                      </div>
                    </div>
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
                          fee: assessment.fee || 0
                        });
                        setIsAssessmentFixed(true);
                        setAssessmentStep(1); 
                      }}
                      disabled={!user || !isOpen || hasApplied}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                        user && isOpen && !hasApplied
                          ? (darkMode ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-purple-600 text-white hover:bg-purple-700')
                          : (darkMode ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                      }`}
                    >
                      {!user ? 'Login to Apply' : hasApplied ? 'Already Applied' : isOpen ? 'Apply' : 'Unavailable'}
                    </button>
                  </div>
                );
             }) : (
                <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No assessments available</div>
             )}
          </div>
        </div>
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
      className="space-y-6 md:space-y-8 w-full max-w-none md:max-w-5xl mx-auto px-3 sm:px-4"
    >
      <div className="flex items-center justify-between">
         <div>
            <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Student Registration</h2>
            <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Register for training courses and manage your profile</p>
         </div>
      </div>
      
      {!activeSubSection && (
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`rounded-2xl shadow-sm border p-6 md:p-8 text-center hover:shadow-md transition-shadow ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}
          >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                 <UserPlus className="w-8 h-8" />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>New Student Registration</h3>
              <p className={`mb-6 max-w-md mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                 Start a new registration for a training course. You'll need to provide your personal details and educational background.
              </p>
              <button 
                onClick={() => {
                  setIsScheduleFixed(false);
                  // Don't reset everything, keep pre-filled data if exists
                  setRegistrationForm(prev => ({ ...prev, scheduleId: '' }));
                  setActiveSubSection('student-registration');
                }}
                className={`px-8 py-3 rounded-xl font-medium inline-flex items-center gap-2 transition shadow-lg ${!user ? 'opacity-50 cursor-not-allowed' : ''} ${darkMode ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/20' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'}`}
                disabled={!user}
              >
                <UserPlus className="w-5 h-5" />
                Start Registration
              </button>
          </motion.div>

          {/* My Registrations List (moved from My Activity) */}
          {myRegistrations.length > 0 && (
            <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className={`px-6 py-4 border-b flex items-center gap-3 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                 <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                    <BookOpen className="w-5 h-5" />
                 </div>
                 <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>My Training Schedules</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {myRegistrations.map(reg => {
                    const sched = reg.scheduleId || {};
                    return (
                      <div key={reg._id} className={`border rounded-xl p-4 transition-colors ${darkMode ? 'border-gray-700 hover:border-blue-500/50 bg-gray-800/30' : 'border-gray-200 hover:border-blue-300'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{sched.courseTitle || sched.title || 'Unknown Course'}</h4>
                            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{sched.courseId}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                            reg.status === 'active' ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700') : 
                            reg.status === 'cancelled' ? (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700') : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100')
                          }`}>
                            {reg.status}
                          </span>
                        </div>
                        <div className={`mt-3 flex items-center gap-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
           <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className={`px-6 py-4 border-b flex items-center gap-3 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                 <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                    <BookOpen className="w-5 h-5" />
                 </div>
                 <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Course Selection</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Registration Date</label>
                  <input 
                     type="date" 
                     className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} 
                     min={new Date().toISOString().split('T')[0]}
                     disabled={!user}
                  />
               </div>
               <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Select Training Course</label>
                  {isScheduleFixed ? (
                     <input 
                        type="text" 
                        className={`w-full border rounded-xl px-4 py-2.5 focus:outline-none cursor-not-allowed ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-400 text-gray-700'}`}
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
                        darkMode={darkMode}
                        disabled={!user}
                        buttonClassName={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-400 text-gray-900'} ${formErrors.scheduleId ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                     />
                  )}
                  {formErrors.scheduleId && !isScheduleFixed && <p className="text-sm text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {formErrors.scheduleId}</p>}
               </div>
              </div>
           </div>

           {/* Section 2: Personal Information */}
           <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className={`px-6 py-4 border-b flex items-center gap-3 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                 <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                    <User className="w-5 h-5" />
                 </div>
                 <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Personal Information</h3>
              </div>
              <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div>
                       <input type="text" placeholder="Last Name" disabled={!user} className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${formErrors.lastName ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.lastName} onChange={(e) => {
                          setRegistrationForm(f => ({ ...f, lastName: e.target.value }));
                          if (formErrors.lastName) setFormErrors(prev => { const c = { ...prev }; delete c.lastName; return c; });
                       }} />
                       {formErrors.lastName && <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>}
                     </div>
                     <div>
                       <input type="text" placeholder="First Name" disabled={!user} className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${formErrors.firstName ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.firstName} onChange={(e) => {
                          setRegistrationForm(f => ({ ...f, firstName: e.target.value }));
                          if (formErrors.firstName) setFormErrors(prev => { const c = { ...prev }; delete c.firstName; return c; });
                       }} />
                       {formErrors.firstName && <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>}
                     </div>
                     <input type="text" placeholder="Middle Name" disabled={!user} className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.middleName} onChange={(e) => setRegistrationForm(f => ({ ...f, middleName: e.target.value }))} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date of Birth</label>
                        <input type="date" disabled={!user} className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${formErrors.dateOfBirth ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} max={new Date().toISOString().slice(0, 10)} value={registrationForm.dateOfBirth || ""} onChange={(e) => {
                           setRegistrationForm(f => ({ ...f, dateOfBirth: e.target.value }));
                           if (formErrors.dateOfBirth) setFormErrors(prev => { const c = { ...prev }; delete c.dateOfBirth; return c; });
                        }} />
                        {formErrors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{formErrors.dateOfBirth}</p>}
                     </div>
                     <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Complete Address</label>
                        <input type="text" placeholder="House No., Street, Barangay, City, Province" disabled={!user} className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${formErrors.completeAddress ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.completeAddress} onChange={(e) => {
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
                        darkMode={darkMode}
                         disabled={!user}
                         buttonClassName={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-400 text-gray-900'} ${formErrors.sex ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                      />
                      {formErrors.sex && <p className="text-xs text-red-500 mt-1">{formErrors.sex}</p>}
                    </div>
                    <div>
                       <input type="number" placeholder="Age" disabled={!user} className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${formErrors.age ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} min="1" step="1" value={registrationForm.age} onChange={(e) => {
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
                        darkMode={darkMode}
                        disabled={!user}
                        buttonClassName={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-400 text-gray-900'} ${formErrors.civilStatus ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                     />
                      {formErrors.civilStatus && <p className="text-xs text-red-500 mt-1">{formErrors.civilStatus}</p>}
                    </div>
                    <input type="text" placeholder="Nationality" disabled={!user} className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.nationality} onChange={(e) => setRegistrationForm(f => ({ ...f, nationality: e.target.value }))} />
                 </div>
                 <input type="text" placeholder="Religion" disabled={!user} className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.religion} onChange={(e) => setRegistrationForm(f => ({ ...f, religion: e.target.value }))} />
              </div>
           </div>

           {/* Section 3: Contact Details */}
           <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className={`px-6 py-4 border-b flex items-center gap-3 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                 <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                    <Phone className="w-5 h-5" />
                 </div>
                 <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Contact Details</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div>
                    <input type="tel" placeholder="Telephone No." disabled={!user} className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${formErrors.telephoneNo ? 'border-red-300' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.telephoneNo} onChange={(e) => {
                       const v = e.target.value.replace(/[^0-9-+() ]/g, '').slice(0, 20);
                       setRegistrationForm(f => ({ ...f, telephoneNo: v }));
                       setFormErrors(prev => { const c = { ...prev }; delete c.telephoneNo; return c; });
                    }} />
                 </div>
                 <div>
                    <input type="tel" placeholder="Mobile No. (11 digits)" disabled={!user} className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${formErrors.mobileNo ? 'border-red-300' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.mobileNo} onChange={(e) => {
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
                    <input type="email" placeholder="Email Address" disabled={!user} className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${formErrors.email ? 'border-red-300' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.email} onChange={(e) => {
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
           <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className={`px-6 py-4 border-b flex items-center gap-3 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                 <div className={`p-2 rounded-lg ${darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                    <Briefcase className="w-5 h-5" />
                 </div>
                 <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Education & Work</h3>
              </div>
              <div className="p-6 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" placeholder="College/School" disabled={!user} className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.educationCollege} onChange={(e) => setRegistrationForm(f => ({ ...f, educationCollege: e.target.value }))} />
                    <input type="text" placeholder="Course (BS/TechVoc)" disabled={!user} className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.educationCourse} onChange={(e) => setRegistrationForm(f => ({ ...f, educationCourse: e.target.value }))} />
                 </div>
                 <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}></div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" placeholder="Company Employed" disabled={!user} className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.employmentCompany} onChange={(e) => setRegistrationForm(f => ({ ...f, employmentCompany: e.target.value }))} />
                    <input type="text" placeholder="Position" disabled={!user} className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.employmentPosition} onChange={(e) => setRegistrationForm(f => ({ ...f, employmentPosition: e.target.value }))} />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" placeholder="Department" disabled={!user} className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.employmentDepartment} onChange={(e) => setRegistrationForm(f => ({ ...f, employmentDepartment: e.target.value }))} />
                    <div>
                        <input type="number" placeholder="Years of Experience" disabled={!user} className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${formErrors.yearsExp ? 'border-red-300' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} min={0} value={registrationForm.yearsExp} onChange={(e) => {
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
                     darkMode={darkMode}
                       disabled={!user}
                       buttonClassName={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <input type="date" placeholder="Date Employed" disabled={!user} className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.employmentDate} onChange={(e) => setRegistrationForm(f => ({ ...f, employmentDate: e.target.value }))} />
                 </div>
                 <input type="text" placeholder="References" disabled={!user} className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.employmentReferences} onChange={(e) => setRegistrationForm(f => ({ ...f, employmentReferences: e.target.value }))} />
              </div>
           </div>

           {/* Section 5: Additional Info */}
           <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className={`px-6 py-4 border-b flex items-center gap-3 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                 <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                    <FileCheck className="w-5 h-5" />
                 </div>
                 <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Additional Information (OJT / Others)</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input type="text" placeholder="OJT Industry" disabled={!user} className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.ojtIndustry} onChange={(e) => setRegistrationForm(f => ({ ...f, ojtIndustry: e.target.value }))} />
                  <input type="text" placeholder="OJT Company" disabled={!user} className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.ojtCompany} onChange={(e) => setRegistrationForm(f => ({ ...f, ojtCompany: e.target.value }))} />
                </div>
                <input type="text" placeholder="OJT Address" disabled={!user} className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={registrationForm.ojtAddress} onChange={(e) => setRegistrationForm(f => ({ ...f, ojtAddress: e.target.value }))} />
                
                <div className={`border-t pt-4 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                   <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Other Specifications</p>
                   <div className="space-y-4">
                      <input type="text" placeholder="Area of Specialization" disabled={!user} className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} />
                      <textarea placeholder="Other Specification" rows="3" disabled={!user} className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}></textarea>
                   </div>
                </div>
              </div>
           </div>

          {/* Section 6: Payment Details */}
          <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
             <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                      <span className="font-bold text-lg">₱</span>
                   </div>
                   <div>
                      <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Payment Details</h3>
                      <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Paid Training Registration</p>
                   </div>
                </div>
             </div>
             
             <div className="p-6 md:p-8 space-y-6 md:space-y-8">
                {/* Payment Method Selection */}
                <div>
                   <label className={`block text-sm font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Select Payment Method</label>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 group ${registrationForm.paymentMethod === 'Online' ? 'border-blue-500 bg-blue-500/10' : (darkMode ? 'border-gray-700 hover:border-blue-500/50 hover:bg-gray-800' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50')}`}>
                         <input 
                           type="radio" 
                           name="paymentMethod" 
                           value="Online" 
                           className="absolute opacity-0 w-full h-full cursor-pointer"
                           checked={registrationForm.paymentMethod === 'Online'}
                           onChange={(e) => {
                              setRegistrationForm(f => ({ ...f, paymentMethod: e.target.value }));
                              setFormErrors(prev => { const c = { ...prev }; delete c.paymentMethod; return c; });
                           }}
                         />
                         <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${registrationForm.paymentMethod === 'Online' ? 'bg-blue-100 text-blue-600' : (darkMode ? 'bg-gray-800 text-gray-500 group-hover:bg-blue-900/30 group-hover:text-blue-400' : 'bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500')}`}>
                            <CreditCard className="w-7 h-7" />
                         </div>
                         <span className={`font-bold text-lg ${registrationForm.paymentMethod === 'Online' ? 'text-blue-600' : (darkMode ? 'text-gray-400 group-hover:text-gray-200' : 'text-gray-600')}`}>Online Payment (GCash)</span>
                         <span className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Fast & Secure</span>
                         
                         {registrationForm.paymentMethod === 'Online' && (
                            <div className="absolute top-4 right-4 text-blue-500">
                               <CheckCircle className="w-6 h-6 fill-current" />
                            </div>
                         )}
                      </label>

                      <label className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 group ${registrationForm.paymentMethod === 'No' ? (darkMode ? 'border-gray-500 bg-gray-800' : 'border-gray-500 bg-gray-50') : (darkMode ? 'border-gray-700 hover:border-gray-500 hover:bg-gray-800' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50')}`}>
                         <input 
                           type="radio" 
                           name="paymentMethod" 
                           value="No" 
                           className="absolute opacity-0 w-full h-full cursor-pointer"
                           checked={registrationForm.paymentMethod === 'No'}
                           onChange={(e) => {
                              setRegistrationForm(f => ({ ...f, paymentMethod: e.target.value }));
                              setFormErrors(prev => { const c = { ...prev }; delete c.paymentMethod; return c; });
                           }}
                         />
                         <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${registrationForm.paymentMethod === 'No' ? (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600') : (darkMode ? 'bg-gray-800 text-gray-500 group-hover:bg-gray-700 group-hover:text-gray-300' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-500')}`}>
                            <Wallet className="w-7 h-7" />
                         </div>
                         <span className={`font-bold text-lg ${registrationForm.paymentMethod === 'No' ? (darkMode ? 'text-gray-200' : 'text-gray-800') : (darkMode ? 'text-gray-400 group-hover:text-gray-200' : 'text-gray-600')}`}>No / On-site Payment</span>
                         <span className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Pay at the office</span>

                         {registrationForm.paymentMethod === 'No' && (
                            <div className="absolute top-4 right-4 text-gray-500">
                               <CheckCircle className="w-6 h-6 fill-current" />
                            </div>
                         )}
                      </label>
                   </div>
                   {formErrors.paymentMethod && <p className="text-sm text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {formErrors.paymentMethod}</p>}
                </div>

                {/* Online Payment Fields */}
                <AnimatePresence>
                   {registrationForm.paymentMethod === 'Online' && (
                      <motion.div
                         initial={{ opacity: 0, height: 0 }}
                         animate={{ opacity: 1, height: 'auto' }}
                         exit={{ opacity: 0, height: 0 }}
                         transition={{ duration: 0.3 }}
                         className="overflow-hidden"
                      >
                         <div className={`border rounded-2xl p-6 mb-6 flex flex-col md:flex-row gap-6 items-center md:items-start ${darkMode ? 'bg-blue-900/10 border-blue-900/30' : 'bg-blue-50/50 border-blue-100'}`}>
                            <div className="relative group cursor-zoom-in" onClick={() => paymentConfig?.qrCodeImage && setZoomedImage(paymentConfig.qrCodeImage)}>
                               <div className={`p-3 rounded-xl shadow-sm border shrink-0 ${darkMode ? 'bg-white border-blue-900' : 'bg-white border-blue-100'}`}>
                                  {/* QR Code Placeholder or Image */}
                                  {paymentConfig?.qrCodeImage ? (
                                     <img src={paymentConfig.qrCodeImage} alt="GCash QR" className="w-32 h-32 object-contain" />
                                  ) : (
                                     <div className="w-32 h-32 bg-gray-50 flex items-center justify-center text-xs text-center text-gray-400 rounded-lg border border-dashed border-gray-200">No QR Code</div>
                                  )}
                               </div>
                               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 rounded-xl">
                                  <div className="bg-white/90 p-2 rounded-full shadow-sm">
                                     <Eye className="w-4 h-4 text-blue-600" />
                                  </div>
                               </div>
                            </div>
                            
                            <div className="flex-1 text-center md:text-left">
                               <h4 className={`font-bold text-xl mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>Scan to Pay</h4>
                               <p className={`mb-4 leading-relaxed ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                  Please scan the QR code or send the exact amount to the GCash number below. 
                                  Take a screenshot of your payment receipt.
                               </p>
                               <div className={`inline-block border rounded-xl px-6 py-3 shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-blue-200'}`}>
                                  <div className="flex items-center gap-8">
                                     <div>
                                        <p className="text-xs text-blue-500 uppercase font-bold tracking-wider mb-1">GCash Number</p>
                                        <p className={`text-2xl font-mono font-bold tracking-tight ${darkMode ? 'text-white' : 'text-blue-800'}`}>{paymentConfig?.gcashNumber || '09XX-XXX-XXXX'}</p>
                                     </div>
                                     <div className="hidden md:block h-10 w-px bg-blue-200/50 dark:bg-gray-700" />
                                     <div>
                                        <p className="text-xs uppercase font-bold tracking-wider mb-1 text-green-600">Price</p>
                                        <p className={`text-2xl font-mono font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                           ₱{(schedules.find(s => s.id === registrationForm.scheduleId)?.price || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                               <label className="block text-sm font-semibold text-gray-700 mb-2">Sender GCash Number</label>
                               <div className="relative">
                                  <input 
                                     type="text" 
                                     maxLength="11"
                                     placeholder="09XXXXXXXXX" 
                                     className={`w-full border-2 rounded-xl px-4 py-3 font-mono text-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none ${formErrors.senderGcash ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}
                                     value={registrationForm.senderGcash} 
                                     onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                                        setRegistrationForm(f => ({ ...f, senderGcash: value }));
                                        if (formErrors.senderGcash) setFormErrors(prev => { const c = { ...prev }; delete c.senderGcash; return c; });
                                     }} 
                                  />
                                  <div className="absolute right-4 top-3.5 text-gray-400 pointer-events-none">
                                     <Phone className="w-5 h-5" />
                                  </div>
                               </div>
                               {formErrors.senderGcash && <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {formErrors.senderGcash}</p>}
                               <p className="text-xs text-gray-400 mt-2">Must be 11 digits (e.g., 09171234567)</p>
                            </div>
                            <div>
                               <label className="block text-sm font-semibold text-gray-700 mb-2">Reference Number</label>
                               <div className="relative">
                                  <input 
                                     type="text" 
                                     placeholder="Ref No. (e.g. 123456789)" 
                                     className={`w-full border-2 rounded-xl px-4 py-3 text-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none ${formErrors.referenceNumber ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}
                                     value={registrationForm.referenceNumber} 
                                     onChange={(e) => {
                                        setRegistrationForm(f => ({ ...f, referenceNumber: e.target.value }));
                                        if (formErrors.referenceNumber) setFormErrors(prev => { const c = { ...prev }; delete c.referenceNumber; return c; });
                                     }} 
                                  />
                               </div>
                               {formErrors.referenceNumber && <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {formErrors.referenceNumber}</p>}
                            </div>
                         </div>

                         <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Proof of Payment (Screenshot)</label>
                            <div className={`border-2 border-dashed rounded-2xl p-6 md:p-8 text-center transition-all duration-200 group ${formErrors.proofOfPayment ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'}`}>
                               <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  id="proof-upload-reg"
                                  onChange={(e) => {
                                     const file = e.target.files[0];
                                     if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                           setRegistrationForm(f => ({ ...f, proofOfPayment: reader.result }));
                                           setFormErrors(prev => { const c = { ...prev }; delete c.proofOfPayment; return c; });
                                        };
                                        reader.readAsDataURL(file);
                                     }
                                  }}
                               />
                               <label htmlFor="proof-upload-reg" className="cursor-pointer block w-full h-full">
                                  {registrationForm.proofOfPayment ? (
                                     <div className="relative inline-block group-hover:scale-[1.02] transition-transform duration-300">
                                        <img src={registrationForm.proofOfPayment} alt="Proof" className="h-48 rounded-xl object-contain mx-auto shadow-sm" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl text-white font-medium backdrop-blur-sm">
                                           <Camera className="w-6 h-6 mr-2" />
                                           Change Image
                                        </div>
                                     </div>
                                  ) : (
                                     <div className="py-4">
                                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500 group-hover:scale-110 transition-transform duration-300">
                                           <Camera className="w-8 h-8" />
                                        </div>
                                        <p className="text-base text-gray-900 font-medium">Click to upload screenshot</p>
                                        <p className="text-sm text-gray-400 mt-1">JPG, PNG supported</p>
                                     </div>
                                  )}
                               </label>
                            </div>
                            {formErrors.proofOfPayment && <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {formErrors.proofOfPayment}</p>}
                         </div>
                      </motion.div>
                   )}
                </AnimatePresence>
             </div>
          </div>

          <div className={`flex justify-end gap-4 pt-4 sticky bottom-0 backdrop-blur-sm p-4 z-10 rounded-xl border-t ${darkMode ? 'bg-gray-900/70 border-gray-700' : 'bg-white/80 border-gray-100'}`}>
              <button 
                type="button"
                onClick={() => setActiveSubSection('')}
              className={`px-6 py-2.5 rounded-xl border font-medium transition ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-400 text-gray-700 hover:bg-gray-50'}`}
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
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Paid Training</h2>
           <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Browse and register for upcoming training sessions</p>
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
            className={`bg-blue-600 text-white px-5 md:px-6 py-2.5 md:py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 font-medium whitespace-nowrap ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!user}
          >
            <UserPlus className="w-5 h-5" />
            Start Registration
          </button>

          {/* Modern Search Bar */}
          <div className="relative w-full md:w-72 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className={`h-5 w-5 transition-colors ${darkMode ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
            </div>
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={scheduleSearch}
              onChange={(e) => setScheduleSearch(e.target.value)}
              className={`block w-full pl-10 pr-3 py-2.5 rounded-xl leading-5 focus:outline-none transition-all shadow-sm hover:shadow-md border ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
              }`}
            />
          </div>
        </div>
      </div>

      <div className="relative md:min-h-[700px] lg:min-h-[800px] transition-all duration-500 ease-in-out">
          {/* Previous Button (Left) */}
          <motion.button 
             onClick={() => setSchedulePage(p => Math.max(1, p - 1))} 
             disabled={schedulePage === 1} 
             whileHover={{ x: -6, boxShadow: "0 0 20px rgba(59,130,246,0.6)" }} 
             whileTap={{ scale: 0.9 }} 
             transition={{ type: "spring", stiffness: 300, damping: 20 }} 
             style={{ y: "-50%" }}
             className={` 
               hidden md:flex fixed left-2 md:left-6 top-[65%] 
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
               hidden md:flex fixed right-2 md:right-6 top-[65%] 
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
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                       <Search className={`w-8 h-8 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                    </div>
                    <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>No schedules found</h3>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Try adjusting your search terms</p>
                 </div>
              ) : (
                currentSchedules.map((schedule) => {
                   const capacity = schedule.capacity || 0;
                   const registered = schedule.registered || 0;
                   const isFull = registered >= capacity;
                   const percentage = capacity > 0 ? Math.min((registered / capacity) * 100, 100) : (isFull ? 100 : 0);
                   
                   return (
                    <div key={schedule.id} className={`group rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
                      {/* Card Header with Pattern/Gradient */}
                      <div className="h-20 md:h-24 bg-gradient-to-br from-blue-600 to-indigo-700 relative p-4 md:p-6">
                         <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm shadow-sm ${
                            schedule.status === 'Active' || schedule.status === 'Ongoing' 
                              ? (darkMode ? 'bg-green-900/30 text-green-400 border-green-700' : 'bg-green-100 text-green-800 border-green-200') :
                            schedule.status === 'Pending' 
                              ? (darkMode ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700' : 'bg-yellow-100 text-yellow-800 border-yellow-200') :
                              (darkMode ? 'bg-red-900/30 text-red-400 border-red-700' : 'bg-red-100 text-red-800 border-red-200')
                         }`}>
                            {schedule.status}
                         </div>
                         <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white border border-white/10">
                            {schedule.courseId}
                         </div>
                         <div className={`absolute -bottom-6 left-6 w-12 h-12 rounded-xl shadow-lg flex items-center justify-center ${darkMode ? 'bg-gray-800 text-blue-400' : 'bg-white text-blue-600'}`}>
                            <BookOpen className="w-6 h-6" />
                         </div>
                      </div>

                      <div className="pt-8 p-6 flex-1 flex flex-col">
                        <h3 className={`text-base sm:text-lg font-bold mb-2 line-clamp-2 transition-colors ${darkMode ? 'text-white group-hover:text-blue-300' : 'text-gray-900 group-hover:text-blue-600'}`}>
                          {schedule.title}
                        </h3>
                        
                        <div className="space-y-3 mb-6 flex-1">
                          <div className={`flex items-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                            {schedule.date}
                          </div>
                          <div className={`flex items-center text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <span className="mr-2 font-semibold text-green-500">₱</span>
                            {Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(schedule.price).replace('PHP', '').trim()}
                          </div>
                          
                          {/* Capacity Indicator */}
                          <div className="space-y-1.5">
                             <div className="flex justify-between text-xs font-medium">
                                <span className={isFull ? (darkMode ? "text-red-400" : "text-red-500") : (darkMode ? "text-gray-400" : "text-gray-500")}>
                                  {isFull ? "Class Full" : "Slots Available"}
                                </span>
                                <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{registered} / {capacity}</span>
                             </div>
                             <div className={`w-full rounded-full h-2 overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
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
                          className={`w-full mt-auto py-2.5 md:py-3 px-4 md:px-5 font-medium rounded-lg transition-colors border flex items-center justify-center gap-2 ${
                            darkMode 
                              ? 'bg-gray-800/50 text-gray-300 hover:bg-blue-900/20 hover:text-blue-300 border-gray-700 hover:border-blue-700' 
                              : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-gray-100 hover:border-blue-200'
                          }`}
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
          <div className="mt-4 md:hidden flex items-center justify-between">
            <button
              onClick={() => setSchedulePage(p => Math.max(1, p - 1))}
              disabled={schedulePage === 1}
              className={`px-4 py-2 rounded-lg font-medium border ${
                schedulePage === 1
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              } ${darkMode ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-200'}`}
            >
              Previous
            </button>
            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{schedulePage} / {totalPages || 1}</span>
            <button
              onClick={() => setSchedulePage(p => Math.min(totalPages || 1, p + 1))}
              disabled={schedulePage === (totalPages || 1)}
              className={`px-4 py-2 rounded-lg font-medium border ${
                schedulePage === (totalPages || 1)
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              } ${darkMode ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-200'}`}
            >
              Next
            </button>
          </div>
      </div>

      {/* Schedule Details Section - Modernized */}
      {activeSubSection === 'schedule-details' && selectedSchedule && (
        <div id="schedule-details-view" className={`mt-8 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 border ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
           <div className="p-4 md:p-8 grid md:grid-cols-3 gap-6 md:gap-8">
              <div className="md:col-span-2 space-y-6">
                 <div>
                    <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedSchedule.title}</h3>
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
                       <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100 flex items-center gap-1">
                         ₱{selectedSchedule.price?.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </span>
                    </div>
                 </div>
                 
                <div className={`prose prose-blue max-w-none p-6 rounded-xl border ${darkMode ? 'text-gray-300 bg-gray-800/50 border-gray-700' : 'text-gray-600 bg-gray-50 border-gray-100'}`}>
                    <p>
                       This training course is designed to provide comprehensive knowledge and hands-on experience. 
                       Please ensure you meet all requirements before registering.
                    </p>
                 </div>
              </div>

              <div className={`rounded-xl p-6 flex flex-col justify-center items-center text-center border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                 <div className={`w-20 h-20 rounded-full shadow-sm flex items-center justify-center mb-4 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                    <Users className="w-8 h-8 text-blue-600" />
                 </div>
                 <div className="mb-6">
                    <p className={`text-sm uppercase tracking-wide font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current Enrollment</p>
                    <p className={`text-3xl font-bold my-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedSchedule.registered} <span className={`text-lg font-normal ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>/ {selectedSchedule.capacity}</span>
                    </p>
                    {selectedSchedule.registered >= selectedSchedule.capacity && (
                       <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`}>
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
                    className={`mt-4 text-sm font-medium underline-offset-4 hover:underline ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
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
      if (!assessmentForm.referenceNumber) errors.referenceNumber = "Reference Number is required.";
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
           <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Assessments</h2>
           <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Apply for certification and skills assessment</p>
        </div>
        
        {assessmentStep === 0 && (
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
             <div className="relative w-full md:w-64 group">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Search className={`h-5 w-5 transition-colors ${darkMode ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
               </div>
               <input 
                 type="text" 
                 placeholder="Search assessments..." 
                 value={assessmentSearch}
                 onChange={(e) => {
                    setAssessmentSearch(e.target.value);
                    setAssessmentPage(1);
                 }}
                 className={`block w-full pl-10 pr-3 py-2.5 border rounded-xl leading-5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm hover:shadow-md ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
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
               className={`px-5 py-2.5 rounded-xl hover:bg-blue-700 shadow-lg transition-all flex items-center gap-2 font-medium whitespace-nowrap ${!user ? 'opacity-50 cursor-not-allowed' : ''} ${darkMode ? 'bg-blue-600 text-white shadow-blue-900/20' : 'bg-blue-600 text-white shadow-blue-200'}`}
             >
               <UserPlus className="w-5 h-5" />
               New Application
             </button>
          </div>
        )}
      </div>

      {assessmentStep === 0 ? (
        <div className="relative md:min-h-[700px] lg:min-h-[800px] transition-all duration-500 ease-in-out">
          {/* Previous Button (Left) */}
          <motion.button 
             onClick={() => setAssessmentPage(p => Math.max(1, p - 1))} 
             disabled={assessmentPage === 1} 
             whileHover={{ x: -6, boxShadow: "0 0 20px rgba(59,130,246,0.6)" }} 
             whileTap={{ scale: 0.9 }} 
             transition={{ type: "spring", stiffness: 300, damping: 20 }} 
             style={{ y: "-50%" }}
             className={` 
               hidden md:flex fixed left-2 md:left-6 top-[65%] 
               z-40 
               w-10 h-10 
               rounded-full 
               flex items-center justify-center 
               border transition-colors 
               ${ 
                 assessmentPage === 1 
                   ? (darkMode ? 'bg-gray-800 border-gray-700 text-gray-600' : 'bg-gray-50 border-gray-200 text-gray-300') + ' opacity-50 cursor-not-allowed' 
                   : (darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700' : 'bg-white border-gray-100 text-gray-600 hover:text-blue-600')
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
               hidden md:flex fixed right-2 md:right-6 top-[65%] 
               z-40 
               w-10 h-10 
               rounded-full 
               flex items-center justify-center 
               border transition-colors 
               ${ 
                 assessmentPage === (totalPages || 1) 
                   ? (darkMode ? 'bg-gray-800 border-gray-700 text-gray-600' : 'bg-gray-50 border-gray-200 text-gray-300') + ' opacity-50 cursor-not-allowed' 
                   : (darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700' : 'bg-white border-gray-100 text-gray-600 hover:text-blue-600')
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
             <div className={`w-full text-center py-12 rounded-2xl border border-dashed ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                   <FileCheck className={`w-8 h-8 ${darkMode ? 'text-gray-500' : 'text-gray-300'}`} />
                </div>
                <h3 className={`text-lg font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>No assessments found</h3>
                <p className={`text-gray-500`}>Try adjusting your search terms</p>
             </div>
          ) : (
            currentAssessments.map((assessment) => {
              const isOpen = assessment.status === 'Open' || assessment.status === 'Active';
              const hasApplied = myApplications.some(app => {
                const appAssessmentId = app.assessmentId?._id || app.assessmentId;
                return String(appAssessmentId) === String(assessment.id) && ['Pending', 'Approved'].includes(app.status);
              });

              return (
                <div key={assessment.id} className={`w-full md:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1.5rem)] max-w-sm group rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden ${darkMode ? 'bg-[#1e293b] border-gray-700 hover:border-gray-600' : 'bg-white border-gray-100'}`}>
                   
                   <div className="p-4 md:p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-3 md:mb-4">
                         <div className={`p-2.5 md:p-3 rounded-xl ${isOpen ? (darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-50 text-green-600') : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                            <FileCheck className="w-6 h-6" />
                         </div>
                         <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                            isOpen 
                              ? (darkMode ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-green-100 text-green-700 border border-green-200')
                              : (darkMode ? 'bg-gray-700 text-gray-400 border border-gray-600' : 'bg-gray-100 text-gray-600 border border-gray-200')
                          }`}>
                            {assessment.status}
                          </span>
                      </div>

                      <h3 className={`text-lg font-bold mb-2 transition-colors ${darkMode ? 'text-gray-100 group-hover:text-blue-400' : 'text-gray-900 group-hover:text-blue-600'}`}>
                        {assessment.title}
                      </h3>
                      
                      <div className="space-y-3 md:space-y-4 mb-6 flex-1">
                         <div className={`flex items-center justify-between text-sm p-2.5 md:p-3 rounded-lg ${darkMode ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
                            <span className="font-medium">Assessment Fee</span>
                            <span className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>₱{Number(assessment.fee || 0).toLocaleString('en-PH')}</span>
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
                             ? (darkMode ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md hover:shadow-lg shadow-blue-900/20' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg shadow-blue-200')
                             : (darkMode ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200')
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
          <div className="mt-4 md:hidden flex items-center justify-between">
            <button
              onClick={() => setAssessmentPage(p => Math.max(1, p - 1))}
              disabled={assessmentPage === 1}
              className={`px-4 py-2 rounded-lg font-medium border ${
                assessmentPage === 1
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              } ${darkMode ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-200'}`}
            >
              Previous
            </button>
            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{assessmentPage} / {totalPages || 1}</span>
            <button
              onClick={() => setAssessmentPage(p => Math.min(totalPages || 1, p + 1))}
              disabled={assessmentPage === (totalPages || 1)}
              className={`px-4 py-2 rounded-lg font-medium border ${
                assessmentPage === (totalPages || 1)
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              } ${darkMode ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-200'}`}
            >
              Next
            </button>
          </div>
      </div>
      ) : (
        <div className={`rounded-lg shadow p-6 ${darkMode ? 'bg-[#1e293b] border border-gray-700' : 'bg-white'}`}>
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className={`flex items-center ${assessmentStep >= 1 ? (darkMode ? 'text-blue-400' : 'text-blue-600') : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${assessmentStep >= 1 ? (darkMode ? 'border-blue-500 bg-blue-500/20' : 'border-blue-600 bg-blue-50') : 'border border-gray-400'}`}>1</div>
              <span className="ml-2 font-medium">Form</span>
            </div>
            <div className={`w-16 h-1 mx-4 ${assessmentStep >= 2 ? (darkMode ? 'bg-blue-500' : 'bg-blue-600') : 'bg-gray-300'}`} />
            <div className={`flex items-center ${assessmentStep >= 2 ? (darkMode ? 'text-blue-400' : 'text-blue-600') : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${assessmentStep >= 2 ? (darkMode ? 'border-blue-500 bg-blue-500/20' : 'border-blue-600 bg-blue-50') : 'border border-gray-400'}`}>2</div>
              <span className="ml-2 font-medium">Payment</span>
            </div>
            <div className={`w-16 h-1 mx-4 ${assessmentStep >= 3 ? (darkMode ? 'bg-blue-500' : 'bg-blue-600') : 'bg-gray-300'}`} />
            <div className={`flex items-center ${assessmentStep >= 3 ? (darkMode ? 'text-blue-400' : 'text-blue-600') : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${assessmentStep >= 3 ? (darkMode ? 'border-blue-500 bg-blue-500/20' : 'border-blue-600 bg-blue-50') : 'border border-gray-400'}`}>3</div>
              <span className="ml-2 font-medium">Done</span>
            </div>
          </div>

          {/* Step 1: Form */}
          {assessmentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Section 1: Assessment & School Details */}
              <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className={`px-6 py-4 border-b flex items-center gap-3 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                   <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                      <Briefcase className="w-5 h-5" />
                   </div>
                   <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Application Details</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Assessment Title</label>
                    {isAssessmentFixed ? (
                      <input 
                        type="text" 
                        className={`w-full border rounded-xl px-4 py-2.5 focus:outline-none cursor-not-allowed ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-400 text-gray-700'}`}
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
                        darkMode={darkMode}
                        disabled={!user}
                        buttonClassName={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-400 text-gray-900'} ${assessmentErrors.assessmentId ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    )}
                    {assessmentErrors.assessmentId && !isAssessmentFixed && <p className="text-sm text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {assessmentErrors.assessmentId}</p>}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>School/Company Name</label>
                    <input 
                      type="text" 
                      disabled={!user}
                      className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${assessmentErrors.schoolCompany ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                      value={assessmentForm.schoolCompany}
                      onChange={e => {
                        setAssessmentForm({...assessmentForm, schoolCompany: e.target.value});
                        if (e.target.value) setAssessmentErrors(prev => { const c = {...prev}; delete c.schoolCompany; return c; });
                      }}
                    />
                    {assessmentErrors.schoolCompany && <p className="text-sm text-red-500 mt-1">{assessmentErrors.schoolCompany}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>School/Company Address</label>
                    <input 
                      type="text" 
                      disabled={!user}
                      className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${assessmentErrors.address ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className={`px-6 py-4 border-b flex items-center gap-3 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                   <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                      <User className="w-5 h-5" />
                   </div>
                   <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Personal Information</h3>
                </div>
                 <div className="p-4 md:p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1">
                      <input 
                        type="text" 
                        placeholder="Surname" 
                        disabled={!user}
                        className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${assessmentErrors.surname ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${assessmentErrors.firstname ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                        value={assessmentForm.firstname} 
                        onChange={e => {
                          setAssessmentForm({...assessmentForm, firstname: e.target.value});
                          if (e.target.value) setAssessmentErrors(prev => { const c = {...prev}; delete c.firstname; return c; });
                        }} 
                      />
                      {assessmentErrors.firstname && <p className="text-sm text-red-500 mt-1">{assessmentErrors.firstname}</p>}
                    </div>
                    <input type="text" placeholder="Middle Name" disabled={!user} className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.middlename} onChange={e => setAssessmentForm({...assessmentForm, middlename: e.target.value})} />
                    <input type="text" placeholder="M.I." disabled={!user} className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-24 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.middleInitial} onChange={e => setAssessmentForm({...assessmentForm, middleInitial: e.target.value})} />
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
                        darkMode={darkMode}
                        disabled={!user}
                        buttonClassName={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-400 text-gray-900'} ${assessmentErrors.sex ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        darkMode={darkMode}
                        disabled={!user}
                        buttonClassName={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-400 text-gray-900'} ${assessmentErrors.civilStatus ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      {assessmentErrors.civilStatus && <p className="text-sm text-red-500 mt-1">{assessmentErrors.civilStatus}</p>}
                    </div>

                    <div className="md:col-span-1">
                      <input 
                        type="number" 
                        placeholder="Age" 
                        disabled={!user}
                        className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${assessmentErrors.age ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Birth Date</label>
                      <input 
                        type="date" 
                        disabled={!user}
                        className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${assessmentErrors.birthDate ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} 
                        value={assessmentForm.birthDate} 
                        onChange={e => {
                          setAssessmentForm({...assessmentForm, birthDate: e.target.value});
                          if (e.target.value) setAssessmentErrors(prev => { const c = {...prev}; delete c.birthDate; return c; });
                        }} 
                      />
                      {assessmentErrors.birthDate && <p className="text-sm text-red-500 mt-1">{assessmentErrors.birthDate}</p>}
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Birth Place</label>
                      <input type="text" disabled={!user} className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.birthPlace} onChange={e => setAssessmentForm({...assessmentForm, birthPlace: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" placeholder="Mother's Name" disabled={!user} className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.motherName} onChange={e => setAssessmentForm({...assessmentForm, motherName: e.target.value})} />
                    <input type="text" placeholder="Father's Name" disabled={!user} className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.fatherName} onChange={e => setAssessmentForm({...assessmentForm, fatherName: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Section 3: Mailing Address */}
              <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className={`px-6 py-4 border-b flex items-center gap-3 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                   <div className={`p-2 rounded-lg ${darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                      <MapPin className="w-5 h-5" />
                   </div>
                   <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Mailing Address</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <input type="text" placeholder="Number, Street" disabled={!user} className={`md:col-span-3 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.mailingAddress.numberStreet} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, numberStreet: e.target.value}})} />
                  <input type="text" placeholder="Barangay" disabled={!user} className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.mailingAddress.barangay} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, barangay: e.target.value}})} />
                  <input type="text" placeholder="District" disabled={!user} className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.mailingAddress.district} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, district: e.target.value}})} />
                  <input type="text" placeholder="City" disabled={!user} className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.mailingAddress.city} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, city: e.target.value}})} />
                  <input type="text" placeholder="Province" disabled={!user} className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.mailingAddress.province} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, province: e.target.value}})} />
                  <input type="text" placeholder="Region" disabled={!user} className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.mailingAddress.region} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, region: e.target.value}})} />
                  <input type="text" placeholder="Zip Code" disabled={!user} className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`} value={assessmentForm.mailingAddress.zipCode} onChange={e => setAssessmentForm({...assessmentForm, mailingAddress: {...assessmentForm.mailingAddress, zipCode: e.target.value}})} />
                </div>
              </div>

              {/* Section 4: Contact & Education */}
              <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className={`px-6 py-4 border-b flex items-center gap-3 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                   <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                      <GraduationCap className="w-5 h-5" />
                   </div>
                   <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Education & Contact</h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email Address</label>
                      <input 
                        type="email" 
                        placeholder="Email" 
                        disabled={!user}
                        className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${assessmentErrors.email ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                        value={assessmentForm.email} 
                        onChange={e => {
                          setAssessmentForm({...assessmentForm, email: e.target.value});
                          if (e.target.value) setAssessmentErrors(prev => { const c = {...prev}; delete c.email; return c; });
                        }} 
                      />
                      {assessmentErrors.email && <p className="text-sm text-red-500 mt-1">{assessmentErrors.email}</p>}
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Mobile Number</label>
                      <input 
                        type="text" 
                        placeholder="Mobile Number" 
                        disabled={!user}
                        className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${assessmentErrors.mobile ? 'border-red-500 ring-2 ring-red-200' : ''} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Highest Educational Attainment</label>
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
                        darkMode={darkMode}
                        disabled={!user}
                        buttonClassName={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      {assessmentForm.educationAttainment === 'Others' && (
                        <input 
                          type="text" 
                          placeholder="Please specify" 
                          disabled={!user}
                          className={`mt-2 w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                          value={assessmentForm.educationOthers}
                          onChange={e => setAssessmentForm({...assessmentForm, educationOthers: e.target.value})}
                        />
                      )}
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Employment Status</label>
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
                        darkMode={darkMode}
                        disabled={!user}
                        buttonClassName={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-400 text-gray-900'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`flex justify-end gap-3 pt-4 sticky bottom-0 backdrop-blur-sm p-4 border-t z-10 rounded-xl ${darkMode ? 'bg-gray-900/80 border-gray-700' : 'bg-white/80 border-gray-100'}`}>
                <button 
                  onClick={() => setAssessmentStep(0)}
                  className={`px-6 py-2.5 rounded-xl border font-medium transition ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-400 text-gray-700 hover:bg-gray-50'}`}
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
              <h3 className={`text-xl font-semibold border-b pb-2 ${darkMode ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'}`}>Payment Details</h3>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Payment Method</label>
                <div className="flex gap-4">
                  <label className={`flex items-center gap-2 border p-4 rounded-lg cursor-pointer w-full transition-colors ${assessmentErrors.paymentMethod ? 'border-red-500 bg-red-50' : (darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50')} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
                      <span className={`font-bold block ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Online Payment (GCash)</span>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pay via GCash and upload proof</span>
                    </div>
                  </label>
                  <label className={`flex items-center gap-2 border p-4 rounded-lg cursor-pointer w-full transition-colors ${assessmentErrors.paymentMethod ? 'border-red-500 bg-red-50' : (darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50')} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
                      <span className={`font-bold block ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>No / On-site Payment</span>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pay at the office</span>
                    </div>
                  </label>
                </div>
                {assessmentErrors.paymentMethod && <p className="text-sm text-red-600 mt-1">{assessmentErrors.paymentMethod}</p>}
              </div>

              {assessmentForm.paymentMethod === 'Online' && (
                <div className={`p-6 rounded-lg border space-y-4 ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-100'}`}>
                  <div className="flex flex-col items-center justify-center text-center gap-4 py-4">
                     <div className={`w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <span className="font-bold text-blue-600 text-xl">G</span>
                     </div>
                     <div>
                       <h4 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pay with GCash</h4>
                       <p className={`text-sm max-w-xs mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                         You will be redirected to a secure payment gateway to complete your transaction.
                       </p>
                     </div>
                     
                    <div className="w-full">
                      <div className={`mx-auto max-w-2xl border rounded-2xl p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-blue-200'}`}>
                        <div className="flex items-center gap-6">
                          <div className="relative group cursor-zoom-in" onClick={() => paymentConfig?.qrCodeImage && setZoomedImage(paymentConfig.qrCodeImage)}>
                            <div className={`p-3 rounded-xl shadow-sm border shrink-0 ${darkMode ? 'bg-white border-blue-900' : 'bg-white border-blue-100'}`}>
                              {paymentConfig?.qrCodeImage ? (
                                <img src={paymentConfig.qrCodeImage} alt="GCash QR" className="w-28 h-28 md:w-32 md:h-32 object-contain" />
                              ) : (
                                <div className="w-28 h-28 md:w-32 md:h-32 bg-gray-50 flex items-center justify-center text-xs text-center text-gray-400 rounded-lg border border-dashed border-gray-200">No QR Code</div>
                              )}
                            </div>
                            {paymentConfig?.qrCodeImage && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 rounded-xl">
                                <div className="bg-white/90 p-2 rounded-full shadow-sm">
                                  <Eye className="w-4 h-4 text-blue-600" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-8">
                            <div>
                              <p className="text-xs text-blue-500 uppercase font-bold tracking-wider mb-1">GCash Number</p>
                              <p className={`text-2xl font-mono font-bold tracking-tight ${darkMode ? 'text-white' : 'text-blue-800'}`}>{paymentConfig?.gcashNumber || '09XX-XXX-XXXX'}</p>
                            </div>
                            <div className="hidden md:block h-10 w-px bg-blue-200/50 dark:bg-gray-700" />
                            <div>
                              <p className="text-xs uppercase font-bold tracking-wider mb-1 text-green-600">Fee</p>
                              <p className={`text-2xl font-mono font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                ₱{Number(assessmentForm.fee || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
 
                  </div>
                  
                  {/* Manual fields with persistent image preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sender GCash Number</label>
                      <input
                        type="text"
                        maxLength="11"
                        placeholder="09XXXXXXXXX"
                        className={`w-full border-2 rounded-xl px-4 py-3 font-mono text-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none ${assessmentErrors.senderGcash ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700'}`}
                        value={assessmentForm.senderGcash || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                          setAssessmentForm(f => ({ ...f, senderGcash: value }));
                          if (assessmentErrors.senderGcash) setAssessmentErrors(prev => { const c = { ...prev }; delete c.senderGcash; return c; });
                        }}
                        disabled={!user}
                      />
                      {assessmentErrors.senderGcash && <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {assessmentErrors.senderGcash}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Reference Number</label>
                      <input
                        type="text"
                        placeholder="GCash Ref No."
                        className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none ${assessmentErrors.referenceNumber ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700'}`}
                        value={assessmentForm.referenceNumber || ''}
                        onChange={(e) => {
                          setAssessmentForm(f => ({ ...f, referenceNumber: e.target.value }));
                          if (assessmentErrors.referenceNumber) setAssessmentErrors(prev => { const c = { ...prev }; delete c.referenceNumber; return c; });
                        }}
                        disabled={!user}
                      />
                      {assessmentErrors.referenceNumber && <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {assessmentErrors.referenceNumber}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Proof of Payment (Screenshot)</label>
                      <div className={`border-2 border-dashed rounded-2xl p-6 md:p-8 text-center transition-all duration-200 group ${assessmentErrors.proofOfPayment ? 'border-red-300 bg-red-50' : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50/30 dark:border-gray-700'}`}>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="proof-upload-assess"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setAssessmentForm(f => ({ ...f, proofOfPayment: reader.result }));
                                if (assessmentErrors.proofOfPayment) setAssessmentErrors(prev => { const c = { ...prev }; delete c.proofOfPayment; return c; });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          disabled={!user}
                        />
                        <label htmlFor="proof-upload-assess" className="cursor-pointer block w-full">
                          {assessmentForm.proofOfPayment ? (
                            <div className="relative mx-auto max-w-md">
                              <img 
                                src={assessmentForm.proofOfPayment} 
                                alt="Proof of payment" 
                                className="mx-auto max-h-64 w-auto rounded-2xl object-contain border border-blue-200 dark:border-gray-700"
                              />
                              <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="text-white font-medium flex items-center gap-2">
                                  <Camera className="w-5 h-5" />
                                  <span>Change Image</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-3">
                              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 dark:bg-gray-800 dark:text-blue-400 dark:border-gray-700">IMG</div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Click to upload your payment screenshot</p>
                              <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                            </div>
                          )}
                        </label>
                      </div>
                      {assessmentErrors.proofOfPayment && <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {assessmentErrors.proofOfPayment}</p>}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => setAssessmentStep(1)}
                  className={`px-6 py-2 rounded-xl border transition-colors ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Cancel
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
                  className={`px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition-all ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {assessmentStep === 3 && (
            <div className="text-center py-8 space-y-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Application Submitted!</h3>
                <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Your assessment application has been successfully recorded.</p>
              </div>
              
              <div className={`border rounded-lg p-6 text-left max-w-2xl mx-auto ${darkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'}`}>
                <h4 className={`font-bold mb-2 flex items-center gap-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>
                  <AlertCircle className="w-5 h-5" />
                  Next Steps
                </h4>
                <ul className={`list-disc list-inside space-y-2 ${darkMode ? 'text-yellow-300' : 'text-yellow-900'}`}>
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
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0f172a] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden transform transition-all scale-100 flex flex-col max-h-[80vh]">
            {/* Header Area */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-center relative overflow-hidden shrink-0 text-white">
               <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-50 backdrop-blur-3xl"></div>
               <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
               <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
               
               <div className="relative z-10 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-2 backdrop-blur-sm shadow-inner">
                     <FileCheck className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight mb-1">Terms & Conditions</h2>
                  <p className="text-blue-100 text-sm font-medium leading-relaxed opacity-90">
                     Please review the enrollment agreement before proceeding.
                  </p>
               </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
               <div className="p-6 overflow-y-auto custom-scrollbar">
                 <div className="grid gap-2">
                   {[
                     "Enrollment will be confirmed prior to the start of the course.",
                     "Requirements should be submitted on or before start of the training.",
                     "Failure to submit requirements will result in cancellation.",
                     "Participants should observe proper decorum during training.",
                     "MTC reserves the right to modify course contents and schedules."
                   ].map((term, index) => (
                      <div key={index} className="flex gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors group border border-gray-100 hover:border-blue-100 hover:shadow-sm bg-white">
                         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                            {index + 1}
                         </div>
                         <p className="text-gray-600 leading-relaxed text-sm font-medium group-hover:text-gray-900 transition-colors pt-1">
                            {term}
                         </p>
                      </div>
                   ))}
                 </div>
               </div>
               
               {/* Footer Actions */}
               <div className="p-5 bg-gray-50 border-t border-gray-100 shrink-0">
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-gray-900 font-bold text-sm">Do you agree to these terms?</p>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <button 
                        onClick={() => setShowTerms(false)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-5 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all duration-200 active:scale-95 shadow-sm text-sm"
                      >
                        <X className="w-4 h-4" />
                        Disagree
                      </button>
                      
                      <button 
                        onClick={() => {
                          if (activeSection !== 'assessment') {
                            submitRegistrationToServer();
                          }
                        }}
                        disabled={submitting || !user}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-5 rounded-xl font-bold text-white shadow-lg transition-all duration-200 active:scale-95 transform hover:-translate-y-0.5 text-sm ${
                           submitting || !user 
                              ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-200'
                        }`}
                      >
                        {submitting ? (
                           <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Processing...</span>
                           </>
                        ) : (
                           <>
                              <CheckCircle className="w-4 h-4" />
                              <span>I Agree</span>
                           </>
                        )}
                      </button>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      

      {/* Header */}
      <div className={`shadow-sm border-b sticky top-0 z-50 transition-colors duration-300 ${darkMode ? 'bg-[#0f172a] border-gray-800' : 'bg-white border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1 rounded-lg bg-white ring-1 ring-black/5 shadow-sm">
                <img src="/Logo_MTC.png" alt="MTC Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
              </div>
              <div>
                <h1 className={`text-base sm:text-lg font-bold leading-none ${darkMode ? 'text-white' : 'text-gray-900'}`}>Mechatronic Training Corporation</h1>
                <p className={`hidden sm:block text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Student Portal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setMobileNavOpen(true)}
                className={`md:hidden p-1.5 sm:p-2 rounded-full transition-colors ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-1.5 sm:p-2 rounded-full transition-colors ${darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
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
                      className={`relative p-2 rounded-full transition-colors focus:outline-none ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      <Bell className="w-6 h-6" />
                      {unreadCount > 0 && (
                        <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 ${darkMode ? 'border-gray-900' : 'border-white'} animate-pulse`}></span>
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
                            className={`absolute right-0 top-full mt-2 w-80 md:w-96 rounded-xl shadow-xl overflow-hidden z-20 border ${darkMode ? 'bg-[#0f172a] border-gray-700' : 'bg-white border-gray-100'}`}
                          >
                            <div className={`px-4 py-3 border-b flex justify-between items-center ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                              <div className="flex gap-3">
                                {unreadCount > 0 && (
                                  <button 
                                    onClick={handleMarkAllRead}
                                    className={`text-xs font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                                  >
                                    Mark all as read
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                              {notifications.length === 0 ? (
                                <div className={`p-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  <Bell className={`w-8 h-8 mx-auto mb-2 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                                  <p className="text-sm">No notifications yet</p>
                                </div>
                              ) : (
                                <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                                  {notifications.map(notification => (
                                    <div 
                                      key={notification._id} 
                                      className={`p-4 transition-colors cursor-pointer ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} ${!notification.isRead ? (darkMode ? 'bg-blue-900/10' : 'bg-blue-50/50') : ''}`}
                                      onClick={() => {
                                        if(!notification.isRead) handleMarkRead(notification._id);
                                        setActiveSection('notifications');
                                        setShowNotifications(false);
                                      }}
                                    >
                                      <div className="flex gap-3">
                                        <div className={`mt-1 p-1.5 rounded-full shrink-0 ${
                                          notification.type === 'success' ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600') :
                                          notification.type === 'error' ? (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600') :
                                          notification.type === 'warning' ? (darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-600') :
                                          (darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600')
                                        }`}>
                                          {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                                           notification.type === 'error' ? <AlertCircle className="w-4 h-4" /> :
                                           notification.type === 'warning' ? <AlertCircle className="w-4 h-4" /> :
                                           <Bell className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1">
                                          <p className={`text-sm ${!notification.isRead ? (darkMode ? 'font-semibold text-white' : 'font-semibold text-gray-900') : (darkMode ? 'text-gray-300' : 'text-gray-700')}`}>
                                            {notification.message.length > 50 ? notification.message.substring(0, 50) + '...' : notification.message}
                                          </p>
                                          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                                            {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                          </p>
                                        </div>
                                        {!notification.isRead && (
                                          <div className={`w-2 h-2 rounded-full mt-2 ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className={`p-2 border-t ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50'}`}>
                               <button 
                                 onClick={() => {
                                   setActiveSection('notifications');
                                   setShowNotifications(false);
                                 }}
                                 className={`w-full py-2 text-sm text-center font-medium rounded-lg transition-colors ${darkMode ? 'text-blue-400 hover:bg-gray-800' : 'text-blue-600 hover:bg-blue-50'}`}
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
                      className={`flex items-center gap-3 p-2 rounded-xl transition-all border ${
                        darkMode 
                          ? 'hover:bg-gray-800 hover:border-gray-700 border-transparent' 
                          : 'hover:bg-gray-50 hover:border-gray-200 border-transparent'
                      }`}
                    >
                      <div className="text-right hidden sm:block">
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.firstName} {user.lastName}</p>
                        <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Student</p>
                      </div>
                      <div className={`w-10 h-10 rounded-full border-2 overflow-hidden flex-shrink-0 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'}`}>
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            <User className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${darkMode ? 'text-gray-500' : 'text-gray-400'} ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
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
                            className={`absolute right-0 top-full mt-2 w-64 rounded-xl shadow-xl overflow-hidden z-20 py-2 border ${
                              darkMode ? 'bg-[#0f172a] border-gray-700' : 'bg-white border-gray-100'
                            }`}
                          >
                            <div className={`px-4 py-3 border-b mb-2 sm:hidden ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                              <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.firstName} {user.lastName}</p>
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Student</p>
                            </div>
                            
                            <button 
                              onClick={() => { setActiveSection('profile'); setIsProfileDropdownOpen(false); }}
                              className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                                darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <User className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                              Edit Profile
                            </button>
                            
                            <button 
                              onClick={() => { setActiveSection('my-activity'); setIsProfileDropdownOpen(false); }}
                              className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                                darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <Clock className={`w-4 h-4 ${darkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                              My Activity
                            </button>

                            <div className={`my-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}></div>
                            
                            <button 
                              onClick={handleLogout}
                              className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                                darkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                              }`}
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
                  <a href="/student/login" className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${darkMode ? 'text-gray-300 hover:text-blue-300 hover:bg-gray-800' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'}`}>
                    Log in
                  </a>
                  <a href="/student/register" className={`text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2 ${darkMode ? 'text-white bg-blue-600 hover:bg-blue-500' : 'text-white bg-blue-600 hover:bg-blue-700'}`}>
                    <UserPlus className="w-4 h-4" />
                    Sign up
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', bounce: 0.08, duration: 0.35 }}
              className={`fixed bottom-0 left-0 right-0 z-[60] rounded-t-2xl border-t p-4 ${darkMode ? 'bg-[#0f172a] border-gray-800' : 'bg-white border-gray-200 shadow-lg'}`}
            >
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Navigation</span>
                  <button
                    onClick={() => setMobileNavOpen(false)}
                    className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => { setActiveSection('dashboard'); setActiveSubSection(''); setMobileNavOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition ${activeSection === 'dashboard'
                      ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                      : (darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-50 text-gray-800 hover:bg-gray-100')}`}
                  >
                    <span className="flex items-center gap-2"><User className="w-5 h-5" /> Dashboard</span>
                    {activeSection === 'dashboard' && <CheckCircle className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { setActiveSection('schedules'); setActiveSubSection(''); setMobileNavOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition ${activeSection === 'schedules'
                      ? (darkMode ? 'bg-blue-600 text:white' : 'bg-blue-600 text-white')
                      : (darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-50 text-gray-800 hover:bg-gray-100')}`}
                  >
                    <span className="flex items-center gap-2"><Calendar className="w-5 h-5" /> Paid Training</span>
                    {activeSection === 'schedules' && <CheckCircle className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { setActiveSection('assessment'); setActiveSubSection(''); setAssessmentStep(0); setMobileNavOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition ${activeSection === 'assessment'
                      ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                      : (darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-50 text-gray-800 hover:bg-gray-100')}`}
                  >
                    <span className="flex items-center gap-2"><FileCheck className="w-5 h-5" /> Assessments</span>
                    {activeSection === 'assessment' && <CheckCircle className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className={`hidden md:block shadow-sm border-b transition-colors duration-300 ${darkMode ? 'bg-[#0f172a] border-gray-800' : 'bg-white border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveSection('dashboard'); setActiveSubSection(''); }}
              className={`px-6 py-4 font-medium transition flex items-center gap-2 ${
                activeSection === 'dashboard' 
                  ? 'text-blue-500 border-b-2 border-blue-500' 
                  : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <User className="w-5 h-5" />
              DASHBOARD
            </button>
            <button
              onClick={() => { setActiveSection('schedules'); setActiveSubSection(''); }}
              className={`px-6 py-4 font-medium transition flex items-center gap-2 ${
                activeSection === 'schedules' 
                  ? 'text-blue-500 border-b-2 border-blue-500' 
                  : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar className="w-5 h-5" />
              PAID TRAINING
            </button>
            <button
              onClick={() => { setActiveSection('assessment'); setActiveSubSection(''); setAssessmentStep(0); }}
              className={`px-6 py-4 font-medium transition flex items-center gap-2 ${
                activeSection === 'assessment' 
                  ? 'text-blue-500 border-b-2 border-blue-500' 
                  : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'
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
          <div className={`rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200 ${darkMode ? 'bg-[#0f172a] border border-gray-700' : 'bg-white'}`}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${darkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
                <AlertCircle className={`w-8 h-8 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Attention Needed</h3>
              <p className={`mb-6 text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {error || 'Please check the form, something is wrong.'}
              </p>
              <button
                onClick={() => setShowErrorModal(false)}
                className={`w-full px-6 py-3 rounded-lg transition font-semibold text-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
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
          <div className={`rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200 ${darkMode ? 'bg-[#0f172a] border border-gray-700' : 'bg-white'}`}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <CheckCircle className={`w-8 h-8 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {activeSection === 'assessment' ? 'Application Submitted!' : 'Registration Successful!'}
              </h3>
              <p className={`mb-6 text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Your application has been submitted successfully.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className={`w-full px-6 py-3 rounded-lg transition font-semibold text-lg ${darkMode ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
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
