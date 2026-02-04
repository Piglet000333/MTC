import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from "framer-motion";
import { Home, UserPlus, Calendar, Award, Plus, Edit, Trash2, Search, LogOut, X, Eye, Settings, Upload, Save, CreditCard, Image as ImageIcon, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Moon, Sun, Bell, User, Users, Lock, Camera, Menu, Download, BookOpen, Mail, Phone, TrendingUp, Maximize2, Hash } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import CustomDatePicker from '../components/CustomDatePicker';
import CustomDropdown from '../components/CustomDropdown';
import AdminStats from '../components/admin/AdminStats';
import RecentStudents from '../components/admin/RecentStudents';
import StudentManager from '../components/admin/StudentManager';
import { authedFetch } from '../utils/api';

const ASSESSMENT_APPS_PER_PAGE = 10;

const AdminDashboard = () => { 
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard'); 
  const [activeSubSection, setActiveSubSection] = useState(''); 
  const [scheduleSearchTerm, setScheduleSearchTerm] = useState(''); // New search state for schedules
  const [assessmentAppFilter, setAssessmentAppFilter] = useState(''); // Filter by Assessment
  const [assessmentAppStatusFilter, setAssessmentAppStatusFilter] = useState(''); // Filter by Status
  const [assessmentAppSearchTerm, setAssessmentAppSearchTerm] = useState(''); // Search by Applicant Name
  const [assessmentSearch, setAssessmentSearch] = useState(''); // Search by Assessment Title/ID

  // Pagination State
  const [appPage, setAppPage] = useState(1);

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
  const [viewingApp, setViewingApp] = useState(null);
  const [viewingScheduleStudents, setViewingScheduleStudents] = useState(null); // State for viewing enrolled students
  const [showScheduleStudentsModal, setShowScheduleStudentsModal] = useState(false); // State for modal visibility
  const [scheduleForm, setScheduleForm] = useState({ courseId: '', courseTitle: '', trainingDate: '', capacity: '', status: 'Active' });
  const [assessmentForm, setAssessmentForm] = useState({ assessmentId: '', title: '', fee: '', status: 'Active', dropReason: '' });
  const [assessmentSubTab, setAssessmentSubTab] = useState('active'); // 'active' | 'history'
  const [scheduleSubTab, setScheduleSubTab] = useState('active'); // 'active' | 'history'
  const [scheduleHistoryFilter, setScheduleHistoryFilter] = useState('All'); // 'All' | 'Completed' | 'Drop'
  const [scheduleHistoryCourseFilter, setScheduleHistoryCourseFilter] = useState('All'); // 'All' | Course Title
  const [assessmentHistoryFilter, setAssessmentHistoryFilter] = useState('All'); // 'All' | 'Completed' | 'Drop'
  const [assessmentHistoryCourseFilter, setAssessmentHistoryCourseFilter] = useState('All'); // 'All' | Course Title

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

  // Drop Reason Modal State
  const [dropReasonModal, setDropReasonModal] = useState({
    isOpen: false,
    appId: null,
    regId: null, // Added for schedule registrations
    type: 'assessment', // 'assessment' or 'registration'
    reason: '2 Absences', // Default reason
    customReason: ''
  });

  // View Reason Modal State
  const [viewReasonModal, setViewReasonModal] = useState({
    isOpen: false,
    reason: '',
    applicantName: ''
  });

  const [viewingAssessmentApplicants, setViewingAssessmentApplicants] = useState(null);
  const [showAssessmentApplicantsModal, setShowAssessmentApplicantsModal] = useState(false);

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
    confirmPassword: '',
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
  
  const loadNotifications = React.useCallback(async () => {
    try {
      const res = await authedFetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, []);

  const loadAdminProfile = React.useCallback(async () => {
    try {
      const res = await authedFetch('/api/admin/profile');
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
  }, []);

  useEffect(() => {
    loadNotifications();
    loadAdminProfile();
    const interval = setInterval(loadNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [loadNotifications, loadAdminProfile]);

  const loadData = React.useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const timestamp = new Date().getTime();
      const [studentsRes, schedulesRes, assessmentsRes, registrationsRes, appsRes, settingsRes] = await Promise.all([
        authedFetch(`/api/students?t=${timestamp}`),
        authedFetch(`/api/schedules?t=${timestamp}`),
        authedFetch(`/api/assessments?t=${timestamp}`),
        authedFetch(`/api/registrations?t=${timestamp}`),
        authedFetch(`/api/assessment-applications?t=${timestamp}`),
        authedFetch(`/api/system-settings/payment_config?t=${timestamp}`)
      ]);

      if (!studentsRes.ok) throw new Error(`Failed to load students: ${studentsRes.status} ${studentsRes.statusText}`);
      if (!schedulesRes.ok) throw new Error(`Failed to load schedules: ${schedulesRes.status} ${schedulesRes.statusText}`);
      if (!assessmentsRes.ok) throw new Error(`Failed to load assessments: ${assessmentsRes.status} ${assessmentsRes.statusText}`);
      if (!registrationsRes.ok) throw new Error(`Failed to load registrations: ${registrationsRes.status} ${registrationsRes.statusText}`);
      if (!appsRes.ok) throw new Error(`Failed to load applications: ${appsRes.status} ${appsRes.statusText}`);

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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleSavePaymentConfig = async () => {
    setSavingSettings(true);
    try {
      const res = await authedFetch('/api/system-settings/payment_config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: paymentConfig })
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setShowSettingsSuccess(true);
    } catch (err) {
      toast.error(err.message);
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
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    navigate('/admin/login');
  };

  // --- Student CRUD ---
  const handleUpdateRegistrationStatus = async (regId, newStatus, remarks = '') => {
    try {
      const body = { status: newStatus };
      if (remarks) body.remarks = remarks;

      const res = await authedFetch(`/api/registrations/${regId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      
      // Update local state
      setRegistrations(prev => prev.map(r => 
        r._id === regId ? { ...r, status: newStatus, remarks: remarks || r.remarks } : r
      ));
      
      // Refresh data to update counts
      loadData(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteRegistration = async (regId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete History Record',
      message: 'Are you sure you want to delete this history record? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await authedFetch(`/api/registrations/${regId}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Failed to delete record');
          
          setRegistrations(prev => prev.filter(r => r._id !== regId));
          setConfirmModal({
            isOpen: true,
            title: 'Success',
            message: 'Record deleted successfully',
            type: 'success',
            onConfirm: null
          });
          loadData(true);
        } catch (err) {
          toast.error(err.message);
        }
      }
    });
  };

  const handleDeleteAllHistoryRegistrations = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete All History',
      message: 'Are you sure you want to delete ALL history records? This will remove all Completed, Dropped, and Cancelled registrations. This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          // Filter IDs to delete based on current filter state if needed, or just all history
          // Assuming "Delete All" deletes all visible history or strictly all history. 
          // Usually "Delete All" in this context implies all history records.
          const historyIds = registrations
            .filter(r => ['completed', 'dropped', 'cancelled', 'archived'].includes(r.status?.toLowerCase()))
            .map(r => r._id);

          if (historyIds.length === 0) {
            toast.error("No history records to delete.");
            return;
          }

          const promises = historyIds.map(id => authedFetch(`/api/registrations/${id}`, { method: 'DELETE' }));
          await Promise.all(promises);
          
          setRegistrations(prev => prev.filter(r => !historyIds.includes(r._id)));
          setConfirmModal({
            isOpen: true,
            title: 'Success',
            message: 'All history records deleted successfully',
            type: 'success',
            onConfirm: null
          });
          loadData(true);
        } catch (err) {
          toast.error("Failed to delete some records: " + err.message);
        }
      }
    });
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
      
      const res = await authedFetch(url, {
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
          const res = await authedFetch(`/api/schedules/${id}`, { method: 'DELETE' });
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
      capacity: schedule.capacity || '',
      status: schedule.status || 'Active'
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
      
      const res = await authedFetch(url, {
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
      setAssessmentForm({ assessmentId: '', title: '', fee: '', status: 'Active', dropReason: '' });
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
          const res = await authedFetch(`/api/assessments/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Failed to delete assessment');
          loadData();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (e) {
          toast.error(e.message);
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
      status: assessment.status || 'Active',
      dropReason: assessment.dropReason || ''
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

  const executeUpdateAppStatus = async (id, status, remarks = '') => {
    try {
      const body = { status };
      if (remarks) body.remarks = remarks;

      const res = await authedFetch(`/api/assessment-applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update status');
      }
      
      const updated = await res.json();
      setAssessmentApps(assessmentApps.map(a => a._id === id ? updated : a));
      if (viewingApp && viewingApp._id === id) {
        setViewingApp(updated);
      }
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      setDropReasonModal(prev => ({ ...prev, isOpen: false })); // Close drop modal if open
      
      // Refresh all data to update assessment slots availability
      loadData(true);
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
      const res = await authedFetch(`/api/assessment-applications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete application');
      
      setAssessmentApps(assessmentApps.filter(a => a._id !== id));
      if (viewingApp && viewingApp._id === id) {
        setViewingApp(null);
      }
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      
      // Refresh all data to update assessment slots availability
      loadData(true);
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

  const handleDeleteAllHistory = () => {
    // 1. Identify items to delete based on current filters
    let historyApps = assessmentApps.filter(app => ['Completed', 'Drop'].includes(app.status));
      
    // Apply Status Filter
    if (assessmentHistoryFilter !== 'All') {
      historyApps = historyApps.filter(app => app.status === assessmentHistoryFilter);
    }

    // Apply Course Filter
    if (assessmentHistoryCourseFilter !== 'All') {
      historyApps = historyApps.filter(app => app.assessmentTitle === assessmentHistoryCourseFilter);
    }

    // Apply Search Filter
    if (assessmentSearch) {
      const searchLower = assessmentSearch.toLowerCase();
      historyApps = historyApps.filter(app => 
          (app.name?.firstname || '').toLowerCase().includes(searchLower) ||
          (app.name?.surname || '').toLowerCase().includes(searchLower) ||
          (app.assessmentTitle || '').toLowerCase().includes(searchLower)
      );
    }

    if (historyApps.length === 0) {
       setConfirmModal({
         isOpen: true,
         title: 'No History Records',
         message: 'There are no history records to delete with the current filters.',
         type: 'info',
         onConfirm: null
       });
       return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Delete All History',
      message: `Are you sure you want to delete all ${historyApps.length} displayed history records? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
         try {
            const promises = historyApps.map(app => 
               authedFetch(`/api/assessment-applications/${app._id}`, {
                 method: 'DELETE'
               })
            );
            
            await Promise.all(promises);
            await loadData(true);
            
            setConfirmModal({
               isOpen: true,
               title: 'Success',
               message: 'All selected history records have been deleted.',
               type: 'success',
               onConfirm: null
            });
         } catch (err) {
            setConfirmModal({
               isOpen: true,
               title: 'Error',
               message: 'Failed to delete some records: ' + err.message,
               type: 'danger',
               onConfirm: null
            });
         }
      }
    });
  };

  const handleMarkAsRead = async (id) => {
    try {
      await authedFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
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
      await authedFetch('/api/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      const res = await authedFetch(`/api/notifications/${id}`, { method: 'DELETE' });
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
          const res = await authedFetch('/api/notifications/delete-all', { method: 'DELETE' });
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

    // Validate Passwords Match
    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      setProfileErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    try {
      const res = await authedFetch('/api/admin/profile', {
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
      
      setProfileForm({ username: '', password: '', confirmPassword: '', image: '' });
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
        <h2 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-800'}`}>Notifications</h2>
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

    // Pagination Logic
    const totalPages = Math.ceil(filteredApps.length / ASSESSMENT_APPS_PER_PAGE);
    const startIndex = (appPage - 1) * ASSESSMENT_APPS_PER_PAGE;
    const currentApps = filteredApps.slice(startIndex, startIndex + ASSESSMENT_APPS_PER_PAGE);

    return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {!viewingApp && (
        <div className={`p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Search Bar */}
            <div className="relative w-full md:w-96 group">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${darkMode ? 'text-gray-400 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
              <input 
                type="text" 
                placeholder="Search applicant, school, or assessment..." 
                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-none ring-1 ring-inset focus:ring-2 transition-all duration-200 outline-none text-sm font-medium ${
                  darkMode 
                    ? 'bg-gray-900/50 ring-gray-700 text-white placeholder-gray-500 focus:ring-blue-500/50 focus:bg-gray-900' 
                    : 'bg-gray-50 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-blue-500/20 focus:bg-white focus:shadow-sm'
                }`}
                value={assessmentAppSearchTerm}
                onChange={(e) => { setAssessmentAppSearchTerm(e.target.value); setAppPage(1); }}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <CustomDropdown
                options={[
                  { value: '', label: 'All Assessments' },
                  ...uniqueAssessments.map((title) => ({ value: title, label: title }))
                ]}
                value={assessmentAppFilter}
                onChange={(val) => { setAssessmentAppFilter(val); setAppPage(1); }}
                placeholder="All Assessments"
                darkMode={darkMode}
                className="w-full md:w-56"
              />

              <CustomDropdown
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'Pending', label: 'Pending', color: 'bg-yellow-500' },
                  { value: 'Approved', label: 'Approved', color: 'bg-green-500' },
                  { value: 'Rejected', label: 'Rejected', color: 'bg-red-500' },
                  { value: 'Completed', label: 'Completed', color: 'bg-blue-500' },
                  { value: 'Drop', label: 'Dropped', color: 'bg-gray-500' }
                ]}
                value={assessmentAppStatusFilter}
                onChange={(val) => { setAssessmentAppStatusFilter(val); setAppPage(1); }}
                placeholder="All Statuses"
                darkMode={darkMode}
                className="w-full md:w-48"
              />
            </div>
          </div>
        </div>
      )}

      {viewingApp ? (
        <div className={`rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-gray-800 ring-1 ring-white/10' : 'bg-white ring-1 ring-black/5'}`}>
           {/* Modal Header */}
           <div className={`px-8 py-6 border-b flex justify-between items-center ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-white'}`}>
              <div>
                 <h3 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Application Details</h3>
                 <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                       {viewingApp.assessmentId?.assessmentId || 'N/A'}
                    </span>
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Review applicant information and payment status</span>
                 </div>
              </div>
              <button 
                onClick={() => setViewingApp(null)} 
                className={`p-2 rounded-full transition-all duration-200 ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}
              >
                <X className="w-6 h-6" />
              </button>
           </div>

           <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Left Column: Applicant Info */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                       <User className="w-5 h-5" />
                    </div>
                    <h4 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Applicant Information</h4>
                 </div>
                 
                 <div className={`p-6 rounded-2xl space-y-5 border ${darkMode ? 'bg-gray-900/30 border-gray-700/50' : 'bg-gray-50/50 border-gray-100'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="group">
                          <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Full Name</p>
                          <p className={`font-semibold text-lg ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{viewingApp.name?.surname}, {viewingApp.name?.firstname} {viewingApp.name?.middleInitial}</p>
                       </div>
                       <div>
                          <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Assessment</p>
                          <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{viewingApp.assessmentTitle}</p>
                       </div>
                       <div className="sm:col-span-2">
                          <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>School / Company</p>
                          <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{viewingApp.schoolCompany}</p>
                       </div>
                       <div>
                          <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Contact</p>
                          <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{viewingApp.contact?.mobile}</p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{viewingApp.contact?.email}</p>
                       </div>
                       <div className="sm:col-span-2">
                          <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Address</p>
                          <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{viewingApp.address}</p>
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-3 mb-2 pt-4">
                    <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                       <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h4 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Application Status</h4>
                 </div>
                 
                 <div className={`p-4 rounded-2xl flex items-center justify-between border ${
                    viewingApp.status === 'Approved' ? (darkMode ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-100') :
                    viewingApp.status === 'Rejected' ? (darkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100') :
                    (darkMode ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-50 border-yellow-100')
                 }`}>
                    <div className="flex items-center gap-3">
                       <span className={`flex h-3 w-3 rounded-full shadow-sm ${
                          viewingApp.status === 'Approved' ? 'bg-green-500 shadow-green-500/50' :
                          viewingApp.status === 'Rejected' ? 'bg-red-500 shadow-red-500/50' :
                          'bg-yellow-500 shadow-yellow-500/50'
                       }`} />
                       <span className={`font-bold text-base ${
                          viewingApp.status === 'Approved' ? (darkMode ? 'text-green-400' : 'text-green-700') :
                          viewingApp.status === 'Rejected' ? (darkMode ? 'text-red-400' : 'text-red-700') :
                          (darkMode ? 'text-yellow-400' : 'text-yellow-700')
                       }`}>
                          {viewingApp.status}
                       </span>
                    </div>
                 </div>
              </div>

              {/* Right Column: Payment Info */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                       <CreditCard className="w-5 h-5" />
                    </div>
                    <h4 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Payment Details</h4>
                 </div>

                 <div className={`p-6 rounded-2xl space-y-6 border ${darkMode ? 'bg-gray-900/30 border-gray-700/50' : 'bg-gray-50/50 border-gray-100'}`}>
                    <div>
                       <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Payment Method</p>
                       <div className="flex items-center gap-2">
                          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm ${darkMode ? 'bg-gray-800 text-gray-200 border border-gray-700' : 'bg-white text-gray-700 border border-gray-200'}`}>
                             {viewingApp.payment?.isOnline ? 'Online Payment (GCash)' : 'On-site Payment'}
                          </span>
                       </div>
                    </div>

                    {viewingApp.payment?.isOnline && (
                       <>
                          <div className="grid grid-cols-2 gap-4">
                             <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-white border border-gray-100'}`}>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Sender Number</p>
                                <p className={`font-mono font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{viewingApp.payment?.senderGcashNumber}</p>
                             </div>
                             <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-white border border-gray-100'}`}>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Reference No.</p>
                                <p className={`font-mono font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{viewingApp.payment?.referenceNumber}</p>
                             </div>
                          </div>

                          <div>
                             <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Proof of Payment</p>
                             {viewingApp.payment?.proofOfPayment ? (
                                <div 
                                  className={`group relative rounded-2xl overflow-hidden border-2 border-dashed cursor-zoom-in transition-all duration-300 ${darkMode ? 'border-gray-700 hover:border-blue-500/50' : 'border-gray-200 hover:border-blue-400'}`}
                                  onClick={() => setZoomedImage(viewingApp.payment.proofOfPayment)}
                                >
                                   <div className="aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center relative">
                                      <img 
                                        src={viewingApp.payment.proofOfPayment} 
                                        alt="Proof" 
                                        className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105" 
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                         <div className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20 shadow-xl transform scale-75 group-hover:scale-100 transition-all">
                                            <Maximize2 className="w-6 h-6 text-white" />
                                         </div>
                                      </div>
                                   </div>
                                </div>
                             ) : (
                                <p className="text-sm text-gray-500 italic">No proof of payment uploaded.</p>
                             )}
                          </div>
                       </>
                    )}
                 </div>
              </div>
           </div>
          
           {/* Action Footer */}
           <div className={`px-8 py-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50/50'}`}>
              <button 
                onClick={() => handleDeleteAssessmentApp(viewingApp._id)}
                className={`w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-2 group ${
                  darkMode 
                    ? 'border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30' 
                    : 'border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200'
                }`}
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> Delete Application
              </button>

              <div className="flex gap-3 w-full sm:w-auto">
                {viewingApp.status === 'Pending' && (
                  <>
                    <button 
                      onClick={() => handleUpdateAppStatus(viewingApp._id, 'Rejected')}
                      className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-sm border transition-all ${
                        darkMode
                           ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                           : 'border-gray-200 text-gray-600 hover:bg-white hover:shadow-md hover:text-red-600'
                      }`}
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleUpdateAppStatus(viewingApp._id, 'Approved')}
                      className="flex-1 sm:flex-none px-8 py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all transform hover:-translate-y-0.5 active:scale-95"
                    >
                      Approve Application
                    </button>
                  </>
                )}
              </div>
           </div>
        </div>
      ) : (
        <div className={`rounded-3xl shadow-xl border overflow-hidden transition-all duration-300 ${darkMode ? 'bg-gray-800/50 backdrop-blur-xl border-gray-700 shadow-black/20' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-gray-900/50' : 'bg-gray-50/80'}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date</th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Applicant</th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Assessment</th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Payment Mode</th>
                  <th className={`px-6 py-4 text-center text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                  <th className={`px-6 py-4 text-right text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan="5" className={`px-6 py-12 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className={`p-4 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <User className="w-6 h-6 opacity-50" />
                        </div>
                        <p>No applications found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentApps.map((app) => (
                    <tr key={app._id} className={`group transition-colors cursor-pointer ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-blue-50/50'}`} onClick={() => setViewingApp(app)}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <div className="flex flex-col">
                           <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{new Date(app.createdAt).toLocaleDateString()}</span>
                           <span className="text-xs opacity-70">{new Date(app.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                               darkMode ? 'bg-gradient-to-br from-blue-900 to-indigo-900 text-blue-300 ring-2 ring-gray-700' : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 ring-2 ring-white'
                            }`}>
                               {app.name?.firstname?.[0]}{app.name?.surname?.[0]}
                            </div>
                            <div>
                               <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{app.name?.surname}, {app.name?.firstname}</p>
                               <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{app.schoolCompany || 'No school/company'}</p>
                            </div>
                         </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${darkMode ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-200 bg-white text-gray-700'}`}>
                           {app.assessmentTitle}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm`}>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          app.payment?.isOnline 
                            ? (darkMode ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-600 border-purple-200')
                            : (darkMode ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-600 border-orange-200')
                        }`}>
                          {app.payment?.isOnline ? 'Online (GCash)' : 'Walk-in'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          app.status === 'Approved' 
                             ? (darkMode ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-700 border-green-200')
                             : app.status === 'Rejected'
                             ? (darkMode ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-700 border-red-200')
                             : app.status === 'Completed'
                             ? (darkMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200')
                             : (darkMode ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-yellow-50 text-yellow-700 border-yellow-200')
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                             app.status === 'Approved' ? 'bg-green-500' :
                             app.status === 'Rejected' ? 'bg-red-500' :
                             app.status === 'Completed' ? 'bg-blue-500' :
                             'bg-yellow-500'
                          }`}></span>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setViewingApp(app); }}
                            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteAssessmentApp(app._id); }}
                            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                            title="Delete Application"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {filteredApps.length > 0 && (
            <div className={`px-6 py-4 border-t flex items-center justify-between ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Showing <span className="font-medium">{Math.min(startIndex + 1, filteredApps.length)}</span> to <span className="font-medium">{Math.min(startIndex + ASSESSMENT_APPS_PER_PAGE, filteredApps.length)}</span> of <span className="font-medium">{filteredApps.length}</span> results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAppPage(p => Math.max(1, p - 1))}
                  disabled={appPage === 1}
                  className={`p-2 rounded-lg border transition-colors ${
                    darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {/* Page Numbers */}
                <div className="flex gap-1">
                   {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Simple logic for limited page numbers
                      let p = i + 1;
                      if (totalPages > 5 && appPage > 3) {
                         p = appPage - 2 + i;
                         if (p > totalPages) p = totalPages - (4 - i);
                      }
                      
                      return (
                        <button
                           key={p}
                           onClick={() => setAppPage(p)}
                           className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                              appPage === p
                                 ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                 : darkMode 
                                   ? 'text-gray-300 hover:bg-gray-700' 
                                   : 'text-gray-600 hover:bg-gray-50'
                           }`}
                        >
                           {p}
                        </button>
                      );
                   })}
                </div>

                <button
                  onClick={() => setAppPage(p => Math.min(totalPages, p + 1))}
                  disabled={appPage === totalPages}
                  className={`p-2 rounded-lg border transition-colors ${
                    darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Enrolled Students Modal */}
      {showScheduleStudentsModal && viewingScheduleStudents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Enrolled Students</h3>
                <p className="text-blue-100 text-sm mt-1">{viewingScheduleStudents.courseTitle} ({viewingScheduleStudents.courseId})</p>
              </div>
              <div className="flex items-center gap-3">
                 <button 
                    onClick={handleCompleteAllScheduleStudents}
                    className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                 >
                    <CheckCircle2 className="w-4 h-4" />
                    Complete All
                 </button>
                 <button onClick={() => setShowScheduleStudentsModal(false)} className="text-white/80 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                 </button>
              </div>
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
                           !['cancelled', 'completed', 'dropped'].includes(reg.status)
                         );
                      })
                      .length > 0 ? (
                        students
                          .filter(student => {
                             return registrations.some(reg => 
                               (reg.scheduleId?._id === viewingScheduleStudents._id || reg.scheduleId === viewingScheduleStudents._id) &&
                               (reg.studentId?._id === student._id || reg.studentId === student._id) &&
                               !['cancelled', 'completed', 'dropped'].includes(reg.status?.toLowerCase())
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
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                      <CustomDropdown
                                        options={[
                                          { value: 'active', label: 'Active', color: 'bg-green-500' },
                                          { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
                                          { value: 'completed', label: 'Completed', color: 'bg-blue-500' },
                                          { value: 'dropped', label: 'Dropped', color: 'bg-orange-500' },
                                          { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' }
                                        ]}
                                        value={currentStatus}
                                        onChange={(val) => {
                                          const newStatus = val;
                                          if (newStatus === 'dropped' || newStatus === 'cancelled') {
                                            setDropReasonModal({
                                              isOpen: true,
                                              appId: null,
                                              regId: reg._id,
                                              type: 'registration',
                                              reason: '2 Absences',
                                              customReason: ''
                                            });
                                          } else {
                                            setConfirmModal({
                                              isOpen: true,
                                              title: 'Update Registration Status',
                                              message: `Are you sure you want to change the status to ${newStatus}?`,
                                              type: 'warning',
                                              onConfirm: () => handleUpdateRegistrationStatus(reg._id, newStatus)
                                            });
                                          }
                                        }}
                                        placeholder="Status"
                                        darkMode={darkMode}
                                        className="min-w-[130px]"
                                        buttonClassName={`py-1.5 px-3 text-xs ${
                                          currentStatus === 'active' 
                                            ? (darkMode ? '!bg-green-900/30 !text-green-300 !ring-green-900/50' : '!bg-green-50 !text-green-700 !ring-green-200')
                                            : currentStatus === 'pending'
                                            ? (darkMode ? '!bg-yellow-900/30 !text-yellow-300 !ring-yellow-900/50' : '!bg-yellow-50 !text-yellow-700 !ring-yellow-200')
                                            : currentStatus === 'completed'
                                            ? (darkMode ? '!bg-blue-900/30 !text-blue-300 !ring-blue-900/50' : '!bg-blue-50 !text-blue-700 !ring-blue-200')
                                            : currentStatus === 'dropped'
                                            ? (darkMode ? '!bg-orange-900/30 !text-orange-300 !ring-orange-900/50' : '!bg-orange-50 !text-orange-700 !ring-orange-200')
                                            : (darkMode ? '!bg-red-900/30 !text-red-300 !ring-red-900/50' : '!bg-red-50 !text-red-700 !ring-red-200')
                                        }`}
                                      />
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

    </div>
    );
  };

  // --- START OF DASHBOARD SECTION ---
  const renderDashboard = () => ( 
    <div className="space-y-8 animate-in fade-in duration-500"> 
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard Overview</h2> 
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Here's what's happening with your organization today.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <AdminStats 
            schedules={schedules} 
            students={students} 
            assessments={assessments} 
            darkMode={darkMode} 
          />
          
          {/* Recent Students Section */}
          <RecentStudents 
            students={students} 
            registrations={registrations} 
            schedules={schedules} 
            darkMode={darkMode} 
            setActiveSection={setActiveSection} 
          />
        </>
      )}
    </div> 
  );


  // --- START OF SCHEDULE SECTION ---
  const handleCompleteAllScheduleStudents = () => {
    if (!viewingScheduleStudents) return;

    // Find all relevant registrations
    const eligibleRegistrations = registrations.filter(reg => 
      (reg.scheduleId?._id === viewingScheduleStudents._id || reg.scheduleId === viewingScheduleStudents._id) &&
      !['completed', 'cancelled', 'dropped'].includes(reg.status?.toLowerCase())
    );

    if (eligibleRegistrations.length === 0) {
      toast.error("No active or pending students to complete.");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Complete All Students',
      message: `Are you sure you want to mark ${eligibleRegistrations.length} students as Completed?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          setLoading(true);
          await Promise.all(eligibleRegistrations.map(reg => 
            authedFetch(`/api/registrations/${reg._id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'completed' })
            })
          ));
          
          await loadData(); // Refresh data
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          toast.success("All students marked as Completed successfully.");
        } catch (err) {
          console.error("Failed to complete all students:", err);
          toast.error("Failed to update some students. Please try again.");
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const renderSchedules = () => {
    // 1. Prepare Student History Data (Registrations)
    // Filter registrations that are considered "History" (Completed, Dropped, Cancelled)
    let historyRegistrations = registrations.filter(reg => 
      ['completed', 'dropped', 'cancelled', 'archived'].includes(reg.status?.toLowerCase())
    ).map(reg => {
      // Ensure we have populated data
      const student = students.find(s => s._id === (reg.studentId?._id || reg.studentId));
      const schedule = schedules.find(s => s._id === (reg.scheduleId?._id || reg.scheduleId));
      
      return {
        ...reg,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
        profilePicture: student?.profilePicture || '',
        courseTitle: schedule ? schedule.courseTitle : 'Unknown Course',
        courseId: schedule ? schedule.courseId : '',
        email: student?.email || '',
        mobile: student?.mobileNo || '',
        trainingDate: schedule?.trainingDate
      };
    });

    // 2. Get Unique Courses for Filter (from history items)
    const uniqueHistoryCourses = [...new Set(historyRegistrations.map(r => r.courseTitle).filter(Boolean))];

    // 3. Apply Filters to History Data
    // Status Filter
    if (scheduleHistoryFilter !== 'All') {
      historyRegistrations = historyRegistrations.filter(reg => 
        reg.status?.toLowerCase() === scheduleHistoryFilter.toLowerCase()
      );
    }
    
    // Course Filter
    if (scheduleHistoryCourseFilter !== 'All') {
      historyRegistrations = historyRegistrations.filter(reg => reg.courseTitle === scheduleHistoryCourseFilter);
    }

    // Search Filter (Student Name or Course)
    if (scheduleSearchTerm) {
      const lowerSearch = scheduleSearchTerm.toLowerCase();
      historyRegistrations = historyRegistrations.filter(reg => 
        reg.studentName.toLowerCase().includes(lowerSearch) ||
        reg.courseTitle.toLowerCase().includes(lowerSearch) ||
        reg.courseId.toLowerCase().includes(lowerSearch)
      );
    }

    // 4. Prepare Active Schedules Data
    const activeSchedules = schedules.filter(schedule => {
      const matchesSearch = (schedule.courseTitle || '').toLowerCase().includes(scheduleSearchTerm.toLowerCase()) ||
      (schedule.courseId || '').toLowerCase().includes(scheduleSearchTerm.toLowerCase());
      
      // Active view shows schedules that are NOT archived/completed (or show all except those strictly for history view if we were splitting schedules)
      // But typically "Active Schedules" means the schedule itself is active.
      // The user wants "Student History" tab.
      // So 'active' tab = List of Schedules.
      // 'history' tab = List of Students (Registrations).
      
      return matchesSearch && !['Archived', 'Cancelled'].includes(schedule.status);
    });

    const renderStudentHistoryTable = () => (
      <div className={`rounded-3xl shadow-xl border overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${darkMode ? 'bg-gray-800/50 backdrop-blur-xl border-gray-700 shadow-black/20' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/30'}`}>
                <th className={`px-8 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Student Name</th>
                <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Course</th>
                <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Contact</th>
                <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                <th className={`px-8 py-5 text-right text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
              {historyRegistrations.length > 0 ? (
                historyRegistrations.map((reg) => (
                  <tr key={reg._id} className={`group transition-all duration-200 ${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-blue-50/30'}`}>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                         <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-offset-2 transition-all overflow-hidden ${
                            darkMode ? 'bg-gray-700 text-gray-300 ring-gray-800 group-hover:ring-gray-700' : 'bg-blue-100 text-blue-600 ring-white group-hover:ring-blue-50'
                         }`}>
                            {reg.profilePicture ? (
                              <img src={reg.profilePicture} alt={reg.studentName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{reg.studentName.charAt(0)}</span>
                            )}
                         </div>
                         <div className="flex flex-col">
                           <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {reg.studentName}
                           </span>
                         </div>
                      </div>
                    </td>
                    <td className={`px-6 py-5 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {reg.courseTitle}
                      <span className={`block text-xs font-normal ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{reg.courseId}</span>
                    </td>
                    <td className={`px-6 py-5 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="flex flex-col">
                        <span>{reg.email}</span>
                        <span className="text-xs opacity-70">{reg.mobile}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        reg.status === 'completed' 
                          ? (darkMode ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-600 border-green-200')
                          : reg.status === 'dropped'
                          ? (darkMode ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-600 border-orange-200')
                          : (darkMode ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200')
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                           reg.status === 'completed' ? 'bg-green-500' : 
                           reg.status === 'dropped' ? 'bg-orange-500' : 'bg-red-500'
                        }`}></span>
                        {reg.status ? reg.status.charAt(0).toUpperCase() + reg.status.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-right">
                       <div className="flex items-center justify-end gap-2">
                          {(reg.status === 'dropped' || reg.status === 'cancelled') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewReasonModal({
                                  isOpen: true,
                                  reason: reg.remarks || 'No reason provided',
                                  applicantName: reg.studentName
                                });
                              }}
                              className={`p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 ${
                                darkMode ? 'text-blue-400 hover:bg-blue-500/20' : 'text-blue-600 hover:bg-blue-50'
                              }`}
                              title="View Reason"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                               e.stopPropagation();
                               handleDeleteRegistration(reg._id);
                            }}
                            className={`p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 ${
                               darkMode ? 'text-gray-400 hover:bg-red-500/20 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                            }`}
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                     </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className={`px-6 py-20 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className={`p-4 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                         <Search className="w-8 h-8 opacity-20" />
                      </div>
                      <div className="space-y-1">
                         <p className="text-lg font-medium">No student history found</p>
                         <p className="text-sm opacity-60">Try adjusting your filters</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );

    return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Schedule Management</h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage training schedules and student enrollments</p>
        </div>
        
        {scheduleSubTab === 'active' && (
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-grow sm:flex-grow-0 group">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors ${darkMode ? 'text-gray-500 group-focus-within:text-blue-500' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
              <input
                type="text"
                placeholder="Search schedules..."
                value={scheduleSearchTerm}
                onChange={(e) => setScheduleSearchTerm(e.target.value)}
                className={`pl-11 pr-4 py-3 rounded-xl border-none ring-1 ring-inset focus:ring-2 transition-all w-full sm:w-72 text-sm font-medium ${
                  darkMode 
                    ? 'bg-gray-900/50 ring-gray-700 text-white placeholder-gray-500 focus:ring-blue-500/50 focus:bg-gray-900' 
                    : 'bg-white ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-blue-500/20 focus:bg-white focus:shadow-sm'
                }`}
              />
            </div>
            <button 
              onClick={() => {
                setEditingItem(null);
                setScheduleForm({ courseId: '', courseTitle: '', trainingDate: '', capacity: '', status: 'Active' });
                setActiveSubSection('schedule-form');
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all active:scale-95 font-medium text-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Add Schedule</span>
            </button>
          </div>
        )}
        
        {scheduleSubTab === 'history' && (
           <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0 group">
                <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors ${darkMode ? 'text-gray-500 group-focus-within:text-blue-500' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                <input
                  type="text"
                  placeholder="Search student history..."
                  value={scheduleSearchTerm}
                  onChange={(e) => setScheduleSearchTerm(e.target.value)}
                  className={`pl-11 pr-4 py-3 rounded-xl border-none ring-1 ring-inset focus:ring-2 transition-all w-full sm:w-72 text-sm font-medium ${
                    darkMode 
                      ? 'bg-gray-900/50 ring-gray-700 text-white placeholder-gray-500 focus:ring-blue-500/50 focus:bg-gray-900' 
                      : 'bg-white ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-blue-500/20 focus:bg-white focus:shadow-sm'
                  }`}
                />
              </div>
           </div>
        )}
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className={`p-1.5 rounded-2xl flex items-center gap-1 border w-fit ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
           {['active', 'history'].map((tab) => (
             <button
               key={tab}
               onClick={() => setScheduleSubTab(tab)}
               className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-300 ${
                 scheduleSubTab === tab 
                   ? (darkMode ? 'text-white' : 'text-gray-900') 
                   : (darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-900')
               }`}
             >
               {scheduleSubTab === tab && (
                 <motion.div
                   layoutId="activeScheduleTab"
                   className={`absolute inset-0 rounded-xl shadow-sm ring-1 ${darkMode ? 'bg-gray-800 shadow-black/20 ring-white/10' : 'bg-white ring-black/5'}`}
                   transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                 />
               )}
               <span className="relative z-10">
                 {tab === 'active' ? 'Active Schedules' : 'Student History'}
               </span>
             </button>
           ))}
        </div>

        {scheduleSubTab === 'history' && (
           <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
             {/* Status Filter */}
             <CustomDropdown
               options={[
                 { value: 'All', label: 'All Status' },
                 { value: 'Completed', label: 'Completed', color: 'bg-blue-500' },
                 { value: 'Dropped', label: 'Dropped', color: 'bg-orange-500' },
                 { value: 'Cancelled', label: 'Cancelled', color: 'bg-red-500' }
               ]}
               value={scheduleHistoryFilter}
               onChange={setScheduleHistoryFilter}
               placeholder="All Status"
               darkMode={darkMode}
             />

             {/* Course Filter */}
             <CustomDropdown
               options={[
                 { value: 'All', label: 'All Courses' },
                 ...uniqueHistoryCourses.map(title => ({ value: title, label: title }))
               ]}
               value={scheduleHistoryCourseFilter}
               onChange={setScheduleHistoryCourseFilter}
               placeholder="All Courses"
               darkMode={darkMode}
             />

             <button 
                onClick={handleDeleteAllHistoryRegistrations}
                className={`ml-2 flex items-center gap-2 px-4 py-2.5 rounded-xl ring-1 ring-inset transition-all duration-200 text-sm font-semibold active:scale-95 ${
                   darkMode 
                     ? 'bg-red-900/10 ring-red-900/30 text-red-400 hover:bg-red-900/30 hover:ring-red-900/50' 
                     : 'bg-white ring-red-100 text-red-500 hover:bg-red-50 hover:ring-red-200 hover:shadow-sm'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete All</span>
              </button>
           </div>
        )}
      </div>

      {/* Render Content based on Tab */}
      {scheduleSubTab === 'history' ? renderStudentHistoryTable() : (
        /* Active Schedules Table */
        <div className={`rounded-3xl shadow-xl border overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${darkMode ? 'bg-gray-800/50 backdrop-blur-xl border-gray-700 shadow-black/20' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={darkMode ? 'bg-gray-900/50' : 'bg-gray-50/30'}>
              <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <th className={`px-8 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>ID</th>
                <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Title</th>
                <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date</th>
                <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Capacity</th>
                <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Registered</th>
                <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                <th className={`px-8 py-5 text-right text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
              {activeSchedules.map((schedule) => (
                <tr 
                  key={schedule._id} 
                  className={`group transition-all duration-200 cursor-pointer ${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-blue-50/30'}`}
                  onClick={() => {
                    setViewingScheduleStudents(schedule);
                    setShowScheduleStudentsModal(true);
                  }}
                >
                  <td className={`px-8 py-5 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{schedule.courseId}</td>
                  <td className={`px-6 py-5 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {schedule.courseTitle}
                  </td>
                  <td className={`px-6 py-5 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {schedule.trainingDate ? new Date(schedule.trainingDate).toLocaleDateString() : '-'}
                  </td>
                  <td className={`px-6 py-5 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{schedule.capacity}</td>
                  <td className={`px-6 py-5 whitespace-nowrap text-sm font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {schedule.registered || 0}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      schedule.status === 'Active' || schedule.status === 'Ongoing'
                        ? (darkMode ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-600 border-green-200')
                        : schedule.status === 'Completed'
                        ? (darkMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200')
                        : schedule.status === 'Pending'
                        ? (darkMode ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-yellow-50 text-yellow-600 border-yellow-200')
                        : (darkMode ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200')
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                         schedule.status === 'Active' || schedule.status === 'Ongoing' ? 'bg-green-500' : 
                         schedule.status === 'Completed' ? 'bg-blue-500' :
                         schedule.status === 'Pending' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></span>
                      {schedule.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end items-center gap-2">
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           startEditSchedule(schedule);
                         }}
                         className={`p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 ${
                            darkMode ? 'text-gray-400 hover:bg-blue-500/20 hover:text-blue-400' : 'text-gray-400 hover:bg-blue-50 hover:text-blue-600'
                         }`}
                         title="Edit Schedule"
                       >
                         <Edit className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           handleDeleteSchedule(schedule._id);
                         }}
                         className={`p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 delay-75 ${
                            darkMode ? 'text-gray-400 hover:bg-red-500/20 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                         }`}
                         title="Delete Schedule"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
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
        let firstName = '';
        let lastName = '';

        if (app.name) {
           firstName = app.name.firstname;
           lastName = app.name.surname;
           studentName = `${firstName} ${lastName}`;
        } else if (app.studentId && app.studentId.name) {
           firstName = app.studentId.name.firstname;
           lastName = app.studentId.name.surname;
           studentName = `${firstName} ${lastName}`;
        }

        const dateObj = new Date(app.createdAt);

        return {
          id: app._id,
          studentName: studentName,
          firstName: firstName,
          lastName: lastName,
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
              <CustomDropdown
                options={[
                  { value: '', label: 'All Assessments' },
                  ...assessments.map(a => ({ value: a._id, label: a.title }))
                ]}
                value={salesAssessmentFilter}
                onChange={(val) => { setSalesAssessmentFilter(val); setSalesPage(1); }}
                placeholder="All Assessments"
                darkMode={darkMode}
                className="w-full min-w-[200px]"
              />
            </div>
          </div>
        </div>

        {/* Detailed Sales Report Section */}
        <div className={`rounded-2xl shadow-sm border overflow-hidden flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className={`px-6 py-5 border-b flex flex-col sm:flex-row justify-between items-center gap-4 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
             <div className="flex items-center gap-2">
               <h3 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Transaction History</h3>
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
                  <tr key={t.id} className={`group transition-all duration-200 ${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-blue-50/30'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-transform group-hover:scale-110 ${
                            darkMode ? 'bg-gradient-to-br from-purple-900 to-indigo-900 text-purple-300 ring-1 ring-gray-700' : 'bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-600 ring-1 ring-white'
                         }`}>
                            {t.firstName?.[0]}{t.lastName?.[0]}
                         </div>
                         <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                           {t.studentName}
                         </span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <div className="flex items-center gap-2">
                        <BookOpen className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        {t.assessmentTitle}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="flex flex-col">
                        <span className="font-medium">{t.date}</span>
                        <span className="text-xs opacity-70">{t.time}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        1
                      </span>
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
          <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>System Settings</h2>
          <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage global configurations and payment details</p>
        </div>
      </div>
      
      <div className={`rounded-2xl shadow-xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
          <div className="flex items-center gap-3 text-white">
            <CreditCard className="w-6 h-6 opacity-90" />
            <h3 className="text-xl font-bold tracking-tight">Payment Configuration</h3>
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

  const handleCompleteAllApplicants = () => {
    if (!viewingAssessmentApplicants) return;
    
    // Find all active/pending applicants for this assessment
    const applicantsToComplete = assessmentApps.filter(app => {
       const appId = app.assessmentId?._id || app.assessmentId;
       return appId === viewingAssessmentApplicants._id && 
              app.status !== 'Rejected' && 
              app.status !== 'Cancelled' && 
              app.status !== 'Completed' &&
              app.status !== 'Drop';
    });

    if (applicantsToComplete.length === 0) {
       setConfirmModal({
         isOpen: true,
         title: 'No Applicants',
         message: 'There are no eligible applicants to complete.',
         type: 'info',
         onConfirm: null
       });
       return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Complete All Applicants',
      message: `Are you sure you want to mark all ${applicantsToComplete.length} applicants as Completed?`,
      type: 'warning',
      onConfirm: async () => {
         try {
            const promises = applicantsToComplete.map(app => 
               authedFetch(`/api/assessment-applications/${app._id}`, {
                 method: 'PUT',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ status: 'Completed' })
               })
            );
            
            await Promise.all(promises);
            await loadData(true);
            
            setConfirmModal({
               isOpen: true,
               title: 'Success',
               message: 'All applicants have been marked as Completed.',
               type: 'success',
               onConfirm: null
            });
         } catch (err) {
            setConfirmModal({
               isOpen: true,
               title: 'Error',
               message: 'Failed to update some applicants: ' + err.message,
               type: 'danger',
               onConfirm: null
            });
         }
      }
    });
  };

  // --- START OF ASSESSMENT SECTION ---
  const renderAssessments = () => {
    const filteredAssessments = assessments.filter(assessment => 
      assessment.title.toLowerCase().includes(assessmentSearch.toLowerCase()) ||
      assessment.assessmentId.toLowerCase().includes(assessmentSearch.toLowerCase())
    );

    // Separate into active and history
    const activeAssessments = filteredAssessments.filter(a => !['Completed', 'Drop'].includes(a.status));

    // Get unique assessment titles for filter
    const uniqueHistoryTitles = [...new Set(assessmentApps.filter(app => ['Completed', 'Drop'].includes(app.status)).map(app => app.assessmentTitle))].filter(Boolean);

    const renderHistoryTable = () => {
      let historyApps = assessmentApps.filter(app => ['Completed', 'Drop'].includes(app.status));
      
      // Apply Status Filter
      if (assessmentHistoryFilter !== 'All') {
        historyApps = historyApps.filter(app => app.status === assessmentHistoryFilter);
      }

      // Apply Course Filter
      if (assessmentHistoryCourseFilter !== 'All') {
        historyApps = historyApps.filter(app => app.assessmentTitle === assessmentHistoryCourseFilter);
      }

      // Apply Search Filter (using same assessmentSearch)
      if (assessmentSearch) {
        const searchLower = assessmentSearch.toLowerCase();
        historyApps = historyApps.filter(app => 
           (app.name?.firstname || '').toLowerCase().includes(searchLower) ||
           (app.name?.surname || '').toLowerCase().includes(searchLower) ||
           (app.assessmentTitle || '').toLowerCase().includes(searchLower)
        );
      }

      return (
        <div className={`rounded-3xl shadow-xl border overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${darkMode ? 'bg-gray-800/50 backdrop-blur-xl border-gray-700 shadow-black/20' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/30'}`}>
                  <th className={`px-8 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Applicant</th>
                  <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Assessment</th>
                  <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Contact</th>
                  <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Payment Mode</th>
                  <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                  <th className={`px-8 py-5 text-right text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
                {historyApps.length > 0 ? (
                  historyApps.map((app) => {
                    const assessment = assessments.find(a => a._id === (app.assessmentId?._id || app.assessmentId));
                    return (
                    <tr key={app._id} className={`group transition-all duration-200 ${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-blue-50/30'}`}>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                           <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-offset-2 transition-all ${
                              darkMode ? 'bg-gray-700 text-gray-300 ring-gray-800 group-hover:ring-gray-700' : 'bg-blue-100 text-blue-600 ring-white group-hover:ring-blue-50'
                           }`}>
                              {app.name?.firstname?.[0]}{app.name?.surname?.[0]}
                           </div>
                           <div className="flex flex-col">
                             <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {app.name?.firstname} {app.name?.surname}
                             </span>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col">
                           <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {app.assessmentTitle}
                           </span>
                           <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {assessment?.assessmentId || 'N/A'}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                           <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {app.contact?.email || 'N/A'}
                           </span>
                           <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              {app.contact?.mobile || 'N/A'}
                           </span>
                        </div>
                      </td>
                      <td className={`px-6 py-5 whitespace-nowrap text-sm`}>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          app.payment?.isOnline 
                            ? (darkMode ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-600 border-purple-200')
                            : (darkMode ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-600 border-orange-200')
                        }`}>
                          {app.payment?.isOnline ? 'Online (GCash)' : 'Walk-in'}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          app.status === 'Completed' 
                            ? (darkMode ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-600 border-green-200')
                            : (darkMode ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200')
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                             app.status === 'Completed' ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          {app.status === 'Drop' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewReasonModal({
                                  isOpen: true,
                                  reason: app.remarks || 'No reason provided',
                                  applicantName: `${app.name?.firstname} ${app.name?.surname}`
                                });
                              }}
                              className={`p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 ${
                                darkMode ? 'text-blue-400 hover:bg-blue-500/20' : 'text-blue-600 hover:bg-blue-50'
                              }`}
                              title="View Drop Reason"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                               e.stopPropagation();
                               handleDeleteAssessmentApp(app._id);
                            }}
                            className={`p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 ${
                               darkMode ? 'text-gray-400 hover:bg-red-500/20 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                            }`}
                            title="Delete Record"
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
                    <td colSpan="6" className={`px-6 py-20 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className={`p-4 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                           <Search className="w-8 h-8 opacity-20" />
                        </div>
                        <div className="space-y-1">
                           <p className="text-lg font-medium">No history found</p>
                           <p className="text-sm opacity-60">Try adjusting your filters</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-1">
              <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Assessment Management</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage your assessment offerings and student history</p>
            </div>
            
            {activeSubSection !== 'applications' && (
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* Search Bar */}
                <div className="relative flex-grow sm:flex-grow-0 group">
                  <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors ${darkMode ? 'text-gray-500 group-focus-within:text-blue-500' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                  <input
                    type="text"
                    placeholder={assessmentSubTab === 'active' ? "Search assessments..." : "Search student history..."}
                    value={assessmentSearch}
                    onChange={(e) => setAssessmentSearch(e.target.value)}
                    className={`pl-11 pr-4 py-3 rounded-xl border-none ring-1 ring-inset focus:ring-2 transition-all w-full sm:w-72 text-sm font-medium ${
                      darkMode 
                        ? 'bg-gray-900/50 ring-gray-700 text-white placeholder-gray-500 focus:ring-blue-500/50 focus:bg-gray-900' 
                        : 'bg-white ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-blue-500/20 focus:bg-white focus:shadow-sm'
                    }`}
                  />
                </div>
                <button 
                  onClick={() => {
                    setEditingItem(null);
                    setAssessmentForm({ assessmentId: '', title: '', fee: '', status: 'Active', dropReason: '' });
                    setActiveSubSection('assessment-form');
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all active:scale-95 font-medium text-sm"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Assessment</span>
                </button>
              </div>
            )}
          </div>

           {/* Sub Tabs */}
           {activeSubSection !== 'applications' && (
             <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
               {/* Modern Pill Tabs */}
               <div className={`p-1.5 rounded-2xl flex items-center gap-1 border ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                  {['active', 'history'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setAssessmentSubTab(tab)}
                      className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-300 ${
                        assessmentSubTab === tab 
                          ? (darkMode ? 'text-white' : 'text-gray-900') 
                          : (darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-900')
                      }`}
                    >
                      {assessmentSubTab === tab && (
                        <motion.div
                          layoutId="activeAssessmentTab"
                          className={`absolute inset-0 rounded-xl shadow-sm ring-1 ${darkMode ? 'bg-gray-800 shadow-black/20 ring-white/10' : 'bg-white ring-black/5'}`}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">
                        {tab === 'active' ? 'Active Assessments' : 'Assessment History'}
                      </span>
                    </button>
                  ))}
               </div>
               
               {assessmentSubTab === 'history' && (
                 <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
                   {/* Status Filter */}
                  <CustomDropdown
                    options={[
                      { value: 'All', label: 'All Status' },
                      { value: 'Completed', label: 'Completed', color: 'bg-green-500' },
                      { value: 'Drop', label: 'Dropped', color: 'bg-red-500' }
                    ]}
                    value={assessmentHistoryFilter}
                    onChange={setAssessmentHistoryFilter}
                    placeholder="All Status"
                    darkMode={darkMode}
                  />

                  {/* Course Filter */}
                  <CustomDropdown
                    options={[
                      { value: 'All', label: 'All Courses' },
                      ...uniqueHistoryTitles.map(title => ({ value: title, label: title }))
                    ]}
                    value={assessmentHistoryCourseFilter}
                    onChange={setAssessmentHistoryCourseFilter}
                    placeholder="All Courses"
                    darkMode={darkMode}
                  />
                  
                  <button 
                    onClick={handleDeleteAllHistory}
                    className={`ml-2 flex items-center gap-2 px-4 py-2.5 rounded-xl ring-1 ring-inset transition-all duration-200 text-sm font-semibold active:scale-95 ${
                       darkMode 
                         ? 'bg-red-900/10 ring-red-900/30 text-red-400 hover:bg-red-900/30 hover:ring-red-900/50' 
                         : 'bg-white ring-red-100 text-red-500 hover:bg-red-50 hover:ring-red-200 hover:shadow-sm'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete All</span>
                  </button>
                </div>
              )}
             </div>
          )}
        </div>

        {activeSubSection === 'applications' ? (
           renderAssessmentApps()
        ) : assessmentSubTab === 'history' ? (
           renderHistoryTable()
        ) : (
          /* Table Section for Active Assessments */
          <div className={`rounded-3xl shadow-xl border overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${darkMode ? 'bg-gray-800/50 backdrop-blur-xl border-gray-700 shadow-black/20' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={darkMode ? 'bg-gray-900/50' : 'bg-gray-50/30'}>
                  <tr className={`border-b ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/30'}`}>
                  <th className={`px-8 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>ID</th>
                  <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Title</th>
                  <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fee</th>
                  <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Registered</th>
                  <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                  <th className={`px-8 py-5 text-right text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
                </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
                  {activeAssessments.length > 0 ? (
                    activeAssessments.map((assessment) => (
                      <tr 
                        key={assessment._id} 
                        className={`group transition-all duration-200 cursor-pointer ${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-blue-50/30'}`}
                        onClick={() => {
                          setViewingAssessmentApplicants(assessment);
                          setShowAssessmentApplicantsModal(true);
                        }}
                      >
                        <td className={`px-8 py-5 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl shadow-sm transition-transform group-hover:scale-105 ${darkMode ? 'bg-gradient-to-br from-blue-900/50 to-indigo-900/50 text-blue-300 ring-1 ring-gray-700' : 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 ring-1 ring-blue-100'}`}>
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <span className="font-semibold">{assessment.assessmentId}</span>
                          </div>
                        </td>
                        <td className={`px-6 py-5 whitespace-nowrap text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{assessment.title}</td>
                        <td className={`px-6 py-5 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>₱{Number(assessment.fee).toLocaleString()}</td>
                        <td className={`px-6 py-5 whitespace-nowrap text-sm`}>
                          <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${darkMode ? 'bg-blue-900/20 text-blue-400 border-blue-900/30' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                            {assessmentApps.filter(app => {
                               const appId = app.assessmentId?._id || app.assessmentId;
                               return appId === assessment._id && app.status === 'Approved';
                            }).length} Applicants
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm">
                          {(() => {
                            const displayStatus = assessment.status;
                            let badgeClass = '';
                            if (displayStatus === 'Active') {
                              badgeClass = darkMode ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-600 border-green-200';
                            } else if (displayStatus === 'Pending') {
                              badgeClass = darkMode ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-yellow-50 text-yellow-600 border-yellow-200';
                            } else {
                              badgeClass = darkMode ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : 'bg-gray-50 text-gray-600 border-gray-200';
                            }
                            
                            return (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badgeClass}`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                   displayStatus === 'Active' ? 'bg-green-500' : displayStatus === 'Pending' ? 'bg-yellow-500' : 'bg-gray-500'
                                }`}></span>
                                {displayStatus}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditAssessment(assessment);
                              }}
                              className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-blue-400 hover:bg-blue-500/20' : 'text-blue-600 hover:bg-blue-50'}`}
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAssessment(assessment._id);
                              }}
                              className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-50'}`}
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
                      <td colSpan={7} className={`px-6 py-20 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <div className="flex flex-col items-center justify-center gap-4">
                          <div className={`p-4 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                             <Search className="w-8 h-8 opacity-20" />
                          </div>
                          <div className="space-y-1">
                             <p className="text-lg font-medium">No active assessments found</p>
                             <p className="text-sm opacity-60">Try adjusting your search terms</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} transition-colors duration-300`}>
      {/* Sidebar */}
      <div className={`w-64 shadow-lg fixed h-full z-20 hidden md:block transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-r border-gray-700' : 'bg-white'}`}>
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center p-1.5 shadow-sm transition-all ${darkMode ? 'bg-white shadow-blue-900/20' : 'bg-white border border-gray-100 shadow-gray-200'}`}>
              <img src="/Logo_MTC.png" alt="MTC Logo" className="w-full h-full object-contain" />
            </div>
            <span className={`font-bold text-xl tracking-tight transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Admin Portal
            </span>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          {[
            { id: 'dashboard', icon: Home, label: 'Dashboard' },
            { 
              id: 'schedules', 
              icon: Calendar, 
              label: 'Schedules',
              subItems: [
                { id: '', label: 'Schedule Management' },
                { id: 'students', label: 'Students' }
              ]
            },
            { 
              id: 'assessments', 
              icon: Award, 
              label: 'Assessments',
              subItems: [
                { id: '', label: 'Assessments List' },
                { id: 'applications', label: 'Applications' }
              ]
            },
            { id: 'sales-reports', icon: TrendingUp, label: 'Sales Reports' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map((item) => (
            <div key={item.id}>
              <button 
                onClick={() => { 
                  if (item.subItems) {
                    if (activeSection === item.id) {
                      // Toggle expansion behavior if needed, or just stay
                    } else {
                      setActiveSection(item.id); 
                      setActiveSubSection(''); 
                    }
                  } else {
                    setActiveSection(item.id); 
                    setActiveSubSection(''); 
                  }
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition ${
                  activeSection === item.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'}`
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </div>
                {item.subItems && (
                   <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeSection === item.id ? 'rotate-180' : ''}`} />
                )}
              </button>

              <AnimatePresence>
                {item.subItems && activeSection === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden ml-4"
                  >
                    <div className={`mt-1 space-y-1 pl-4 border-l ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      {item.subItems.map(subItem => (
                        <button
                          key={subItem.id}
                          onClick={() => setActiveSubSection(subItem.id)}
                          className={`w-full text-left px-4 py-2 text-sm rounded-lg transition ${
                            activeSubSection === subItem.id
                              ? (darkMode ? 'text-blue-400 bg-gray-800 font-medium' : 'text-blue-600 bg-blue-50 font-medium')
                              : (darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-900')
                          }`}
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
        <header className={`sticky top-0 z-50 flex w-full drop-shadow-sm ${darkMode ? 'bg-gray-800 text-white shadow-md' : 'bg-white shadow-sm'} transition-colors duration-300`}>
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
            {activeSection === 'schedules' && (
              (activeSubSection === 'students' || activeSubSection === 'view-student' || activeSubSection === 'student-form')
                ? (
                  <StudentManager 
                    students={students}
                    registrations={registrations}
                    schedules={schedules}
                    darkMode={darkMode}
                    loadData={loadData}
                    setConfirmModal={setConfirmModal}
                  />
                )
                : renderSchedules()
            )}
            {/* activeSection === 'students' removed as it is now a sub-section of schedules */}
            {activeSection === 'assessments' && renderAssessments()}
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

              <h3 className={`text-2xl font-bold tracking-tight mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit Profile</h3>
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

                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Confirm Password</label>
                  <div className="relative group">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                      profileErrors.confirmPassword
                        ? 'text-red-500'
                        : darkMode ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-500'
                    }`} />
                    <input 
                      type="password" 
                      value={profileForm.confirmPassword}
                      onChange={(e) => {
                        setProfileForm({...profileForm, confirmPassword: e.target.value});
                        if (profileErrors.confirmPassword) setProfileErrors(prev => ({ ...prev, confirmPassword: null }));
                      }}
                      placeholder="Confirm new password"
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 outline-none transition-all ${
                        profileErrors.confirmPassword
                          ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-100 placeholder-red-300'
                          : darkMode 
                            ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:bg-gray-700' 
                            : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10'
                      }`}
                    />
                  </div>
                  {profileErrors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1 ml-1 animate-in slide-in-from-top-1">{profileErrors.confirmPassword}</p>
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

      {/* Assessment Applicants Modal */}
      {showAssessmentApplicantsModal && viewingAssessmentApplicants && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Modern Header */}
            <div className={`px-6 py-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
              <div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Assessment Applicants</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{viewingAssessmentApplicants.assessmentId}</span>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>•</span>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{viewingAssessmentApplicants.title}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                 <button 
                    onClick={handleCompleteAllApplicants}
                    className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-2"
                 >
                    <CheckCircle2 className="w-4 h-4" />
                    Complete All
                 </button>
                 <button 
                    onClick={() => setShowAssessmentApplicantsModal(false)} 
                    className={`p-2 rounded-full transition-all ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                 >
                    <X className="w-5 h-5" />
                 </button>
              </div>
            </div>
            
            <div className="p-0">
              <div className="overflow-x-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                <table className="w-full">
                  <thead className={`sticky top-0 z-10 ${darkMode ? 'bg-gray-800/95 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm'}`}>
                    <tr>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Applicant</th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Contact Info</th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Payment</th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                    {assessmentApps
                      .filter(app => {
                         const appId = app.assessmentId?._id || app.assessmentId;
                         return appId === viewingAssessmentApplicants._id && app.status === 'Approved';
                      })
                      .length > 0 ? (
                        assessmentApps
                          .filter(app => {
                             const appId = app.assessmentId?._id || app.assessmentId;
                             return appId === viewingAssessmentApplicants._id && app.status === 'Approved';
                          })
                          .map((app) => (
                            <tr key={app._id} className={`group transition-colors ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ring-2 ring-offset-2 transition-all ${
                                    darkMode ? 'bg-gray-700 text-gray-300 ring-gray-800 group-hover:ring-gray-700' : 'bg-blue-100 text-blue-600 ring-white group-hover:ring-blue-50'
                                  }`}>
                                    {app.name?.firstname?.[0]}{app.name?.surname?.[0]}
                                  </div>
                                  <div>
                                    <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {app.name?.firstname} {app.name?.surname}
                                    </div>
                                    <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                      Applied: {new Date(app.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <Mail className="w-3.5 h-3.5 opacity-70" />
                                    {app.contact?.email || 'N/A'}
                                  </div>
                                  <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <Phone className="w-3.5 h-3.5 opacity-70" />
                                    {app.contact?.mobile || 'N/A'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                                  app.payment?.isOnline 
                                    ? (darkMode ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-600 border-purple-200')
                                    : (darkMode ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-600 border-orange-200')
                                }`}>
                                  {app.payment?.isOnline ? 'Online (GCash)' : 'Walk-in'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="relative group/select" onClick={(e) => e.stopPropagation()}>
                                  <CustomDropdown
                                    options={[
                                      { value: 'Pending', label: 'Pending', color: 'bg-yellow-500' },
                                      { value: 'Approved', label: 'Approved', color: 'bg-green-500' },
                                      { value: 'Completed', label: 'Completed', color: 'bg-blue-500' },
                                      { value: 'Drop', label: 'Drop', color: 'bg-red-500' },
                                      { value: 'Rejected', label: 'Rejected', color: 'bg-red-500' }
                                    ]}
                                    value={app.status}
                                    onChange={(val) => {
                                      const newStatus = val;
                                      if (newStatus === 'Drop') {
                                        setDropReasonModal({
                                          isOpen: true,
                                          appId: app._id,
                                          reason: '2 Absences',
                                          customReason: ''
                                        });
                                      } else {
                                        setConfirmModal({
                                          isOpen: true,
                                          title: 'Update Status',
                                          message: `Change status to ${newStatus}?`,
                                          type: 'warning',
                                          onConfirm: () => executeUpdateAppStatus(app._id, newStatus)
                                        });
                                      }
                                    }}
                                    placeholder="Status"
                                    darkMode={darkMode}
                                    className="min-w-[120px]"
                                    buttonClassName={`!py-1.5 !px-3 !text-xs !rounded-full !border ${
                                      app.status === 'Approved' ? (darkMode ? '!bg-green-500/10 !text-green-400 !border-green-500/20' : '!bg-green-50 !text-green-700 !border-green-200') :
                                      app.status === 'Completed' ? (darkMode ? '!bg-blue-500/10 !text-blue-400 !border-blue-500/20' : '!bg-blue-50 !text-blue-700 !border-blue-200') :
                                      app.status === 'Drop' ? (darkMode ? '!bg-red-500/10 !text-red-400 !border-red-500/20' : '!bg-red-50 !text-red-700 !border-red-200') :
                                      (darkMode ? '!bg-yellow-500/10 !text-yellow-400 !border-yellow-500/20' : '!bg-yellow-50 !text-yellow-700 !border-yellow-200')
                                    }`}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="3" className={`px-6 py-12 text-center`}>
                            <div className="flex flex-col items-center gap-3">
                              <div className={`p-4 rounded-full ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                                <Users className={`w-8 h-8 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                              </div>
                              <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                No applicants found for this assessment.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`px-6 py-4 flex justify-end gap-3 border-t ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <button 
                onClick={() => setShowAssessmentApplicantsModal(false)}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assessment Modal (Moved to root) */}
      {activeSubSection === 'assessment-form' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-gray-800 ring-1 ring-white/10' : 'bg-white ring-1 ring-black/5'}`}>
            {/* Modern Header */}
            <div className={`px-8 py-6 border-b flex justify-between items-start ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-white'}`}>
              <div>
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{editingItem ? 'Edit Assessment' : 'New Assessment'}</h3>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{editingItem ? 'Update assessment details below' : 'Create a new assessment offering'}</p>
              </div>
              <button 
                onClick={() => setActiveSubSection('')} 
                className={`p-2 rounded-full transition-all ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-8 space-y-6">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Assessment ID</label>
                <div className="relative group">
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${darkMode ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-500'}`}>
                    <Hash className="w-5 h-5" />
                  </div>
                  <input 
                    type="text" 
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium outline-none ring-1 ring-inset transition-all ${
                      darkMode 
                        ? 'bg-gray-900/50 ring-gray-700 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/50 focus:bg-gray-900' 
                        : 'bg-gray-50 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:shadow-sm'
                    }`}
                    placeholder="e.g., ASM-001"
                    value={assessmentForm.assessmentId}
                    onChange={(e) => setAssessmentForm({...assessmentForm, assessmentId: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Title</label>
                <div className="relative group">
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${darkMode ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-500'}`}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <input 
                    type="text" 
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium outline-none ring-1 ring-inset transition-all ${
                      darkMode 
                        ? 'bg-gray-900/50 ring-gray-700 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/50 focus:bg-gray-900' 
                        : 'bg-gray-50 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:shadow-sm'
                    }`}
                    placeholder="e.g., NC II Assessment"
                    value={assessmentForm.title}
                    onChange={(e) => setAssessmentForm({...assessmentForm, title: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fee (₱)</label>
                <div className="relative group">
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${darkMode ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-500'}`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <input 
                    type="number" 
                    min="0"
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium outline-none ring-1 ring-inset transition-all ${
                      darkMode 
                        ? 'bg-gray-900/50 ring-gray-700 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/50 focus:bg-gray-900' 
                        : 'bg-gray-50 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:shadow-sm'
                    }`}
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
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</label>
                <div className="relative group">
                  <CustomDropdown
                    options={[
                      { value: 'Active', label: 'Active', color: 'bg-green-500' },
                      { value: 'Pending', label: 'Pending', color: 'bg-yellow-500' },
                      ...(editingItem ? [
                        { value: 'Closed', label: 'Closed', color: 'bg-gray-500' },
                        { value: 'Completed', label: 'Completed', color: 'bg-blue-500' },
                        { value: 'Drop', label: 'Drop', color: 'bg-red-500' }
                      ] : [])
                    ]}
                    value={assessmentForm.status}
                    onChange={(val) => setAssessmentForm({...assessmentForm, status: val})}
                    placeholder="Select Status"
                    darkMode={darkMode}
                    className="w-full"
                    buttonClassName="py-3.5"
                  />
                </div>
              </div>

              {assessmentForm.status === 'Drop' && (
                 <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Drop Reason</label>
                    <textarea 
                      className={`w-full px-4 py-3.5 rounded-xl text-sm font-medium outline-none ring-1 ring-inset transition-all ${
                        darkMode 
                          ? 'bg-gray-900/50 ring-gray-700 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/50 focus:bg-gray-900' 
                          : 'bg-gray-50 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:shadow-sm'
                      }`}
                      placeholder="Enter reason for dropping..."
                      value={assessmentForm.dropReason}
                      onChange={(e) => setAssessmentForm({...assessmentForm, dropReason: e.target.value})}
                      rows={3}
                    />
                 </div>
              )}
            </div>

            {/* Footer */}
            <div className={`px-8 py-6 flex justify-end gap-3 border-t ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-100'}`}>
              <button 
                onClick={() => setActiveSubSection('')}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAssessment}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-500 hover:to-indigo-500 font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm"
              >
                {editingItem ? 'Save Changes' : 'Create Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal (Moved to root) */}
      {activeSubSection === 'schedule-form' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-gray-800 ring-1 ring-white/10' : 'bg-white ring-1 ring-black/5'}`}>
            {/* Header */}
            <div className={`px-8 py-6 border-b flex justify-between items-start ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-white'}`}>
              <div>
                <h3 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{editingItem ? 'Edit Schedule' : 'New Schedule'}</h3>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{editingItem ? 'Update schedule details below' : 'Create a new class schedule'}</p>
              </div>
              <button onClick={() => setActiveSubSection('')} className={`p-2 rounded-full transition-all ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-8 space-y-6">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Course ID</label>
                <input 
                  type="text" 
                  className={`w-full px-4 py-3.5 rounded-xl text-sm font-medium outline-none ring-1 ring-inset transition-all ${
                    darkMode 
                      ? 'bg-gray-900/50 ring-gray-700 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/50 focus:bg-gray-900' 
                      : 'bg-gray-50 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:shadow-sm'
                  } ${scheduleErrors.courseId ? 'ring-red-500' : ''}`}
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
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Course Title</label>
                <input 
                  type="text" 
                  className={`w-full px-4 py-3.5 rounded-xl text-sm font-medium outline-none ring-1 ring-inset transition-all ${
                    darkMode 
                      ? 'bg-gray-900/50 ring-gray-700 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/50 focus:bg-gray-900' 
                      : 'bg-gray-50 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:shadow-sm'
                  } ${scheduleErrors.courseTitle ? 'ring-red-500' : ''}`}
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
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Training Date</label>
                  <input 
                    type="date" 
                    className={`w-full px-4 py-3.5 rounded-xl text-sm font-medium outline-none ring-1 ring-inset transition-all ${
                      darkMode 
                        ? 'bg-gray-900/50 ring-gray-700 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/50 focus:bg-gray-900' 
                        : 'bg-gray-50 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:shadow-sm'
                    } ${scheduleErrors.trainingDate ? 'ring-red-500' : ''}`}
                    value={scheduleForm.trainingDate}
                    onChange={(e) => {
                      setScheduleForm({...scheduleForm, trainingDate: e.target.value});
                      if (scheduleErrors.trainingDate) setScheduleErrors({...scheduleErrors, trainingDate: ''});
                    }}
                  />
                  {scheduleErrors.trainingDate && <p className="mt-1 text-sm text-red-500 font-medium">{scheduleErrors.trainingDate}</p>}
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Capacity</label>
                  <input 
                    type="number" 
                    min="0"
                    className={`w-full px-4 py-3.5 rounded-xl text-sm font-medium outline-none ring-1 ring-inset transition-all ${
                      darkMode 
                        ? 'bg-gray-900/50 ring-gray-700 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/50 focus:bg-gray-900' 
                        : 'bg-gray-50 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:shadow-sm'
                    } ${scheduleErrors.capacity ? 'ring-red-500' : ''}`}
                    placeholder="0"
                    value={scheduleForm.capacity}
                    onKeyDown={(e) => {
                      if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d+$/.test(val)) {
                        setScheduleForm({...scheduleForm, capacity: val});
                        if (scheduleErrors.capacity) setScheduleErrors({...scheduleErrors, capacity: ''});
                      }
                    }}
                  />
                  {scheduleErrors.capacity && <p className="mt-1 text-sm text-red-500 font-medium">{scheduleErrors.capacity}</p>}
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</label>
                <div className="relative group">
                  <CustomDropdown
                    options={[
                      { value: 'Active', label: 'Active', color: 'bg-green-500' },
                      { value: 'Ongoing', label: 'Ongoing', color: 'bg-blue-500' },
                      { value: 'Pending', label: 'Pending', color: 'bg-yellow-500' },
                      { value: 'Closed', label: 'Closed', color: 'bg-red-500' }
                    ]}
                    value={scheduleForm.status || 'Active'}
                    onChange={(val) => setScheduleForm({...scheduleForm, status: val})}
                    placeholder="Select Status"
                    darkMode={darkMode}
                    className="w-full"
                    buttonClassName="py-3.5"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className={`pt-6 flex justify-end gap-3 border-t mt-4 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <button 
                  onClick={() => setActiveSubSection('')}
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveSchedule}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-500 hover:to-indigo-500 font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm"
                >
                  {editingItem ? 'Update Schedule' : 'Add Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enrolled Students Modal */}
      {showScheduleStudentsModal && viewingScheduleStudents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ${darkMode ? 'bg-gray-900/95 ring-white/10' : 'bg-white/95 ring-black/5'}`}>
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5">
              <div className="flex flex-col gap-1">
                <h3 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Enrolled Students
                </h3>
                <div className="flex items-center gap-2">
                   <span className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                     {viewingScheduleStudents.courseTitle}
                   </span>
                   <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                     {viewingScheduleStudents.courseId}
                   </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <button 
                    onClick={handleCompleteAllScheduleStudents}
                    className="group relative px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 overflow-hidden"
                 >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <CheckCircle2 className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Complete All</span>
                 </button>
                 <button 
                    onClick={() => setShowScheduleStudentsModal(false)} 
                    className={`p-2 rounded-full transition-all duration-200 ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                 >
                    <X className="w-6 h-6" />
                 </button>
              </div>
            </div>
            
            <div className="p-0">
              <div className="overflow-x-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                <table className="w-full">
                  <thead className={`sticky top-0 z-10 ${darkMode ? 'bg-gray-900/95 backdrop-blur-sm' : 'bg-gray-50/95 backdrop-blur-sm'}`}>
                    <tr>
                      <th className={`px-8 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Student</th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Contact Info</th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Progress</th>
                      <th className={`px-8 py-4 text-right text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
                    {students
                      .filter(student => {
                         return registrations.some(reg => 
                           (reg.scheduleId?._id === viewingScheduleStudents._id || reg.scheduleId === viewingScheduleStudents._id) &&
                           (reg.studentId?._id === student._id || reg.studentId === student._id) &&
                           !['cancelled', 'completed', 'dropped'].includes(reg.status?.toLowerCase())
                         );
                      })
                      .length > 0 ? (
                        students
                          .filter(student => {
                             return registrations.some(reg => 
                               (reg.scheduleId?._id === viewingScheduleStudents._id || reg.scheduleId === viewingScheduleStudents._id) &&
                               (reg.studentId?._id === student._id || reg.studentId === student._id) &&
                               !['cancelled', 'completed', 'dropped'].includes(reg.status?.toLowerCase())
                             );
                          })
                          .map((student) => {
                            const reg = registrations.find(r => 
                              (r.studentId?._id === student._id || r.studentId === student._id) && 
                              (r.scheduleId?._id === viewingScheduleStudents._id || r.scheduleId === viewingScheduleStudents._id)
                            );
                            
                            if (!reg) return null;
                            const currentStatus = reg.status || 'active';

                            return (
                              <tr key={student._id} className={`group transition-colors duration-200 ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-blue-50/30'}`}>
                                <td className="px-8 py-5">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ring-2 ring-offset-2 transition-all overflow-hidden ${
                                       darkMode 
                                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white ring-gray-800 group-hover:ring-gray-700' 
                                        : 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white ring-white group-hover:ring-blue-50'
                                    }`}>
                                       {student.profilePicture ? (
                                         <img src={student.profilePicture} alt={`${student.firstName} ${student.lastName}`} className="w-full h-full object-cover" />
                                       ) : (
                                         <span>{student.firstName.charAt(0)}{student.lastName.charAt(0)}</span>
                                       )}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {student.firstName} {student.lastName}
                                      </span>
                                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        ID: {student._id.slice(-6).toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <Mail className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{student.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Phone className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{student.mobileNo}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="w-full max-w-[140px]">
                                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                      <div 
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          currentStatus === 'completed' ? 'bg-green-500 w-full' :
                                          currentStatus === 'active' ? 'bg-blue-500 w-[25%]' :
                                          currentStatus === 'pending' ? 'bg-yellow-500 w-[10%]' :
                                          'bg-red-500 w-full'
                                        }`} 
                                      />
                                    </div>
                                    <span className={`text-xs mt-1.5 block font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {currentStatus === 'completed' ? '100% Complete' : 
                                       currentStatus === 'active' ? 'In Progress' :
                                       currentStatus === 'pending' ? 'Pending Approval' : 'Dropped/Cancelled'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                  <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                                      <CustomDropdown
                                        options={[
                                          { value: 'active', label: 'Active', color: 'bg-green-500' },
                                          { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
                                          { value: 'completed', label: 'Completed', color: 'bg-blue-500' },
                                          { value: 'dropped', label: 'Dropped', color: 'bg-orange-500' },
                                          { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' }
                                        ]}
                                        value={currentStatus}
                                        onChange={(val) => {
                                          const newStatus = val;
                                          if (newStatus === 'dropped' || newStatus === 'cancelled') {
                                            setDropReasonModal({
                                              isOpen: true,
                                              appId: null,
                                              regId: reg._id,
                                              type: 'registration',
                                              reason: '2 Absences',
                                              customReason: ''
                                            });
                                          } else {
                                            setConfirmModal({
                                              isOpen: true,
                                              title: 'Update Registration Status',
                                              message: `Are you sure you want to change the status to ${newStatus}?`,
                                              type: 'warning',
                                              onConfirm: () => handleUpdateRegistrationStatus(reg._id, newStatus)
                                            });
                                          }
                                        }}
                                        placeholder="Status"
                                        darkMode={darkMode}
                                        className="min-w-[140px]"
                                        buttonClassName={`py-2 px-4 text-xs font-semibold shadow-sm transition-all hover:shadow-md ${
                                          currentStatus === 'active' 
                                            ? (darkMode ? '!bg-green-500/10 !text-green-400 !ring-green-500/20' : '!bg-green-50 !text-green-700 !ring-green-200')
                                            : currentStatus === 'pending'
                                            ? (darkMode ? '!bg-yellow-500/10 !text-yellow-400 !ring-yellow-500/20' : '!bg-yellow-50 !text-yellow-700 !ring-yellow-200')
                                            : currentStatus === 'completed'
                                            ? (darkMode ? '!bg-blue-500/10 !text-blue-400 !ring-blue-500/20' : '!bg-blue-50 !text-blue-700 !ring-blue-200')
                                            : currentStatus === 'dropped'
                                            ? (darkMode ? '!bg-orange-500/10 !text-orange-400 !ring-orange-500/20' : '!bg-orange-50 !text-orange-700 !ring-orange-200')
                                            : (darkMode ? '!bg-red-500/10 !text-red-400 !ring-red-500/20' : '!bg-red-50 !text-red-700 !ring-red-200')
                                        }`}
                                      />
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                      ) : (
                        <tr>
                          <td colSpan="4" className={`px-6 py-20 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <div className="flex flex-col items-center justify-center gap-4">
                              <div className={`p-4 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                 <Users className="w-8 h-8 opacity-20" />
                              </div>
                              <div className="space-y-1">
                                 <p className="text-lg font-medium">No students enrolled</p>
                                 <p className="text-sm opacity-60">This schedule is currently empty</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`px-8 py-6 flex justify-end gap-3 border-t ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50/50 border-gray-100'}`}>
              <button 
                onClick={() => setShowScheduleStudentsModal(false)}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative w-full max-w-5xl h-full flex items-center justify-center">
            <button 
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition-all"
              onClick={() => setZoomedImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={zoomedImage} 
              alt="Zoomed Proof" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}

      {/* Settings Success Modal */}
      {showSettingsSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in fade-in zoom-in-95 duration-300 ${darkMode ? 'bg-gray-800 ring-1 ring-white/10' : 'bg-white ring-1 ring-black/5'}`}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Settings Saved</h3>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                System configuration has been updated successfully.
              </p>
              <button
                onClick={() => setShowSettingsSuccess(false)}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`relative w-full max-w-sm rounded-3xl shadow-2xl p-8 overflow-hidden animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-transform hover:scale-110 duration-300 ${
                confirmModal.type === 'danger' ? (darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600') : 
                confirmModal.type === 'success' ? (darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600') : 
                (darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600')
              }`}>
                {confirmModal.type === 'danger' ? <Trash2 className="w-8 h-8" /> : 
                 confirmModal.type === 'success' ? <CheckCircle2 className="w-8 h-8" /> : <Award className="w-8 h-8" />}
              </div>
              
              <h3 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{confirmModal.title}</h3>
              <div className={`text-sm leading-relaxed mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {confirmModal.message}
              </div>

              <div className="flex gap-3 w-full">
                {confirmModal.onConfirm && (
                  <button
                    onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    className={`flex-1 px-4 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirmModal.onConfirm) confirmModal.onConfirm();
                    setConfirmModal({ ...confirmModal, isOpen: false });
                  }}
                  className={`flex-1 px-4 py-3.5 text-white rounded-xl font-bold text-sm shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 ${
                    confirmModal.type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 
                    confirmModal.type === 'success' ? 'bg-green-500 hover:bg-green-600 shadow-green-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                  }`}
                >
                  {confirmModal.onConfirm ? 'Confirm' : 'OK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Drop Reason Modal */}
      {dropReasonModal.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-gray-800 ring-1 ring-white/10' : 'bg-white ring-1 ring-black/5'}`}>
            <div className={`px-6 py-5 border-b ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-white'}`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Drop Application</h3>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Select a reason for dropping this student.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Reason</label>
                <div className="grid grid-cols-1 gap-2">
                  {['2 Absences', 'Failed Requirements', 'Voluntary Withdrawal', 'Others'].map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setDropReasonModal(prev => ({ ...prev, reason }))}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        dropReasonModal.reason === reason
                          ? (darkMode ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-red-50 border-red-200 text-red-700')
                          : (darkMode ? 'bg-gray-700/50 border-gray-700 text-gray-400 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50')
                      }`}
                    >
                      {reason}
                      {dropReasonModal.reason === reason && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              {(dropReasonModal.reason === 'Others' || true) && (
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {dropReasonModal.reason === 'Others' ? 'Specify Reason' : 'Additional Remarks (Optional)'}
                  </label>
                  <textarea
                    value={dropReasonModal.customReason}
                    onChange={(e) => setDropReasonModal(prev => ({ ...prev, customReason: e.target.value }))}
                    placeholder={dropReasonModal.reason === 'Others' ? 'Please specify the reason...' : 'Add any additional details...'}
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500/20 outline-none transition-all resize-none h-24 ${
                      darkMode ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              )}
            </div>

            <div className={`px-6 py-4 border-t flex gap-3 ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50'}`}>
              <button
                onClick={() => setDropReasonModal(prev => ({ ...prev, isOpen: false }))}
                className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                Cancel
              </button>
              <button
                disabled={dropReasonModal.reason === 'Others' && !dropReasonModal.customReason.trim()}
                onClick={() => {
                  const finalReason = dropReasonModal.reason === 'Others' 
                    ? dropReasonModal.customReason 
                    : dropReasonModal.customReason 
                      ? `${dropReasonModal.reason} - ${dropReasonModal.customReason}`
                      : dropReasonModal.reason;
                  
                  if (dropReasonModal.type === 'registration') {
                    handleUpdateRegistrationStatus(dropReasonModal.regId, 'dropped', finalReason);
                  } else {
                    executeUpdateAppStatus(dropReasonModal.appId, 'Drop', finalReason);
                  }
                  setDropReasonModal(prev => ({ ...prev, isOpen: false }));
                }}
                className={`flex-1 px-4 py-2.5 text-white rounded-xl font-bold text-sm shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  darkMode ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                }`}
              >
                Confirm Drop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Drop Reason Modal */}
      {viewReasonModal.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-gray-800 ring-1 ring-white/10' : 'bg-white ring-1 ring-black/5'}`}>
            <div className={`px-6 py-5 border-b flex items-center justify-between ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-white'}`}>
              <div>
                <h3 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Drop Reason</h3>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{viewReasonModal.applicantName}</p>
              </div>
              <button
                onClick={() => setViewReasonModal(prev => ({ ...prev, isOpen: false }))}
                className={`p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {viewReasonModal.reason}
                </p>
              </div>
            </div>

            <div className={`px-6 py-4 border-t flex justify-end ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50'}`}>
              <button
                onClick={() => setViewReasonModal(prev => ({ ...prev, isOpen: false }))}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  darkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600 shadow-lg shadow-black/20' 
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <Toaster position="top-right" />
    </div>
  );
};

export default AdminDashboard;
