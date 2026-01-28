import React, { useState, useEffect } from 'react'; 
import { Home, LayoutDashboard, UserPlus, Calendar, Award, Plus, Edit, Trash2, Search, LogOut, X, Eye, Settings, Upload, Save, CreditCard, Image as ImageIcon, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Moon, Sun, Bell, User, Lock, Camera, Menu, Download, Briefcase, BookOpen, Mail, Phone, MapPin, GraduationCap, TrendingUp } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import CustomDatePicker from '../components/CustomDatePicker';

const AdminDashboard = () => { 
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard'); 
  const [activeSubSection, setActiveSubSection] = useState(''); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [scheduleSearchTerm, setScheduleSearchTerm] = useState(''); // New search state for schedules
  const [courseFilter, setCourseFilter] = useState(''); // New filter state
  const [assessmentAppFilter, setAssessmentAppFilter] = useState(''); // Filter by Assessment
  const [assessmentAppStatusFilter, setAssessmentAppStatusFilter] = useState(''); // Filter by Status
  const [assessmentAppSearchTerm, setAssessmentAppSearchTerm] = useState(''); // Search by Applicant Name
  const [assessmentSearch, setAssessmentSearch] = useState(''); // Search by Assessment Title/ID

  // Pagination State
  const [studentPage, setStudentPage] = useState(1);
  const itemsPerPage = 10;

  // Data State
  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [assessmentApps, setAssessmentApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editing State
  const [editingItem, setEditingItem] = useState(null); 
  const [isEditingTrainingCourse, setIsEditingTrainingCourse] = useState(false); // State for toggling course edit mode
  const [viewingStudent, setViewingStudent] = useState(null);
  const [viewingApp, setViewingApp] = useState(null);
  const [viewingScheduleStudents, setViewingScheduleStudents] = useState(null); // State for viewing enrolled students
  const [showScheduleStudentsModal, setShowScheduleStudentsModal] = useState(false); // State for modal visibility
  const [studentForm, setStudentForm] = useState({
    firstName: '', lastName: '', middleName: '', email: '', mobileNo: '', telephoneNo: '',
    dateOfBirth: '', age: '', sex: '', civilStatus: '', nationality: '', religion: '',
    completeAddress: '', educationCollege: '', educationCourse: '',
    employmentCompany: '', employmentPosition: '', employmentDepartment: '',
    employmentStatus: '', employmentDate: '', yearsOfExperience: '', employmentReferences: '',
    ojtIndustry: '', ojtCompany: '', ojtAddress: '',
    areaOfSpecialization: '', otherSpecification: '',
    trainingScheduleId: ''
  });
  const [studentFormErrors, setStudentFormErrors] = useState({});
  const [scheduleForm, setScheduleForm] = useState({ courseId: '', courseTitle: '', trainingDate: '', capacity: '' });
  const [assessmentForm, setAssessmentForm] = useState({ assessmentId: '', title: '', fee: '', capacity: '', status: 'Active' });

  // Settings State
  const [paymentConfig, setPaymentConfig] = useState({ gcashNumber: '', qrCodeImage: '' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [showSettingsSuccess, setShowSettingsSuccess] = useState(false);
  const [scheduleErrors, setScheduleErrors] = useState({});
  const [salesSearch, setSalesSearch] = useState('');
  const [salesDateRange, setSalesDateRange] = useState({ from: '', to: '' });
  const [salesAssessmentFilter, setSalesAssessmentFilter] = useState('');
  const [salesPage, setSalesPage] = useState(1);
  const SALES_ITEMS_PER_PAGE = 10;


  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: null,
    type: 'info' // 'info' | 'danger' | 'success'
  });

  // --- Theme & Profile State ---
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState({
    username: 'Admin User',
    role: 'Administrator',
    image: ''
  });
  const [profileForm, setProfileForm] = useState({
    username: '',
    password: '',
    image: ''
  });
  const [profileErrors, setProfileErrors] = useState({}); // Error state for profile modal

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  // Initial Load
  const [zoomedImage, setZoomedImage] = useState(null);

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadAdminProfile = async () => {
    try {
      const res = await fetch('/api/admin/profile');
      if (res.ok) {
        const data = await res.json();
        setUserProfile(prev => ({
          ...prev,
          username: data.username,
          image: data.image
        }));
      }
    } catch (error) {
      console.error('Failed to load admin profile:', error);
    }
  };

  useEffect(() => {
    loadNotifications();
    loadAdminProfile();
    const interval = setInterval(loadNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // Update viewingScheduleStudents when schedules change to keep data fresh
  useEffect(() => {
    if (viewingScheduleStudents) {
      const updated = schedules.find(s => s._id === viewingScheduleStudents._id);
      if (updated && updated !== viewingScheduleStudents) {
        setViewingScheduleStudents(updated);
      }
    }
  }, [schedules, viewingScheduleStudents]);

  // Reset pagination when filters change
  useEffect(() => {
    setStudentPage(1);
  }, [searchTerm, courseFilter]);

  const loadData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const timestamp = new Date().getTime();
      const [studentsRes, schedulesRes, assessmentsRes, registrationsRes, appsRes, settingsRes] = await Promise.all([
        fetch(`/api/students?t=${timestamp}`),
        fetch(`/api/schedules?t=${timestamp}`),
        fetch(`/api/assessments?t=${timestamp}`),
        fetch(`/api/registrations?t=${timestamp}`),
        fetch(`/api/assessment-applications?t=${timestamp}`),
        fetch(`/api/system-settings/payment_config?t=${timestamp}`)
      ]);

      if (!studentsRes.ok || !schedulesRes.ok || !assessmentsRes.ok || !registrationsRes.ok || !appsRes.ok) throw new Error('Failed to load data');

      const [sData, schData, aData, rData, appData, setConf] = await Promise.all([
        studentsRes.json(),
        schedulesRes.json(),
        assessmentsRes.json(),
        registrationsRes.json(),
        appsRes.json(),
        settingsRes.ok ? settingsRes.json() : null
      ]);

      setStudents(sData);
      setSchedules(schData);
      setAssessments(aData);
      setRegistrations(rData);
      setAssessmentApps(appData);
      if (setConf && setConf.value) {
        setPaymentConfig(setConf.value);
      }
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleSavePaymentConfig = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/system-settings/payment_config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: paymentConfig })
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setShowSettingsSuccess(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSettingsImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentConfig(prev => ({ ...prev, qrCodeImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/admin/login');
  };

  // --- Student CRUD ---
  const handleUpdateRegistrationStatus = async (regId, newStatus) => {
    try {
      const res = await fetch(`/api/registrations/${regId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      
      // Update local state
      setRegistrations(prev => prev.map(r => 
        r._id === regId ? { ...r, status: newStatus } : r
      ));
      
      // Refresh data to update counts
      loadData(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveStudent = async () => {
    // Check for changes when editing
    if (editingItem) {
      const originalState = {
        firstName: editingItem.firstName || '',
        lastName: editingItem.lastName || '',
        middleName: editingItem.middleName || '',
        email: editingItem.email || '',
        mobileNo: editingItem.mobileNo || '',
        telephoneNo: editingItem.telephoneNo || '',
        dateOfBirth: editingItem.dateOfBirth ? editingItem.dateOfBirth.split('T')[0] : '',
        age: editingItem.age || '',
        sex: editingItem.sex || '',
        civilStatus: editingItem.civilStatus || '',
        nationality: editingItem.nationality || '',
        religion: editingItem.religion || '',
        completeAddress: editingItem.completeAddress || '',
        educationCollege: editingItem.educationCollege || '',
        educationCourse: editingItem.educationCourse || '',
        employmentCompany: editingItem.employmentCompany || '',
        employmentPosition: editingItem.employmentPosition || '',
        employmentDepartment: editingItem.employmentDepartment || '',
        employmentStatus: editingItem.employmentStatus || '',
        employmentDate: editingItem.employmentDate ? editingItem.employmentDate.split('T')[0] : '',
        yearsOfExperience: editingItem.yearsOfExperience || '',
        employmentReferences: editingItem.employmentReferences || '',
        ojtIndustry: editingItem.ojtIndustry || '',
        ojtCompany: editingItem.ojtCompany || '',
        ojtAddress: editingItem.ojtAddress || '',
        areaOfSpecialization: editingItem.areaOfSpecialization || '',
        otherSpecification: editingItem.otherSpecification || '',
        trainingScheduleId: (() => {
          const reg = registrations.find(r => (r.studentId?._id || r.studentId) === editingItem._id && r.status !== 'cancelled');
          return reg ? (reg.scheduleId?._id || reg.scheduleId) : '';
        })()
      };

      const hasChanges = Object.keys(originalState).some(key => {
        return String(originalState[key]) !== String(studentForm[key]);
      });

      if (!hasChanges) {
        setConfirmModal({
          isOpen: true,
          title: 'No Changes',
          message: 'Nothing has changed.',
          type: 'info',
          onConfirm: null
        });
        return;
      }
    }

    // Validation
    const errors = {};
    const requiredFields = ['firstName', 'lastName', 'email', 'age'];
    const missingFields = requiredFields.filter(field => !studentForm[field]);
    
    missingFields.forEach(field => {
      errors[field] = 'This field is required';
    });

    if (studentForm.mobileNo && !/^\d{11}$/.test(studentForm.mobileNo)) {
      errors.mobileNo = 'Mobile number must be exactly 11 digits';
    }

    // Frontend validation for unique Email
    const duplicate = students.find(s => 
      (s.email || '').toLowerCase() === (studentForm.email || '').toLowerCase() && 
      s._id !== (editingItem ? editingItem._id : null)
    );
    
    if (duplicate) {
      errors.email = 'This email is already registered';
    }

    if (Object.keys(errors).length > 0) {
      setStudentFormErrors(errors);
      setConfirmModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please correct the highlighted errors before saving.',
        type: 'danger',
        onConfirm: null
      });
      return;
    }
    
    setStudentFormErrors({}); // Clear errors if valid

    try {
      // Separate trainingScheduleId from the rest of the student data
      const { trainingScheduleId, ...studentData } = studentForm;

      const url = editingItem ? `/api/students/${editingItem._id}` : '/api/students';
      const method = editingItem ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save student');
      }

      const savedStudent = await res.json();
      const studentId = savedStudent._id;

      // Handle Registration logic
      if (trainingScheduleId) {
        const existingReg = registrations.find(r => (r.studentId?._id || r.studentId) === studentId && r.status !== 'cancelled');
        
        if (existingReg) {
          const currentScheduleId = existingReg.scheduleId?._id || existingReg.scheduleId;
          if (currentScheduleId !== trainingScheduleId) {
            // Update existing registration
            await fetch(`/api/registrations/${existingReg._id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ scheduleId: trainingScheduleId })
            });
          }
        } else {
          // Create new registration
          await fetch('/api/registrations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              studentId, 
              scheduleId: trainingScheduleId,
              termsAccepted: true 
            })
          });
        }
      }

      setConfirmModal({
        isOpen: true,
        title: 'Success',
        message: editingItem ? 'Student updated successfully!' : 'Student added successfully!',
        type: 'success',
        onConfirm: null
      });
      setEditingItem(null);
      setStudentForm({
        firstName: '', lastName: '', middleName: '', email: '', mobileNo: '', telephoneNo: '',
        dateOfBirth: '', age: '', sex: '', civilStatus: '', nationality: '', religion: '',
        completeAddress: '', educationCollege: '', educationCourse: '',
        employmentCompany: '', employmentPosition: '', employmentDepartment: '',
        employmentStatus: '', employmentDate: '', yearsOfExperience: '', employmentReferences: '',
        ojtIndustry: '', ojtCompany: '', ojtAddress: '',
        areaOfSpecialization: '', otherSpecification: '',
        trainingScheduleId: ''
      });
      setActiveSubSection('');
      loadData();
    } catch (e) {
      let errorMessage = e.message;
      
      // Check if it's a Mongoose validation error
      if (errorMessage.includes('validation failed')) {
        const errors = errorMessage.split(':')[1].trim().split(',').map(err => {
          const parts = err.trim().split(': ');
          return parts.length > 1 ? parts[1] : err.trim();
        });
        
        errorMessage = (
          <ul className="list-disc pl-5 text-left space-y-1">
            {errors.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        );
      }

      setConfirmModal({
        isOpen: true,
        title: 'Error',
        message: errorMessage,
        type: 'danger',
        onConfirm: null
      });
    }
  };

  const handleDeleteStudent = (student) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Student?',
      message: `Are you sure you want to delete ${student.firstName} ${student.lastName}? This will also remove their registrations.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/students/${student._id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Failed to delete student');
          
          setConfirmModal({
            isOpen: true,
            title: 'Success',
            message: 'Student deleted successfully!',
            type: 'success',
            onConfirm: null
          });
          loadData();
        } catch (e) {
          setConfirmModal({
            isOpen: true,
            title: 'Error',
            message: e.message,
            type: 'danger',
            onConfirm: null
          });
        }
      }
    });
  };

  const generateStudentPDF = (student) => {
    const doc = createStudentPDFDoc(student);
    // Sanitize name but ensure .pdf extension remains
    const baseName = `${student.lastName}_${student.firstName}_Profile`.replace(/[^a-z0-9._-]/gi, '_');
    doc.save(`${baseName}.pdf`);
  };

  const startEditStudent = (student) => {
    setEditingItem(student);
    setStudentForm({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      middleName: student.middleName || '',
      email: student.email || '',
      mobileNo: student.mobileNo || '',
      telephoneNo: student.telephoneNo || '',
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      age: student.age || '',
      sex: student.sex || '',
      civilStatus: student.civilStatus || '',
      nationality: student.nationality || '',
      religion: student.religion || '',
      completeAddress: student.completeAddress || '',
      educationCollege: student.educationCollege || '',
      educationCourse: student.educationCourse || '',
      employmentCompany: student.employmentCompany || '',
      employmentPosition: student.employmentPosition || '',
      employmentDepartment: student.employmentDepartment || '',
      employmentStatus: student.employmentStatus || '',
      employmentDate: student.employmentDate ? student.employmentDate.split('T')[0] : '',
      yearsOfExperience: student.yearsOfExperience || '',
      employmentReferences: student.employmentReferences || '',
      ojtIndustry: student.ojtIndustry || '',
      ojtCompany: student.ojtCompany || '',
      ojtAddress: student.ojtAddress || '',
      areaOfSpecialization: student.areaOfSpecialization || '',
      otherSpecification: student.otherSpecification || '',
      trainingScheduleId: (() => {
        // Find active registration
        const reg = registrations.find(r => (r.studentId?._id || r.studentId) === student._id && r.status !== 'cancelled');
        return reg ? (reg.scheduleId?._id || reg.scheduleId) : '';
      })()
    });
    setActiveSubSection('student-form');
  };

  // --- Schedule CRUD ---
  const handleSaveSchedule = async () => {
    // Frontend validation for unique Course ID
    if (!editingItem) {
      const duplicate = schedules.find(s => s.courseId === scheduleForm.courseId);
      if (duplicate) {
        setConfirmModal({
          isOpen: true,
          title: 'Duplicate Entry',
          message: 'Course ID already exists!',
          type: 'danger',
          onConfirm: null
        });
        return;
      }
    }

    try {
      const url = editingItem ? `/api/schedules/${editingItem._id}` : '/api/schedules';
      const method = editingItem ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleForm)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save schedule');
      }

      setConfirmModal({
        isOpen: true,
        title: 'Success',
        message: editingItem ? 'Schedule updated successfully!' : 'Schedule added successfully!',
        type: 'success',
        onConfirm: null
      });
      setEditingItem(null);
      setScheduleForm({ courseId: '', courseTitle: '', trainingDate: '', capacity: '' });
      setActiveSubSection('');
      loadData();
    } catch (e) {
      let errorMessage = e.message;
      
      // Check if it's a Mongoose validation error
      if (errorMessage.includes('validation failed')) {
        const validationErrors = {};
        // Get content after the first colon (skipping "Schedule validation failed:")
        const errorContent = errorMessage.substring(errorMessage.indexOf(':') + 1).trim();
        
        errorContent.split(',').forEach(err => {
          const parts = err.trim().split(':');
          if (parts.length > 1) {
            const field = parts[0].trim();
            const message = parts.slice(1).join(':').trim();
            validationErrors[field] = message;
          }
        });
        setScheduleErrors(validationErrors);
        return; // Don't show modal for validation errors
      }

      setConfirmModal({
        isOpen: true,
        title: 'Error',
        message: errorMessage,
        type: 'danger',
        onConfirm: null
      });
    }
  };

  const handleDeleteSchedule = async (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Schedule',
      message: 'Are you sure you want to delete this schedule?',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Failed to delete schedule');
          setConfirmModal({
            isOpen: true,
            title: 'Success',
            message: 'Schedule deleted successfully!',
            type: 'success',
            onConfirm: null
          });
          loadData();
        } catch (e) {
          setConfirmModal({
            isOpen: true,
            title: 'Error',
            message: e.message,
            type: 'danger',
            onConfirm: null
          });
        }
      }
    });
  };

  const startEditSchedule = (schedule) => {
    setEditingItem(schedule);
    setScheduleForm({
      courseId: schedule.courseId || '',
      courseTitle: schedule.courseTitle || '',
      trainingDate: schedule.trainingDate ? schedule.trainingDate.split('T')[0] : '',
      capacity: schedule.capacity || ''
    });
    setActiveSubSection('schedule-form');
  };

  // --- Assessment CRUD ---
  const handleSaveAssessment = async () => {
    // Frontend validation for unique Assessment ID
    if (!editingItem) {
      const duplicate = assessments.find(a => a.assessmentId === assessmentForm.assessmentId);
      if (duplicate) {
        setConfirmModal({
          isOpen: true,
          title: 'Duplicate Entry',
          message: 'Assessment ID already exists!',
          type: 'danger',
          onConfirm: null
        });
        return;
      }
    }

    try {
      const url = editingItem ? `/api/assessments/${editingItem._id}` : '/api/assessments';
      const method = editingItem ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessmentForm)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save assessment');
      }

      setConfirmModal({
        isOpen: true,
        title: 'Success',
        message: editingItem ? 'Assessment updated successfully!' : 'Assessment added successfully!',
        type: 'success',
        onConfirm: null
      });
      setEditingItem(null);
      setAssessmentForm({ assessmentId: '', title: '', fee: '', capacity: '', status: 'Active' });
      setActiveSubSection('');
      loadData();
    } catch (e) {
      setConfirmModal({
        isOpen: true,
        title: 'Error',
        message: e.message,
        type: 'danger',
        onConfirm: null
      });
    }
  };

  const handleDeleteAssessment = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Assessment',
      message: 'Are you sure you want to delete this assessment? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/assessments/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Failed to delete assessment');
          loadData();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (e) {
          alert(e.message);
        }
      }
    });
  };

  const startEditAssessment = (assessment) => {
    setEditingItem(assessment);
    setAssessmentForm({
      assessmentId: assessment.assessmentId || '',
      title: assessment.title || '',
      fee: assessment.fee || '',
      capacity: assessment.capacity || '',
      status: assessment.status || 'Active'
    });
    setActiveSubSection('assessment-form');
  };



  const handleUpdateAppStatus = (id, status) => {
    setConfirmModal({
      isOpen: true,
      title: 'Update Application Status',
      message: `Are you sure you want to mark this application as ${status}?`,
      type: status === 'Rejected' ? 'danger' : 'success',
      onConfirm: () => executeUpdateAppStatus(id, status)
    });
  };

  const executeUpdateAppStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/assessment-applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      
      const updated = await res.json();
      setAssessmentApps(assessmentApps.map(a => a._id === id ? updated : a));
      if (viewingApp && viewingApp._id === id) {
        setViewingApp(updated);
      }
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteAssessmentApp = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Application',
      message: 'Are you sure you want to delete this application? This action cannot be undone.',
      type: 'danger',
      onConfirm: () => executeDeleteAssessmentApp(id)
    });
  };

  const executeDeleteAssessmentApp = async (id) => {
    try {
      const res = await fetch(`/api/assessment-applications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete application');
      
      setAssessmentApps(assessmentApps.filter(a => a._id !== id));
      if (viewingApp && viewingApp._id === id) {
        setViewingApp(null);
      }
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      setConfirmModal({
        isOpen: true,
        title: 'No Unread Notifications',
        message: 'All notifications are already marked as read.',
        type: 'info',
        onConfirm: null
      });
      return;
    }

    try {
      await fetch('/api/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete notification');
      setNotifications(prev => prev.filter(n => n._id !== id));
      setUnreadCount(prev => notifications.find(n => n._id === id && !n.isRead) ? Math.max(0, prev - 1) : prev);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleDeleteAllNotifications = () => {
    if (notifications.length === 0) {
      setConfirmModal({
        isOpen: true,
        title: 'No Notifications',
        message: 'There are no notifications to delete.',
        type: 'info',
        onConfirm: null // Just closes the modal
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Delete All Notifications',
      message: 'Are you sure you want to delete all notifications? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/notifications/delete-all', { method: 'DELETE' });
          if (!res.ok) throw new Error('Failed to delete all notifications');
          setNotifications([]);
          setUnreadCount(0);
        } catch (error) {
          console.error('Failed to delete all notifications:', error);
        }
      }
    });
  };

  const handleProfileImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setProfileErrors({});
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: profileForm.username || undefined,
          password: profileForm.password || undefined,
          image: profileForm.image || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      
      setUserProfile(prev => ({
        ...prev,
        username: data.username,
        image: data.image
      }));
      
      setProfileForm({ username: '', password: '', image: '' });
      setShowProfileModal(false);
      
      setConfirmModal({
        isOpen: true,
        title: 'Profile Updated',
        message: 'Your admin profile has been successfully updated.',
        type: 'success',
        onConfirm: null
      });
    } catch (error) {
      let msg = error.message;
      const newErrors = {};

      // Handle Mongoose Validation Errors
      if (msg.includes('Validation failed')) {
        const parts = msg.split('Validation failed: ');
        if (parts.length > 1) {
           const errorList = parts[1].split(', ');
           errorList.forEach(err => {
               const [field, ...messageParts] = err.split(': ');
               if (field && messageParts.length > 0) {
                   newErrors[field.trim()] = messageParts.join(': ').trim();
               }
           });
        }
      } 
      // Handle Duplicate Key Errors
      else if (msg.includes('E11000') || msg.includes('duplicate key')) {
          if (msg.includes('username')) {
              newErrors.username = 'Username is already taken';
          } else {
              newErrors.general = 'Duplicate entry found';
          }
      }
      // Fallback/Generic Errors
      else {
          if (msg.toLowerCase().includes('password')) newErrors.password = msg;
          else if (msg.toLowerCase().includes('username')) newErrors.username = msg;
          else newErrors.general = msg;
      }
      
      // If parsing failed to assign specific fields but we have a message, put it in general or best guess
      if (Object.keys(newErrors).length === 0) {
          newErrors.general = msg;
      }

      setProfileErrors(newErrors);
    }
  };

  // --- Renderers ---
  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Notifications</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleDeleteAllNotifications}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete All
          </button>
          <button 
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark All as Read
          </button>
        </div>
      </div>

      <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        {notifications.length === 0 ? (
          <div className={`p-10 text-center flex flex-col items-center gap-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <Bell className="w-12 h-12 opacity-20" />
            <p>No notifications found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map((notification) => (
              <div 
                key={notification._id} 
                className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                  !notification.isRead 
                    ? (darkMode ? 'bg-gray-700/30' : 'bg-blue-50/50') 
                    : (darkMode ? 'hover:bg-gray-700/20' : 'hover:bg-gray-50')
                }`}
              >
                <div className="flex gap-4">
                  <div className={`mt-1 p-2 rounded-full ${
                    notification.type === 'registration' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                    notification.type === 'assessment' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {notification.type === 'registration' ? <UserPlus className="w-5 h-5" /> :
                     notification.type === 'assessment' ? <Edit className="w-5 h-5" /> :
                     <Bell className="w-5 h-5" />}
                  </div>
                  <div className="space-y-1">
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {notification.message}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.isRead && (
                    <button 
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full dark:hover:bg-blue-900/20 transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteNotification(notification._id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full dark:hover:bg-red-900/20 transition-colors"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const filteredStudents = students.filter(student => {
    const activeReg = registrations.find(r => (r.studentId?._id || r.studentId) === student._id && r.status !== 'cancelled');
    const schedId = activeReg?.scheduleId?._id || activeReg?.scheduleId;
    
    // Filter by Search Term
    const matchesSearch = (student.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (student.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (student.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by Course
    const matchesCourse = courseFilter ? schedId === courseFilter : true;

    return matchesSearch && matchesCourse;
  });

  const getPageNumbers = () => {
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const pageNumbers = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (studentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (studentPage >= totalPages - 3) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = studentPage - 1; i <= studentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  // Helper to create PDF Doc for a student with ALL information
  const createStudentPDFDoc = (student) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Student Record', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 30, { align: 'center' });

    // Personal Information
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Personal Information', 14, 45);

    const personalData = [
      ['Full Name', `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`],
      ['Email', student.email],
      ['Mobile No.', student.mobileNo || '-'],
      ['Telephone No.', student.telephoneNo || '-'],
      ['Date of Birth', student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '-'],
      ['Age', student.age || '-'],
      ['Sex', student.sex || '-'],
      ['Civil Status', student.civilStatus || '-'],
      ['Nationality', student.nationality || '-'],
      ['Religion', student.religion || '-'],
      ['Address', student.completeAddress || '-']
    ];

    autoTable(doc, {
      startY: 50,
      head: [],
      body: personalData,
      theme: 'grid',
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      styles: { fontSize: 10, cellPadding: 3 }
    });

    // Education & Employment
    let finalY = doc.lastAutoTable.finalY + 15;
    
    // Check if we need a new page
    if (finalY > 250) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFontSize(14);
    doc.text('Education & Employment', 14, finalY);

    const educationEmploymentData = [
      ['College/University', student.educationCollege || '-'],
      ['Course', student.educationCourse || '-'],
      ['Company', student.employmentCompany || '-'],
      ['Position', student.employmentPosition || '-'],
      ['Department', student.employmentDepartment || '-'],
      ['Employment Status', student.employmentStatus || '-'],
      ['Date Hired', student.employmentDate ? new Date(student.employmentDate).toLocaleDateString() : '-'],
      ['Years of Experience', student.yearsOfExperience || '-'],
      ['References', student.employmentReferences || '-']
    ];

    autoTable(doc, {
      startY: finalY + 5,
      head: [],
      body: educationEmploymentData,
      theme: 'grid',
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      styles: { fontSize: 10, cellPadding: 3 }
    });

    // OJT & Specialization
    finalY = doc.lastAutoTable.finalY + 15;
    
    // Check if we need a new page
    if (finalY > 250) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFontSize(14);
    doc.text('OJT & Specialization', 14, finalY);

    const otherData = [
      ['OJT Industry', student.ojtIndustry || '-'],
      ['OJT Company', student.ojtCompany || '-'],
      ['OJT Address', student.ojtAddress || '-'],
      ['Area of Specialization', student.areaOfSpecialization || '-'],
      ['Other Specification', student.otherSpecification || '-']
    ];

    autoTable(doc, {
      startY: finalY + 5,
      head: [],
      body: otherData,
      theme: 'grid',
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      styles: { fontSize: 10, cellPadding: 3 }
    });

    // Registered Courses
    finalY = doc.lastAutoTable.finalY + 15;
    
    if (finalY > 250) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFontSize(14);
    doc.text('Registered Courses', 14, finalY);

    const studentRegs = registrations.filter(r => (r.studentId?._id || r.studentId) === student._id && r.status !== 'cancelled');
    const regData = studentRegs.map(reg => {
      const schedId = reg.scheduleId?._id || reg.scheduleId;
      const schedule = schedules.find(s => s._id === schedId);
      return [
        schedule ? (schedule.courseTitle || schedule.title) : 'Unknown Course',
        schedule ? new Date(schedule.trainingDate).toLocaleDateString() : '-',
        reg.status || 'Active'
      ];
    });

    if (regData.length > 0) {
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Course Title', 'Training Date', 'Status']],
        body: regData,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [66, 139, 202] }
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('No registered courses found.', 14, finalY + 10);
    }
    
    return doc;
  };

  const handleExportStudents = async () => {
    if (filteredStudents.length === 0) {
      alert('No students to export.');
      return;
    }

    // Determine Folder Name based on Course Filter
    let folderName = 'All_Students_Record';
    if (courseFilter) {
       const selectedSchedule = schedules.find(s => s._id === courseFilter);
       if (selectedSchedule) {
           folderName = (selectedSchedule.courseTitle || selectedSchedule.title || 'Course_Record').trim();
       }
    }
    // Sanitize folder name
    folderName = folderName.replace(/[^a-z0-9 _-]/gi, '_');

    // Try File System Access API (Folder Picker)
    if ('showDirectoryPicker' in window) {
      try {
        // User selects the ROOT destination
        const rootHandle = await window.showDirectoryPicker();
        
        // Create the specific COURSE folder inside the selected root
        const courseDirHandle = await rootHandle.getDirectoryHandle(folderName, { create: true });
        
        for (const student of filteredStudents) {
          const doc = createStudentPDFDoc(student);
          const blob = doc.output('blob');
          // Sanitize name but ensure .pdf extension remains
          const baseName = `${student.lastName}_${student.firstName}_Profile`.replace(/[^a-z0-9._-]/gi, '_');
          const fileName = `${baseName}.pdf`;
          
          const fileHandle = await courseDirHandle.getFileHandle(fileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        }
        
        alert(`Export complete! Created folder "${folderName}" with student records.`);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // User cancelled
        console.error('Folder export failed, falling back to ZIP:', err);
        // Fallthrough to ZIP
      }
    }

    // Fallback: Generate ZIP
    const zip = new JSZip();
    // Create a folder inside the zip
    const folder = zip.folder(folderName);

    filteredStudents.forEach(student => {
      const doc = createStudentPDFDoc(student);
      const baseName = `${student.lastName}_${student.firstName}_Profile`.replace(/[^a-z0-9._-]/gi, '_');
      const fileName = `${baseName}.pdf`;
      folder.file(fileName, doc.output('blob'));
    });

    zip.generateAsync({ type: 'blob' }).then(content => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${folderName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  // --- START OF APPLICATION SECTION ---
  const renderAssessmentApps = () => {
    const uniqueAssessments = [...new Set(assessmentApps.map(app => app.assessmentTitle))].filter(Boolean);

    const filteredApps = assessmentApps
      .filter(app => {
        const matchesAssessment = assessmentAppFilter ? app.assessmentTitle === assessmentAppFilter : true;
        const matchesStatus = assessmentAppStatusFilter ? app.status === assessmentAppStatusFilter : true;
        
        const searchLower = assessmentAppSearchTerm.toLowerCase();
        const matchesSearch = 
          (app.name?.firstname || '').toLowerCase().includes(searchLower) ||
          (app.name?.surname || '').toLowerCase().includes(searchLower) ||
          (app.schoolCompany || '').toLowerCase().includes(searchLower) ||
          (app.assessmentTitle || '').toLowerCase().includes(searchLower);

        return matchesAssessment && matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        const statusOrder = { 'Pending': 1, 'Approved': 2, 'Rejected': 3 };
        return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
      });

    return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Assessment Applications</h2>
        
        {!viewingApp && (
          <div className={`p-5 rounded-2xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Search Bar */}
              <div className="relative w-full md:w-96 group">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-blue-500 transition-colors w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                <input 
                  type="text" 
                  placeholder="Search applicant, school, or assessment..." 
                  className={`w-full pl-10 pr-4 py-3 border-transparent border rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 outline-none text-sm font-medium ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400 focus:bg-gray-600' : 'bg-gray-50 text-gray-700 placeholder-gray-400 focus:bg-white'}`}
                  value={assessmentAppSearchTerm}
                  onChange={(e) => setAssessmentAppSearchTerm(e.target.value)}
                />
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="relative group">
                  <select
                    value={assessmentAppFilter}
                    onChange={(e) => setAssessmentAppFilter(e.target.value)}
                    className={`w-full md:w-56 appearance-none border-transparent border focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-4 pr-10 text-sm font-medium cursor-pointer outline-none transition-all duration-200 ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600 focus:bg-gray-600' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 focus:bg-white'}`}
                  >
                    <option value="">All Assessments</option>
                    {uniqueAssessments.map((title, index) => (
                      <option key={index} value={title}>{title}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
                </div>

                <div className="relative group">
                  <select
                    value={assessmentAppStatusFilter}
                    onChange={(e) => setAssessmentAppStatusFilter(e.target.value)}
                    className={`w-full md:w-48 appearance-none border-transparent border focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-4 pr-10 text-sm font-medium cursor-pointer outline-none transition-all duration-200 ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600 focus:bg-gray-600' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 focus:bg-white'}`}
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {viewingApp ? (
        <div className={`rounded-lg shadow p-6 max-w-4xl mx-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`flex justify-between items-center mb-6 border-b pb-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Application Details</h3>
            <button onClick={() => setViewingApp(null)} className={`hover:text-gray-700 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`space-y-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <h4 className="font-semibold text-blue-600">Applicant Info</h4>
              <p><strong className={darkMode ? 'text-gray-200' : 'text-gray-900'}>Name:</strong> {viewingApp.name?.surname}, {viewingApp.name?.firstname} {viewingApp.name?.middleInitial}</p>
              <p><strong className={darkMode ? 'text-gray-200' : 'text-gray-900'}>School/Company:</strong> {viewingApp.schoolCompany}</p>
              <p><strong className={darkMode ? 'text-gray-200' : 'text-gray-900'}>Assessment:</strong> {viewingApp.assessmentTitle}</p>
              <p><strong className={darkMode ? 'text-gray-200' : 'text-gray-900'}>Contact:</strong> {viewingApp.contact?.mobile} / {viewingApp.contact?.email}</p>
              <p><strong className={darkMode ? 'text-gray-200' : 'text-gray-900'}>Address:</strong> {viewingApp.address}</p>
              
              <h4 className="font-semibold text-blue-600 mt-4">Status</h4>
              <span className={`px-2 py-1 rounded text-sm ${
                viewingApp.status === 'Approved' ? 'bg-green-100 text-green-800' :
                viewingApp.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>{viewingApp.status}</span>
            </div>

            <div className={`space-y-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <h4 className="font-semibold text-blue-600">Payment Info</h4>
              <p><strong className={darkMode ? 'text-gray-200' : 'text-gray-900'}>Method:</strong> {viewingApp.payment?.isOnline ? 'Online (GCash)' : 'On-site'}</p>
              {viewingApp.payment?.isOnline && (
                <>
                  <p><strong className={darkMode ? 'text-gray-200' : 'text-gray-900'}>Sender:</strong> {viewingApp.payment?.senderGcashNumber}</p>
                  <p><strong className={darkMode ? 'text-gray-200' : 'text-gray-900'}>Ref No:</strong> {viewingApp.payment?.referenceNumber}</p>
                  {viewingApp.payment?.proofOfPayment && (
                    <div className="mt-2">
                      <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Proof of Payment (Click to zoom):</p>
                      <img 
                        src={viewingApp.payment.proofOfPayment} 
                        alt="Proof" 
                        className={`max-w-full h-48 object-contain border rounded cursor-zoom-in hover:opacity-90 transition-opacity ${darkMode ? 'border-gray-600' : 'border-gray-200'}`} 
                        onClick={() => setZoomedImage(viewingApp.payment.proofOfPayment)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className={`flex justify-between items-center mt-8 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button 
              onClick={() => handleDeleteAssessmentApp(viewingApp._id)}
              className={`px-4 py-2 border rounded flex items-center gap-2 transition-colors ${darkMode ? 'border-gray-600 text-gray-400 hover:bg-red-900/20 hover:text-red-400 hover:border-red-400' : 'border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-600'}`}
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>

            <div className="flex gap-4">
              {viewingApp.status === 'Pending' && (
                <>
                  <button 
                    onClick={() => handleUpdateAppStatus(viewingApp._id, 'Rejected')}
                    className="px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleUpdateAppStatus(viewingApp._id, 'Approved')}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Approve Application
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={`rounded-lg shadow overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <table className="w-full">
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Date</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Applicant</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Assessment</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Status</th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredApps.length === 0 ? (
                <tr><td colSpan="5" className={`px-6 py-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No applications found.</td></tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app._id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td className={`px-6 py-4 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{app.name?.surname}, {app.name?.firstname}</td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{app.assessmentTitle}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        app.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        app.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => setViewingApp(app)}
                          className={`flex items-center ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'}`}
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteAssessmentApp(app._id)}
                          className={`flex items-center ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'}`}
                          title="Delete Application"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
    );
  };

  // --- START OF DASHBOARD SECTION ---
  const renderDashboard = () => ( 
    <div className="space-y-6"> 
      <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Dashboard Overview</h2> 
      {loading ? <p className={darkMode ? 'text-white' : 'text-gray-600'}>Loading...</p> : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> 
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg"> 
              <div className="flex items-center justify-between"> 
                <div> 
                  <p className="text-blue-100 text-sm">Total Schedules</p> 
                  <p className="text-3xl font-bold mt-2">{schedules.length}</p> 
                </div> 
                <Calendar className="w-12 h-12 text-blue-200" /> 
              </div> 
            </div> 
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg"> 
              <div className="flex items-center justify-between"> 
                <div> 
                  <p className="text-green-100 text-sm">Total Students</p> 
                  <p className="text-3xl font-bold mt-2">{students.length}</p> 
                </div> 
                <UserPlus className="w-12 h-12 text-green-200" /> 
              </div> 
            </div> 
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg"> 
              <div className="flex items-center justify-between"> 
                <div> 
                  <p className="text-purple-100 text-sm">Total Assessments</p> 
                  <p className="text-3xl font-bold mt-2">{assessments.length}</p> 
                </div> 
                <Award className="w-12 h-12 text-purple-200" /> 
              </div> 
            </div> 
          </div>
          
          <div className={`rounded-lg shadow p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Students</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Name</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Email</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Training Course</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Date</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                  {students.slice(0, 5).map((student) => {
                    // Find active registration for this student
                    const activeReg = registrations.find(r => (r.studentId?._id || r.studentId) === student._id && r.status !== 'cancelled');
                    const schedId = activeReg?.scheduleId?._id || activeReg?.scheduleId;
                    const schedule = schedules.find(s => s._id === schedId);
                    const courseTitle = schedule?.courseTitle || schedule?.title || 'No course selected';
                      
                    return (
                      <tr key={student._id}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{student.firstName} {student.lastName}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{student.email}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{courseTitle}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(student.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div> 
  );

  const renderStudents = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Student Management</h2>
        {!activeSubSection && (
          <button 
            onClick={() => {
              setEditingItem(null);
              setStudentForm({
                firstName: '', lastName: '', middleName: '', email: '', mobileNo: '', telephoneNo: '',
                dateOfBirth: '', age: '', sex: '', civilStatus: '', nationality: '', religion: '',
                completeAddress: '', educationCollege: '', educationCourse: '',
                employmentCompany: '', employmentPosition: '', employmentDepartment: '',
                employmentStatus: '', employmentDate: '', yearsOfExperience: '', employmentReferences: '',
                ojtIndustry: '', ojtCompany: '', ojtAddress: '',
                areaOfSpecialization: '', otherSpecification: ''
              });
              setActiveSubSection('student-form');
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        )}
      </div>

      {activeSubSection === 'view-student' && viewingStudent ? (
        <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          {/* Top Bar with Actions */}
          <div className={`flex justify-between items-center px-6 py-4 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
               <User className="w-5 h-5 text-blue-500" /> Student Profile
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => generateStudentPDF(viewingStudent)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                <Download className="w-4 h-4" /> Export PDF
              </button>
              <button 
                onClick={() => { setActiveSubSection(''); setViewingStudent(null); }} 
                className={`p-1.5 rounded-lg hover:bg-gray-200/50 transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Left Column: Profile Card */}
              <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                <div className={`p-6 rounded-2xl shadow-sm border text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                   <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg">
                      {viewingStudent.firstName?.[0]}{viewingStudent.lastName?.[0]}
                   </div>
                   <h2 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                     {viewingStudent.firstName} {viewingStudent.lastName}
                   </h2>
                   <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                     {viewingStudent.email}
                   </p>
                   
                   <div className="flex justify-center gap-2 mb-6">
                      <button 
                        onClick={() => startEditStudent(viewingStudent)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-blue-500/20 shadow-lg"
                      >
                        Edit Profile
                      </button>
                   </div>

                   <div className={`space-y-3 text-left pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{viewingStudent.mobileNo || 'No mobile'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{viewingStudent.completeAddress || 'No address'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                         <Calendar className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                         <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                           {viewingStudent.dateOfBirth ? new Date(viewingStudent.dateOfBirth).toLocaleDateString() : 'No DOB'} ({viewingStudent.age} yrs)
                         </span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Right Column: Detailed Info */}
              <div className="flex-1 space-y-6">
                
                {/* Personal & Info Grid */}
                <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                   <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      General Information
                   </h4>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {[
                        { label: 'Sex', value: viewingStudent.sex },
                        { label: 'Civil Status', value: viewingStudent.civilStatus },
                        { label: 'Nationality', value: viewingStudent.nationality },
                        { label: 'Religion', value: viewingStudent.religion },
                        { label: 'Registered', value: new Date(viewingStudent.createdAt).toLocaleDateString() }
                      ].map((item, i) => (
                        <div key={i}>
                          <span className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{item.label}</span>
                          <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{item.value || '-'}</span>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Education & Employment Split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <h4 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-green-600">
                         <GraduationCap className="w-4 h-4" /> Education
                      </h4>
                      <div className="space-y-4">
                         <div>
                            <span className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>College / University</span>
                            <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{viewingStudent.educationCollege || '-'}</p>
                         </div>
                         <div>
                            <span className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Course</span>
                            <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{viewingStudent.educationCourse || '-'}</p>
                         </div>
                      </div>
                   </div>

                   <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <h4 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-purple-600">
                         <Briefcase className="w-4 h-4" /> Employment
                      </h4>
                      <div className="space-y-4">
                         <div>
                            <span className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Company & Position</span>
                            <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{viewingStudent.employmentCompany || '-'} • {viewingStudent.employmentPosition || '-'}</p>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <span className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Status</span>
                               <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{viewingStudent.employmentStatus || '-'}</p>
                            </div>
                            <div>
                               <span className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Experience</span>
                               <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{viewingStudent.yearsOfExperience || '0'} Year/s</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Training History */}
                <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <h4 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-teal-600">
                     <BookOpen className="w-4 h-4" /> Training History
                  </h4>
                  <div className="space-y-3">
                    {registrations
                      .filter(r => (r.studentId?._id || r.studentId) === viewingStudent._id)
                      .map(reg => {
                        const schedId = reg.scheduleId?._id || reg.scheduleId;
                        const schedule = schedules.find(s => s._id === schedId);
                        return (
                          <div key={reg._id} className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${darkMode ? 'bg-gray-700 border-teal-500' : 'bg-teal-50 border-teal-500'}`}>
                            <div>
                              <p className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{schedule ? schedule.courseTitle || schedule.title : 'Unknown Course'}</p>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {schedule ? new Date(schedule.trainingDate).toLocaleDateString() : '-'}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                              reg.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                              reg.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {reg.status || 'Active'}
                            </span>
                          </div>
                        );
                      })}
                    {registrations.filter(r => (r.studentId?._id || r.studentId) === viewingStudent._id).length === 0 && (
                      <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No training history found.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      ) : activeSubSection === 'student-form' ? (
        <div className={`rounded-xl shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`flex justify-between items-center p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {editingItem ? <Edit className="w-5 h-5 text-blue-500" /> : <Plus className="w-5 h-5 text-green-500" />}
              {editingItem ? 'Edit Student' : 'New Student Registration'}
            </h3>
            <button onClick={() => setActiveSubSection('')} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-8 space-y-8">
            {/* Section: Personal Info */}
            <div className="space-y-4">
              <h4 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-blue-400' : 'text-blue-600'} flex items-center gap-2`}>
                <User className="w-4 h-4" /> Personal Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'First Name', field: 'firstName', type: 'text', icon: User },
                  { label: 'Middle Name', field: 'middleName', type: 'text', icon: User },
                  { label: 'Last Name', field: 'lastName', type: 'text', icon: User },
                  { label: 'Email Address', field: 'email', type: 'email', icon: Mail },
                  { label: 'Mobile Number', field: 'mobileNo', type: 'text', icon: Phone },
                  { label: 'Telephone No.', field: 'telephoneNo', type: 'text', icon: Phone },
                ].map((item, idx) => (
                  <div key={item.field} className="relative group">
                    <label className={`block text-xs font-bold mb-1.5 ml-1 ${studentFormErrors[item.field] ? 'text-red-500' : (darkMode ? 'text-gray-400' : 'text-gray-600')}`}>
                      {item.label} {studentFormErrors[item.field] && `(${studentFormErrors[item.field]})`}
                    </label>
                    <div className="relative">
                      <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${studentFormErrors[item.field] ? 'text-red-400' : (darkMode ? 'text-gray-500' : 'text-gray-400')}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <input 
                    type={item.type} 
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg transition-all focus:ring-2 ${
                      studentFormErrors[item.field] 
                        ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-red-50 dark:bg-red-900/10' 
                        : `focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'}`
                    }`} 
                    value={studentForm[item.field]} 
                    onChange={(e) => {
                      if (item.field === 'mobileNo') {
                        const val = e.target.value;
                        if (val === '' || /^\d+$/.test(val)) {
                          if (val.length <= 11) {
                            setStudentForm({...studentForm, [item.field]: val});
                            // Clear error on change
                            if (studentFormErrors[item.field]) {
                              setStudentFormErrors({...studentFormErrors, [item.field]: null});
                            }
                          }
                        }
                      } else {
                        setStudentForm({...studentForm, [item.field]: e.target.value});
                        // Clear error on change
                        if (studentFormErrors[item.field]) {
                          setStudentFormErrors({...studentFormErrors, [item.field]: null});
                        }
                      }
                    }}
                    placeholder={item.label}
                    maxLength={item.field === 'mobileNo' ? 11 : undefined}
                  />
                    </div>
                  </div>
                ))}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Date of Birth</label>
                    <input 
                      type="date"
                      className={`w-full px-4 py-2.5 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} 
                      value={studentForm.dateOfBirth} 
                      onChange={(e) => setStudentForm({...studentForm, dateOfBirth: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ml-1 ${studentFormErrors.age ? 'text-red-500' : (darkMode ? 'text-gray-400' : 'text-gray-600')}`}>
                      Age {studentFormErrors.age && `(${studentFormErrors.age})`}
                    </label>
                    <input 
                      type="number"
                      min="1"
                      className={`w-full px-4 py-2.5 border rounded-lg ${
                        studentFormErrors.age 
                          ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-red-50 dark:bg-red-900/10' 
                          : `${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`
                      }`} 
                      value={studentForm.age} 
                      onKeyDown={(e) => {
                        if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d+$/.test(val)) {
                          setStudentForm({...studentForm, age: val});
                          if (studentFormErrors.age) {
                            setStudentFormErrors({...studentFormErrors, age: null});
                          }
                        }
                      }} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sex</label>
                    <select 
                      className={`w-full px-4 py-2.5 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} 
                      value={studentForm.sex} 
                      onChange={(e) => setStudentForm({...studentForm, sex: e.target.value})}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Civil Status</label>
                    <select 
                      className={`w-full px-4 py-2.5 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} 
                      value={studentForm.civilStatus} 
                      onChange={(e) => setStudentForm({...studentForm, civilStatus: e.target.value})}
                    >
                      <option value="">Select</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                </div>

                <div>
                   <label className={`block text-xs font-bold mb-1.5 ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Nationality</label>
                   <input 
                     type="text"
                     className={`w-full px-4 py-2.5 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} 
                     value={studentForm.nationality} 
                     onChange={(e) => setStudentForm({...studentForm, nationality: e.target.value})} 
                   />
                </div>

                <div className="col-span-1 md:col-span-3">
                  <label className={`block text-xs font-bold mb-1.5 ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Complete Address</label>
                  <div className="relative">
                    <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input 
                      type="text" 
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} 
                      value={studentForm.completeAddress} 
                      onChange={(e) => setStudentForm({...studentForm, completeAddress: e.target.value})} 
                      placeholder="House No., Street, Barangay, City, Province"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Education & Employment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <h4 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-green-400' : 'text-green-600'} flex items-center gap-2`}>
                    <GraduationCap className="w-4 h-4" /> Education
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>College / University</label>
                      <input 
                        type="text" 
                        className={`w-full px-4 py-2.5 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} 
                        value={studentForm.educationCollege} 
                        onChange={(e) => setStudentForm({...studentForm, educationCollege: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Course / Degree</label>
                      <input 
                        type="text" 
                        className={`w-full px-4 py-2.5 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} 
                        value={studentForm.educationCourse} 
                        onChange={(e) => setStudentForm({...studentForm, educationCourse: e.target.value})} 
                      />
                    </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-purple-400' : 'text-purple-600'} flex items-center gap-2`}>
                    <Briefcase className="w-4 h-4" /> Current Employment
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className={`block text-xs font-bold mb-1.5 ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Company Name</label>
                      <input 
                        type="text" 
                        className={`w-full px-4 py-2.5 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} 
                        value={studentForm.employmentCompany} 
                        onChange={(e) => setStudentForm({...studentForm, employmentCompany: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Position</label>
                      <input 
                        type="text" 
                        className={`w-full px-4 py-2.5 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} 
                        value={studentForm.employmentPosition} 
                        onChange={(e) => setStudentForm({...studentForm, employmentPosition: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status</label>
                      <select 
                        className={`w-full px-4 py-2.5 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} 
                        value={studentForm.employmentStatus} 
                        onChange={(e) => setStudentForm({...studentForm, employmentStatus: e.target.value})}
                      >
                        <option value="">Select Status</option>
                        <option value="Regular">Regular</option>
                        <option value="Contractual">Contractual</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Self-employed">Self-employed</option>
                      </select>
                    </div>
                  </div>
               </div>
            </div>

            {/* Section: OJT & Others */}
            <div className="space-y-4">
              <h4 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-orange-400' : 'text-orange-600'} flex items-center gap-2`}>
                <BookOpen className="w-4 h-4" /> OJT & Specialization
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                   <label className={`block text-xs font-bold mb-1.5 ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>OJT Industry</label>
                   <input 
                     type="text" 
                     className={`w-full px-4 py-2.5 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} 
                     value={studentForm.ojtIndustry} 
                     onChange={(e) => setStudentForm({...studentForm, ojtIndustry: e.target.value})} 
                   />
                </div>
                <div>
                   <label className={`block text-xs font-bold mb-1.5 ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Company / Institution</label>
                   <input 
                     type="text" 
                     className={`w-full px-4 py-2.5 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} 
                     value={studentForm.ojtCompany} 
                     onChange={(e) => setStudentForm({...studentForm, ojtCompany: e.target.value})} 
                   />
                </div>
                <div>
                   <label className={`block text-xs font-bold mb-1.5 ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Area of Specialization</label>
                   <input 
                     type="text" 
                     className={`w-full px-4 py-2.5 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} 
                     value={studentForm.areaOfSpecialization} 
                     onChange={(e) => setStudentForm({...studentForm, areaOfSpecialization: e.target.value})} 
                   />
                </div>
              </div>
            </div>

            {/* Training Course Selection */}
            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
               <div className="flex items-center justify-between">
                 <h4 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                   <Calendar className="w-4 h-4" /> Training Course
                 </h4>
               </div>
               
               {!isEditingTrainingCourse && studentForm.trainingScheduleId ? (
                 (() => {
                   const schedule = schedules.find(s => s._id === studentForm.trainingScheduleId);
                   const activeReg = editingItem ? registrations.find(r => 
                     (r.studentId?._id || r.studentId) === editingItem._id && 
                     (r.scheduleId?._id || r.scheduleId) === studentForm.trainingScheduleId &&
                     r.status !== 'cancelled'
                   ) : null;
                   
                   return (
                     <div className={`group relative p-3 rounded-lg border transition-all ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md'}`}>
                       <div className="flex justify-between items-start">
                         <div>
                           <p className={`font-semibold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                             {schedule ? (schedule.courseTitle || schedule.title) : 'Unknown Course'}
                           </p>
                           <div className={`text-xs mt-1 flex flex-wrap gap-x-4 gap-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                             <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {schedule ? new Date(schedule.trainingDate).toLocaleDateString() : '-'}</span>
                             {activeReg && <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Reg: {new Date(activeReg.createdAt).toLocaleDateString()}</span>}
                           </div>
                         </div>
                         <div className="flex items-center gap-2">
                            {/* Status Badge */}
                           <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                             activeReg 
                               ? (activeReg.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400')
                               : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                           }`}>
                             {activeReg ? (activeReg.status || 'Active') : 'Pending'}
                           </span>
                           
                           {/* Edit Button */}
                           <button 
                             onClick={() => setIsEditingTrainingCourse(true)}
                             className={`p-1.5 rounded-md transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-blue-600'}`}
                             title="Change Course"
                           >
                             <Edit className="w-3.5 h-3.5" />
                           </button>
                         </div>
                       </div>
                     </div>
                   );
                 })()
               ) : (
                 <div className={`relative`}>
                    <select 
                      className={`w-full appearance-none pl-4 pr-10 py-2.5 rounded-lg text-sm font-medium border transition-all cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-500 hover:border-gray-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 hover:bg-white hover:border-blue-300'
                      }`}
                      value={studentForm.trainingScheduleId || ''} 
                      onChange={(e) => {
                        setStudentForm({...studentForm, trainingScheduleId: e.target.value});
                        if(e.target.value) setIsEditingTrainingCourse(false); // Auto-close on selection
                      }}
                    >
                      <option value="">Select a training course...</option>
                      {schedules.map(s => {
                        const isFull = (s.registered || 0) >= (s.capacity || 0);
                        return (
                          <option key={s._id} value={s._id} disabled={isFull} className={isFull ? 'text-gray-400 bg-gray-100' : ''}>
                            {s.courseTitle || s.title} — {new Date(s.trainingDate).toLocaleDateString()} {isFull ? '(Full)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    
                    {/* Custom Chevron */}
                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    
                    {/* Cancel Edit Button */}
                    {studentForm.trainingScheduleId && isEditingTrainingCourse && (
                       <button 
                         onClick={() => setIsEditingTrainingCourse(false)}
                         className="absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                         title="Cancel"
                       >
                         <X className="w-3.5 h-3.5" />
                       </button>
                    )}
                 </div>
               )}
            </div>

            {/* Registered Courses section removed as requested */}

            <div className={`flex justify-end gap-4 mt-8 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <button 
                onClick={() => setActiveSubSection('')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveStudent}
                className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-lg hover:shadow-xl transition-all"
              >
                {editingItem ? 'Update Student Record' : 'Register New Student'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`rounded-xl shadow-lg overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className={`p-5 border-b flex gap-4 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <div className="relative min-w-[240px]">
                <select
                  className={`w-full pl-4 pr-10 py-2.5 border rounded-lg appearance-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                >
                  <option value="">All Courses</option>
                  {schedules.map(schedule => (
                    <option key={schedule._id} value={schedule._id}>
                      {schedule.courseTitle || schedule.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>

              <button
                onClick={handleExportStudents}
                className={`px-4 py-2.5 rounded-lg border flex items-center gap-2 transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                title="Export Filtered Students (Folder/ZIP)"
              >
                <Download className="w-4 h-4" />
                <span className="hidden xl:inline">Export Students</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-gray-900/50' : 'bg-gray-50/80'}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Name</th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Mobile</th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Training Course</th>
                  <th className={`px-6 py-4 text-right text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-100'}`}>
                {filteredStudents.length > 0 ? (
                  filteredStudents
                    .slice((studentPage - 1) * itemsPerPage, studentPage * itemsPerPage)
                    .map((student) => {
                    const activeReg = registrations.find(r => (r.studentId?._id || r.studentId) === student._id && r.status !== 'cancelled');
                    const schedId = activeReg?.scheduleId?._id || activeReg?.scheduleId;
                    const schedule = schedules.find(s => s._id === schedId);
                    const courseTitle = schedule?.courseTitle || schedule?.title || 'No course selected';
                      
                    return (
                      <tr key={student._id} className={`transition-colors ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-blue-50/50'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{student.firstName} {student.lastName}</div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{student.email}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{student.mobileNo}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm`}>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            courseTitle !== 'No course selected' 
                              ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
                              : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')
                          }`}>
                            {courseTitle}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => {
                                setViewingStudent(student);
                                setActiveSubSection('view-student');
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-green-400 hover:bg-green-900/20' : 'text-green-600 hover:bg-green-50'}`}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => startEditStudent(student)}
                              className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-blue-400 hover:bg-blue-900/20' : 'text-blue-600 hover:bg-blue-50'}`}
                              title="Edit Student"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteStudent(student)}
                              className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'}`}
                              title="Delete Student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colspan="5" className={`px-6 py-12 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-lg font-medium">No students found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {filteredStudents.length > 0 && (
            <div className={`px-6 py-4 border-t flex items-center justify-between ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Showing <span className="font-medium">{Math.min((studentPage - 1) * itemsPerPage + 1, filteredStudents.length)}</span> to <span className="font-medium">{Math.min(studentPage * itemsPerPage, filteredStudents.length)}</span> of <span className="font-medium">{filteredStudents.length}</span> results
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                  disabled={studentPage === 1}
                  className={`p-2 rounded-lg border transition-colors ${
                    darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {getPageNumbers().map((number, index) => (
                  <button
                    key={index}
                    onClick={() => typeof number === 'number' && setStudentPage(number)}
                    disabled={number === '...'}
                    className={`min-w-[36px] h-9 flex items-center justify-center rounded-lg text-sm font-medium border transition-all ${
                      number === studentPage
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : number === '...'
                        ? `border-transparent cursor-default ${darkMode ? 'text-gray-400' : 'text-gray-500'}`
                        : darkMode
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {number}
                  </button>
                ))}

                <button
                  onClick={() => setStudentPage(p => Math.min(Math.ceil(filteredStudents.length / itemsPerPage), p + 1))}
                  disabled={studentPage >= Math.ceil(filteredStudents.length / itemsPerPage)}
                  className={`p-2 rounded-lg border transition-colors ${
                    darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // --- START OF SCHEDULE SECTION ---
  const renderSchedules = () => {
    const filteredSchedules = schedules.filter(schedule => 
      (schedule.courseTitle || '').toLowerCase().includes(scheduleSearchTerm.toLowerCase()) ||
      (schedule.courseId || '').toLowerCase().includes(scheduleSearchTerm.toLowerCase())
    );

    return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Schedule Management</h2>
        <button 
          onClick={() => {
            setEditingItem(null);
            setScheduleForm({ courseId: '', courseTitle: '', trainingDate: '', capacity: '' });
            setActiveSubSection('schedule-form');
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Add Schedule
        </button>
      </div>

      {/* Modal Form */}
      {/* Moved to root level for better z-index handling */}

      {/* Enrolled Students Modal */}
      {showScheduleStudentsModal && viewingScheduleStudents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Enrolled Students</h3>
                <p className="text-blue-100 text-sm mt-1">{viewingScheduleStudents.courseTitle} ({viewingScheduleStudents.courseId})</p>
              </div>
              <button onClick={() => setShowScheduleStudentsModal(false)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-0">
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="w-full">
                  <thead className={`sticky top-0 z-10 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Name</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Email</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Mobile</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Registration Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                    {students
                      .filter(student => {
                         // Check if there is an active registration for this student and schedule
                         return registrations.some(reg => 
                           (reg.scheduleId?._id === viewingScheduleStudents._id || reg.scheduleId === viewingScheduleStudents._id) &&
                           (reg.studentId?._id === student._id || reg.studentId === student._id) &&
                           reg.status !== 'cancelled'
                         );
                      })
                      .length > 0 ? (
                        students
                          .filter(student => {
                             return registrations.some(reg => 
                               (reg.scheduleId?._id === viewingScheduleStudents._id || reg.scheduleId === viewingScheduleStudents._id) &&
                               (reg.studentId?._id === student._id || reg.studentId === student._id) &&
                               reg.status !== 'cancelled'
                             );
                          })
                          .map((student) => (
                            <tr key={student._id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {student.firstName} {student.middleName} {student.lastName}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {student.email}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {student.mobileNo}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm`}>
                                {/* Find registration status if available */}
                                {(() => {
                                  const reg = registrations.find(r => 
                                    (r.studentId?._id === student._id || r.studentId === student._id) && 
                                    (r.scheduleId?._id === viewingScheduleStudents._id || r.scheduleId === viewingScheduleStudents._id)
                                  );
                                  
                                  if (!reg) return <span className="text-gray-400">Not Registered</span>;

                                  const currentStatus = reg.status || 'active';
                                  
                                  return (
                                    <div className="flex items-center gap-2">
                                      <select
                                        value={currentStatus}
                                        onChange={(e) => {
                                          const newStatus = e.target.value;
                                          setConfirmModal({
                                            isOpen: true,
                                            title: 'Update Registration Status',
                                            message: `Are you sure you want to change the status to ${newStatus}?`,
                                            type: 'warning',
                                            onConfirm: () => handleUpdateRegistrationStatus(reg._id, newStatus)
                                          });
                                        }}
                                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer outline-none transition-colors ${
                                          currentStatus === 'active' 
                                            ? (darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800')
                                            : currentStatus === 'pending'
                                            ? (darkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800')
                                            : (darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800')
                                        }`}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <option value="active" className={darkMode ? 'bg-gray-800' : 'bg-white'}>Active</option>
                                        <option value="pending" className={darkMode ? 'bg-gray-800' : 'bg-white'}>Pending</option>
                                        <option value="cancelled" className={darkMode ? 'bg-gray-800' : 'bg-white'}>Cancelled</option>
                                      </select>
                                    </div>
                                  );
                                })()}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="4" className={`px-6 py-8 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            No students enrolled in this schedule.
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`px-6 py-4 flex justify-end gap-3 border-t ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
              <button 
                onClick={() => setShowScheduleStudentsModal(false)}
                className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`rounded-lg shadow overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : ''}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search schedules by title or ID..." 
              className={`w-full pl-10 pr-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}`}
              value={scheduleSearchTerm}
              onChange={(e) => setScheduleSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>ID</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Title</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Date</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Capacity</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Registered</th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
              {filteredSchedules.map((schedule) => (
                <tr 
                  key={schedule._id} 
                  className={`cursor-pointer transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                  onClick={() => {
                    setViewingScheduleStudents(schedule);
                    setShowScheduleStudentsModal(true);
                  }}
                >
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{schedule.courseId}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {schedule.courseTitle}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {schedule.trainingDate ? new Date(schedule.trainingDate).toLocaleDateString() : '-'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{schedule.capacity}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {schedule.registered || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditSchedule(schedule);
                      }}
                      className={`mr-4 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'}`}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSchedule(schedule._id);
                      }}
                      className={darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    );
  };

  // --- SALES REPORTS SECTION ---
  const renderSalesReports = () => {
    // Calculate Data
    const salesData = assessments.map(assessment => {
      // Clean fee string (remove 'P', ',', spaces)
      const feeString = assessment.fee ? String(assessment.fee).replace(/[^0-9.]/g, '') : '0';
      const fee = parseFloat(feeString) || 0;

      // Count applications for this assessment
      const apps = assessmentApps.filter(app => {
         const appId = app.assessmentId?._id || app.assessmentId;
         return appId === assessment._id && app.status !== 'Rejected' && app.status !== 'Cancelled';
      });

      const totalApps = apps.length;
      const revenue = totalApps * fee;

      return {
        id: assessment._id,
        title: assessment.title,
        fee: assessment.fee,
        parsedFee: fee,
        count: totalApps,
        revenue: revenue
      };
    });

    const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
    const totalSales = salesData.reduce((sum, item) => sum + item.count, 0);
    const topPerformer = salesData.reduce((prev, current) => (prev.revenue > current.revenue) ? prev : current, { title: 'N/A', revenue: 0 });

    // Prepare Transaction Data
    const allTransactions = assessmentApps
      .filter(app => app.status !== 'Rejected' && app.status !== 'Cancelled')
      .map(app => {
        const assessment = assessments.find(a => a._id === (app.assessmentId?._id || app.assessmentId));
        const feeString = assessment?.fee ? String(assessment.fee).replace(/[^0-9.]/g, '') : '0';
        const fee = parseFloat(feeString) || 0;
        
        let studentName = 'Unknown';
        if (app.name) {
           studentName = `${app.name.firstname} ${app.name.surname}`;
        } else if (app.studentId && app.studentId.name) {
           studentName = `${app.studentId.name.firstname} ${app.studentId.name.surname}`;
        }

        const dateObj = new Date(app.createdAt);

        return {
          id: app._id,
          studentName: studentName,
          assessmentTitle: assessment?.title || app.assessmentTitle || 'Unknown Assessment',
          assessmentId: assessment?._id || app.assessmentId,
          dateObj: dateObj,
          date: dateObj.toLocaleDateString(),
          time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fee: fee,
          status: app.status
        };
      })
      .filter(t => {
        // Search Filter
        const matchesSearch = t.studentName.toLowerCase().includes(salesSearch.toLowerCase()) ||
          t.assessmentTitle.toLowerCase().includes(salesSearch.toLowerCase());
        
        // Assessment Dropdown Filter
        const matchesAssessment = salesAssessmentFilter ? t.assessmentId === salesAssessmentFilter : true;

        // Date Range Filter
        let matchesDate = true;
        if (salesDateRange.from) {
          const fromDate = new Date(salesDateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          if (t.dateObj < fromDate) matchesDate = false;
        }
        if (salesDateRange.to) {
          const toDate = new Date(salesDateRange.to);
          toDate.setHours(23, 59, 59, 999);
          if (t.dateObj > toDate) matchesDate = false;
        }

        return matchesSearch && matchesAssessment && matchesDate;
      })
      .sort((a, b) => b.dateObj - a.dateObj); // Sort by newest first

    // Pagination Logic
    const totalPages = Math.ceil(allTransactions.length / SALES_ITEMS_PER_PAGE);
    const startIndex = (salesPage - 1) * SALES_ITEMS_PER_PAGE;
    const displayedTransactions = allTransactions.slice(startIndex, startIndex + SALES_ITEMS_PER_PAGE);

    const downloadExcel = () => {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Student Name,Assessment,Fee,Qty,Amount,Date,Time\n";

      allTransactions.forEach(t => {
        const row = [
          t.studentName,
          t.assessmentTitle,
          t.fee,
          1,
          t.fee,
          t.date,
          t.time
        ].map(e => `"${e}"`).join(",");
        csvContent += row + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "sales_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sales Reports</h2>
              <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Monitor revenue and transaction history</p>
           </div>
           
           <button
              onClick={downloadExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-green-200 transition-all flex items-center gap-2 font-medium whitespace-nowrap self-start md:self-auto"
            >
              <Download className="w-5 h-5" /> Export Report
            </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className={`p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center justify-between mb-4">
                 <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Revenue</h3>
                 <div className="p-2.5 bg-green-100 text-green-600 rounded-xl">
                    <TrendingUp className="w-6 h-6" />
                 </div>
              </div>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ₱{totalRevenue.toLocaleString()}
              </p>
           </div>

           <div className={`p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center justify-between mb-4">
                 <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Assessments Sold</h3>
                 <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                    <Award className="w-6 h-6" />
                 </div>
              </div>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {totalSales}
              </p>
           </div>

           <div className={`p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center justify-between mb-4">
                 <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Top Performer</h3>
                 <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
                    <Award className="w-6 h-6" />
                 </div>
              </div>
              <p className={`text-lg font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {topPerformer.title}
              </p>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Generated ₱{topPerformer.revenue.toLocaleString()}
              </p>
           </div>
        </div>

        {/* Filters Section */}
        <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="relative z-20">
               <CustomDatePicker 
                 label="From Date"
                 value={salesDateRange.from}
                 onChange={(value) => { setSalesDateRange({...salesDateRange, from: value}); setSalesPage(1); }}
                 darkMode={darkMode}
               />
            </div>

            <div className="relative z-10">
               <CustomDatePicker 
                 label="To Date"
                 value={salesDateRange.to}
                 onChange={(value) => { setSalesDateRange({...salesDateRange, to: value}); setSalesPage(1); }}
                 darkMode={darkMode}
               />
            </div>

            <div className="space-y-1">
              <label className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Filter by Assessment</label>
              <select
                value={salesAssessmentFilter}
                onChange={(e) => { setSalesAssessmentFilter(e.target.value); setSalesPage(1); }}
                className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
              >
                <option value="">All Assessments</option>
                {assessments.map(a => (
                  <option key={a._id} value={a._id}>{a.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Detailed Sales Report Section */}
        <div className={`rounded-2xl shadow-sm border overflow-hidden flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className={`px-6 py-5 border-b flex flex-col sm:flex-row justify-between items-center gap-4 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
             <div className="flex items-center gap-2">
               <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Transaction History</h3>
               {salesAssessmentFilter && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">Filtered</span>}
             </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search student or assessment..."
                value={salesSearch}
                onChange={(e) => { setSalesSearch(e.target.value); setSalesPage(1); }}
                className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
              />
              <Search className={`absolute left-3 top-3 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-gray-900/50' : 'bg-gray-50/80'}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Student Name</th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Assessment</th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date & Time</th>
                  <th className={`px-6 py-4 text-center text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Qty</th>
                  <th className={`px-6 py-4 text-right text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Amount</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {displayedTransactions.map((t) => (
                  <tr key={t.id} className={`group transition-colors ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-blue-50/50'}`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {t.studentName}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t.assessmentTitle}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="flex flex-col">
                        <span>{t.date}</span>
                        <span className="text-xs opacity-70">{t.time}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      1
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                      ₱{t.fee.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {displayedTransactions.length === 0 && (
                   <tr>
                     <td colSpan="5" className={`px-6 py-12 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                       <div className="flex flex-col items-center justify-center gap-3">
                         <div className={`p-4 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                           <Search className="w-6 h-6 opacity-50" />
                         </div>
                         <p>{salesSearch || salesDateRange.from || salesDateRange.to || salesAssessmentFilter ? 'No matching transactions found' : 'No transaction history available'}</p>
                       </div>
                     </td>
                   </tr>
                )}
              </tbody>
              {displayedTransactions.length > 0 && (
                <tfoot
                  className={`border-t ${
                    darkMode
                      ? 'bg-gray-900/70 border-gray-700'
                      : 'bg-gradient-to-r from-blue-50/60 via-blue-50/30 to-green-50/60 border-gray-200'
                  }`}
                >
                  <tr>
                    <td
                      colSpan="3"
                      className={`px-6 py-4 text-right text-sm sm:text-base font-semibold ${
                        darkMode ? 'text-gray-100' : 'text-gray-800'
                      }`}
                    >
                      Total:
                    </td>
                    <td
                      className={`px-6 py-4 text-center text-sm sm:text-base font-semibold ${
                        darkMode ? 'text-gray-100' : 'text-gray-800'
                      }`}
                    >
                      {allTransactions.length}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm sm:text-base font-bold ${
                          darkMode
                            ? 'bg-green-900/40 text-green-300'
                            : 'bg-green-100 text-green-700 shadow-sm'
                        }`}
                      >
                        ₱{allTransactions.reduce((sum, t) => sum + t.fee, 0).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className={`px-6 py-4 border-t flex items-center justify-between ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + SALES_ITEMS_PER_PAGE, allTransactions.length)}</span> of <span className="font-medium">{allTransactions.length}</span> results
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setSalesPage(p => Math.max(1, p - 1))}
                  disabled={salesPage === 1}
                  className={`p-2 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-transparent' 
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setSalesPage(page)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      salesPage === page
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                        : darkMode 
                          ? 'text-gray-300 hover:bg-gray-700' 
                          : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setSalesPage(p => Math.min(totalPages, p + 1))}
                  disabled={salesPage === totalPages}
                  className={`p-2 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-transparent' 
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- START OF SETTINGS SECTION ---
  const renderSettings = () => (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-100 rounded-xl">
          <Settings className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>System Settings</h2>
          <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage global configurations and payment details</p>
        </div>
      </div>
      
      <div className={`rounded-2xl shadow-xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
          <div className="flex items-center gap-3 text-white">
            <CreditCard className="w-6 h-6 opacity-90" />
            <h3 className="text-xl font-semibold">Payment Configuration</h3>
          </div>
          <p className="text-blue-100 mt-2 text-sm">Update the GCash details displayed to students during enrollment.</p>
        </div>
        
        <div className="p-8 space-y-8">
          {/* GCash Number Section */}
          <div className="space-y-3">
            <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              GCash Mobile Number
            </label>
            <div className="relative group">
              <input 
                type="text" 
                className={`w-full pl-4 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'}`}
                value={paymentConfig.gcashNumber}
                onChange={(e) => setPaymentConfig({...paymentConfig, gcashNumber: e.target.value})}
                placeholder="e.g., 0917-123-4567"
              />
            </div>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>This number will be shown as the primary recipient for payments.</p>
          </div>

          {/* QR Code Section */}
          <div className="space-y-3">
            <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              QR Code Image
            </label>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* Preview Card */}
              <div className="flex-shrink-0">
                <div className={`w-48 h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden relative group transition-colors hover:border-blue-400 ${darkMode ? 'border-gray-600 bg-gray-700 hover:bg-blue-900/30' : 'border-gray-300 bg-gray-50 hover:bg-blue-50/30'}`}>
                  {paymentConfig.qrCodeImage ? (
                    <>
                      <img src={paymentConfig.qrCodeImage} alt="QR Code" className="w-full h-full object-contain p-2" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ImageIcon className="w-8 h-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className={`w-10 h-10 mx-auto mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-300'}`} />
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>No QR Code Uploaded</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-4">
                <div className="relative">
                  <input 
                    type="file" 
                    id="qr-upload"
                    accept="image/*"
                    onChange={handleSettingsImageUpload}
                    className="hidden"
                  />
                  <label 
                    htmlFor="qr-upload"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-400 transition-all group ${darkMode ? 'border-blue-800 bg-blue-900/20 hover:bg-blue-900/30' : 'border-blue-200 bg-blue-50/50 hover:bg-blue-50'}`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className={`p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <Upload className="w-6 h-6 text-blue-500" />
                      </div>
                      <p className={`mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Click to upload or drag and drop</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                    </div>
                  </label>
                </div>
                <div className={`border rounded-lg p-3 flex gap-3 items-start ${darkMode ? 'bg-yellow-900/20 border-yellow-900/30' : 'bg-yellow-50 border-yellow-100'}`}>
                  <div className="mt-0.5">
                    <CheckCircle2 className={`w-4 h-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  </div>
                  <p className={`text-xs leading-relaxed ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    Ensure the QR code is clear and scannable. This image will be displayed on the student payment portal exactly as uploaded.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className={`pt-6 border-t flex justify-end ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <button 
              onClick={handleSavePaymentConfig}
              disabled={savingSettings}
              className={`
                relative px-8 py-3 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/30 
                flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0
                ${savingSettings 
                  ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}
              `}
            >
              {savingSettings ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // --- START OF ASSESSMENT SECTION ---
  const renderAssessments = () => {
    const filteredAssessments = assessments.filter(assessment => 
      assessment.title.toLowerCase().includes(assessmentSearch.toLowerCase()) ||
      assessment.assessmentId.toLowerCase().includes(assessmentSearch.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Assessment Management</h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
             {/* Search Bar */}
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search assessments..."
                value={assessmentSearch}
                onChange={(e) => setAssessmentSearch(e.target.value)}
                className={`pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full sm:w-64 ${
                  darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 shadow-sm'
                }`}
              />
            </div>
            <button 
              onClick={() => {
                setEditingItem(null);
                setAssessmentForm({ assessmentId: '', title: '', fee: '', capacity: '', status: 'Active' });
                setActiveSubSection('assessment-form');
              }}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all"
            >
              <Plus className="w-5 h-5" /> Add Assessment
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-gray-900/50' : 'bg-gray-50/80'}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>ID</th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Title</th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fee</th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Capacity</th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Available</th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                  <th className={`px-6 py-4 text-right text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {filteredAssessments.length > 0 ? (
                  filteredAssessments.map((assessment) => (
                    <tr key={assessment._id} className={`group transition-colors ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-blue-50/50'}`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{assessment.assessmentId}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{assessment.title}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>₱{Number(assessment.fee).toLocaleString()}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{assessment.capacity || 0}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {assessment.availableSlots !== undefined ? assessment.availableSlots : (assessment.capacity || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assessment.status === 'Active' 
                            ? (darkMode ? 'bg-green-900/30 text-green-400 ring-1 ring-green-500/30' : 'bg-green-100 text-green-800 ring-1 ring-green-600/20')
                            : (darkMode ? 'bg-yellow-900/30 text-yellow-400 ring-1 ring-yellow-500/30' : 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600/20')
                        }`}>
                          {assessment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => startEditAssessment(assessment)}
                            className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-blue-400 hover:bg-blue-900/30' : 'text-blue-600 hover:bg-blue-50'}`}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteAssessment(assessment._id)}
                            className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'}`}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className={`px-6 py-12 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Search className="w-12 h-12 opacity-20" />
                        <p className="text-lg font-medium">No assessments found</p>
                        <p className="text-sm opacity-60">Try adjusting your search terms</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} transition-colors duration-300`}>
      {/* Sidebar */}
      <div className={`w-64 shadow-lg fixed h-full z-20 hidden md:block transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-r border-gray-700' : 'bg-white'}`}>
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <LayoutDashboard className="w-8 h-8" />
            <span>Admin Portal</span>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          {[
            { id: 'dashboard', icon: Home, label: 'Dashboard' },
            { id: 'students', icon: UserPlus, label: 'Students' },
            { id: 'schedules', icon: Calendar, label: 'Schedules' },
            { id: 'assessments', icon: Award, label: 'Assessments' },
            { id: 'assessment-apps', icon: Edit, label: 'Applications' },
            { id: 'sales-reports', icon: TrendingUp, label: 'Sales Reports' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => { setActiveSection(item.id); setActiveSubSection(''); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeSection === item.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'}`
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className={`absolute bottom-0 w-full p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'}`}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex flex-1 flex-col md:ml-64 overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <header className={`sticky top-0 z-10 flex w-full drop-shadow-sm ${darkMode ? 'bg-gray-800 text-white shadow-md' : 'bg-white shadow-sm'} transition-colors duration-300`}>
          <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
            <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
              <button className={`block rounded-sm border p-1.5 shadow-sm lg:hidden ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-stroke bg-white text-black'}`}>
                <Menu className="w-6 h-6" />
              </button>
            </div>



            <div className="flex items-center gap-3 2xsm:gap-7 ml-auto">
              <ul className="flex items-center gap-2 2xsm:gap-4">
                {/* Dark Mode Toggle */}
                <li>
                  <button 
                    onClick={() => setDarkMode(!darkMode)}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                </li>

                {/* Notification Bell */}
                <li className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2.5 z-1 h-2 w-2 rounded-full bg-red-500 inline">
                        <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className={`absolute right-0 mt-2 w-80 rounded-lg border shadow-lg overflow-hidden z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <h4 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h4>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllAsRead} className="text-xs text-blue-500 hover:text-blue-600">Mark all read</button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className={`p-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No notifications</div>
                        ) : (
                          <ul>
                            {notifications.map((notification) => (
                              <li key={notification._id} className={`border-b last:border-0 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                <button
                                  onClick={() => {
                                    handleMarkAsRead(notification._id);
                                    setActiveSection('notifications');
                                    setShowNotifications(false);
                                  }}
                                  className={`w-full text-left p-4 hover:bg-opacity-50 transition-colors ${!notification.isRead ? (darkMode ? 'bg-gray-700/50' : 'bg-blue-50') : ''} ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                                >
                                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{notification.message}</p>
                                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {new Date(notification.createdAt).toLocaleString()}
                                  </p>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className={`p-2 border-t text-center ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <button 
                          onClick={() => {
                            setActiveSection('notifications');
                            setShowNotifications(false);
                          }}
                          className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                        >
                          See All Notifications
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              </ul>

              {/* User Profile */}
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-4"
                >
                  <span className="hidden text-right lg:block">
                    <span className={`block text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userProfile.username}</span>
                    <span className={`block text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{userProfile.role}</span>
                  </span>
                  <span className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/30 text-white">
                    {userProfile.image ? <img src={userProfile.image} alt="User" className="h-full w-full object-cover" /> : <User className="w-5 h-5" />}
                  </span>
                  <ChevronDown className={`hidden sm:block w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className={`absolute right-0 mt-4 flex w-62 flex-col rounded-lg border shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <ul className="flex flex-col gap-1 p-2">
                      <li>
                        <button 
                          onClick={() => { setShowProfileModal(true); setIsProfileOpen(false); }}
                          className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm font-medium rounded-md duration-300 ease-in-out ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                        >
                          <User className="w-4 h-4" />
                          Edit Profile
                        </button>
                      </li>
                      <li className={`border-t my-1 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}></li>
                      <li>
                        <button 
                          onClick={handleLogout}
                          className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm font-medium rounded-md duration-300 ease-in-out text-red-600 hover:bg-red-50`}
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            {activeSection === 'dashboard' && renderDashboard()}
            {activeSection === 'students' && renderStudents()}
            {activeSection === 'schedules' && renderSchedules()}
            {activeSection === 'assessments' && renderAssessments()}
            {activeSection === 'assessment-apps' && renderAssessmentApps()}
            {activeSection === 'sales-reports' && renderSalesReports()}
            {activeSection === 'settings' && renderSettings()}
            {activeSection === 'notifications' && renderNotifications()}
          </div>
        </main>
      </div>

      {/* Profile Settings Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            
            {/* Header with decorative background */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-600 to-indigo-700"></div>
            
            <button 
              onClick={() => setShowProfileModal(false)} 
              className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full backdrop-blur-sm transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative px-6 pt-12 pb-6 flex flex-col items-center">
              
              {/* Profile Image - Floating effect */}
              <div className="relative group mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white">
                  {profileForm.image || userProfile.image ? (
                    <img src={profileForm.image || userProfile.image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <User className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-1 right-1 bg-blue-600 text-white p-2.5 rounded-full shadow-lg hover:bg-blue-700 hover:scale-105 transition-all cursor-pointer ring-4 ring-white dark:ring-gray-800">
                  <Camera className="w-5 h-5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
                </label>
              </div>

              <h3 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit Profile</h3>
              <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Update your admin credentials</p>

              {/* Error Message */}
              {profileErrors.general && (
                <div className="w-full mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-in slide-in-from-top-2">
                  <div className="p-1 bg-red-100 dark:bg-red-900/50 rounded-full shrink-0">
                    <X className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-medium">{profileErrors.general}</p>
                </div>
              )}

              {/* Form Fields */}
              <div className="w-full space-y-5">
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Username</label>
                  <div className="relative group">
                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                      profileErrors.username 
                        ? 'text-red-500' 
                        : darkMode ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-500'
                    }`} />
                    <input 
                      type="text" 
                      value={profileForm.username}
                      onChange={(e) => {
                        setProfileForm({...profileForm, username: e.target.value});
                        if (profileErrors.username) setProfileErrors(prev => ({ ...prev, username: null }));
                      }}
                      placeholder={userProfile.username}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 outline-none transition-all ${
                        profileErrors.username
                          ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-100 placeholder-red-300'
                          : darkMode 
                            ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:bg-gray-700' 
                            : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10'
                      }`}
                    />
                  </div>
                  {profileErrors.username && (
                    <p className="text-xs text-red-500 mt-1 ml-1 animate-in slide-in-from-top-1">{profileErrors.username}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>New Password</label>
                  <div className="relative group">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                      profileErrors.password
                        ? 'text-red-500'
                        : darkMode ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-500'
                    }`} />
                    <input 
                      type="password" 
                      value={profileForm.password}
                      onChange={(e) => {
                        setProfileForm({...profileForm, password: e.target.value});
                        if (profileErrors.password) setProfileErrors(prev => ({ ...prev, password: null }));
                      }}
                      placeholder="Leave blank to keep current"
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 outline-none transition-all ${
                        profileErrors.password
                          ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-100 placeholder-red-300'
                          : darkMode 
                            ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:bg-gray-700' 
                            : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10'
                      }`}
                    />
                  </div>
                  {profileErrors.password ? (
                    <p className="text-xs text-red-500 mt-1 ml-1 animate-in slide-in-from-top-1">{profileErrors.password}</p>
                  ) : (
                    <p className="text-xs text-gray-400 ml-1">Must be at least 6 characters</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full mt-8">
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Save Changes
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Assessment Modal (Moved to root) */}
      {activeSubSection === 'assessment-form' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{editingItem ? 'Edit Assessment' : 'New Assessment'}</h3>
              <button onClick={() => setActiveSubSection('')} className="text-white/80 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 space-y-5">
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Assessment ID</label>
                <input 
                  type="text" 
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                  placeholder="e.g., ASM-001"
                  value={assessmentForm.assessmentId}
                  onChange={(e) => setAssessmentForm({...assessmentForm, assessmentId: e.target.value})}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Title</label>
                <input 
                  type="text" 
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                  placeholder="e.g., NC II Assessment"
                  value={assessmentForm.title}
                  onChange={(e) => setAssessmentForm({...assessmentForm, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fee (₱)</label>
                  <input 
                    type="number" 
                    min="0"
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                    placeholder="0"
                    value={assessmentForm.fee}
                    onKeyDown={(e) => {
                      if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d+$/.test(val)) {
                        setAssessmentForm({...assessmentForm, fee: val});
                      }
                    }}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Capacity</label>
                  <input 
                    type="number" 
                    min="0"
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                    placeholder="0"
                    value={assessmentForm.capacity}
                    onKeyDown={(e) => {
                      if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d+$/.test(val)) {
                        setAssessmentForm({...assessmentForm, capacity: val});
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
                <div className="relative">
                  <select 
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium appearance-none cursor-pointer ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                    value={assessmentForm.status}
                    onChange={(e) => setAssessmentForm({...assessmentForm, status: e.target.value})}
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    {editingItem && <option value="Closed">Closed</option>}
                  </select>
                  <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 flex justify-end gap-3 border-t ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
              <button 
                onClick={() => setActiveSubSection('')}
                className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAssessment}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium shadow-lg shadow-blue-500/30 transition-all transform active:scale-95"
              >
                {editingItem ? 'Save Changes' : 'Create Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal (Moved to root) */}
      {activeSubSection === 'schedule-form' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{editingItem ? 'Edit Schedule' : 'New Schedule'}</h3>
              <button onClick={() => setActiveSubSection('')} className="text-white/80 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 space-y-5">
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Course ID</label>
                <input 
                  type="text" 
                  className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${darkMode ? 'bg-gray-700 text-white focus:bg-gray-600' : 'bg-gray-50 focus:bg-white text-gray-800'} ${scheduleErrors.courseId ? 'border-red-500 ring-1 ring-red-500' : (darkMode ? 'border-gray-600' : 'border-gray-200')}`}
                  placeholder="e.g., SCH-101"
                  value={scheduleForm.courseId}
                  onChange={(e) => {
                    setScheduleForm({...scheduleForm, courseId: e.target.value});
                    if (scheduleErrors.courseId) setScheduleErrors({...scheduleErrors, courseId: ''});
                  }}
                />
                {scheduleErrors.courseId && <p className="mt-1 text-sm text-red-500 font-medium">{scheduleErrors.courseId}</p>}
              </div>
              
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Course Title</label>
                <input 
                  type="text" 
                  className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${darkMode ? 'bg-gray-700 text-white focus:bg-gray-600' : 'bg-gray-50 focus:bg-white text-gray-800'} ${scheduleErrors.courseTitle ? 'border-red-500 ring-1 ring-red-500' : (darkMode ? 'border-gray-600' : 'border-gray-200')}`}
                  placeholder="e.g., Advanced React Patterns"
                  value={scheduleForm.courseTitle}
                  onChange={(e) => {
                    setScheduleForm({...scheduleForm, courseTitle: e.target.value});
                    if (scheduleErrors.courseTitle) setScheduleErrors({...scheduleErrors, courseTitle: ''});
                  }}
                />
                {scheduleErrors.courseTitle && <p className="mt-1 text-sm text-red-500 font-medium">{scheduleErrors.courseTitle}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Training Date</label>
                  <input 
                    type="date" 
                    className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${darkMode ? 'bg-gray-700 text-white focus:bg-gray-600' : 'bg-gray-50 focus:bg-white text-gray-800'} ${scheduleErrors.trainingDate ? 'border-red-500 ring-1 ring-red-500' : (darkMode ? 'border-gray-600' : 'border-gray-200')}`}
                    value={scheduleForm.trainingDate}
                    onChange={(e) => {
                      setScheduleForm({...scheduleForm, trainingDate: e.target.value});
                      if (scheduleErrors.trainingDate) setScheduleErrors({...scheduleErrors, trainingDate: ''});
                    }}
                  />
                  {scheduleErrors.trainingDate && <p className="mt-1 text-sm text-red-500 font-medium">{scheduleErrors.trainingDate}</p>}
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Capacity</label>
                  <input 
                    type="number" 
                    min="0"
                    className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${darkMode ? 'bg-gray-700 text-white focus:bg-gray-600' : 'bg-gray-50 focus:bg-white text-gray-800'} ${scheduleErrors.capacity ? 'border-red-500 ring-1 ring-red-500' : (darkMode ? 'border-gray-600' : 'border-gray-200')}`}
                    placeholder="0"
                    value={scheduleForm.capacity}
                    onKeyDown={(e) => {
                      if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Strictly allow only digits (no negatives, no decimals, no other chars)
                      if (val === '' || /^\d+$/.test(val)) {
                        setScheduleForm({...scheduleForm, capacity: val});
                        if (scheduleErrors.capacity) setScheduleErrors({...scheduleErrors, capacity: ''});
                      }
                    }}
                  />
                  {scheduleErrors.capacity && <p className="mt-1 text-sm text-red-500 font-medium">{scheduleErrors.capacity}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => setActiveSubSection('')}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveSchedule}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium shadow-lg shadow-blue-500/30 transition-all transform active:scale-95"
                >
                  {editingItem ? 'Update Schedule' : 'Add Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <button 
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
              onClick={() => setZoomedImage(null)}
            >
              <X className="w-8 h-8" />
            </button>
            <img 
              src={zoomedImage} 
              alt="Zoomed Proof" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}

      {/* Settings Success Modal */}
      {showSettingsSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Settings Saved</h3>
              <p className="text-gray-600 mb-6">
                System configuration has been updated successfully.
              </p>
              <button
                onClick={() => setShowSettingsSuccess(false)}
                className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  confirmModal.type === 'danger' ? 'bg-red-100 text-red-600' : 
                  confirmModal.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {confirmModal.type === 'danger' ? <Trash2 className="w-8 h-8" /> : 
                   confirmModal.type === 'success' ? <CheckCircle2 className="w-8 h-8" /> : <Award className="w-8 h-8" />}
                </div>
                
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{confirmModal.title}</h3>
                <div className={`leading-relaxed mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {confirmModal.message}
                </div>

                <div className="flex gap-3 w-full">
                  {confirmModal.onConfirm && (
                    <button
                      onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                      className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirmModal.onConfirm) confirmModal.onConfirm();
                      setConfirmModal({ ...confirmModal, isOpen: false });
                    }}
                    className={`flex-1 px-4 py-3 text-white rounded-xl font-semibold shadow-lg transition-all transform active:scale-95 ${
                      confirmModal.type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 
                      confirmModal.type === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                    }`}
                  >
                    {confirmModal.onConfirm ? 'Confirm' : 'OK'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
