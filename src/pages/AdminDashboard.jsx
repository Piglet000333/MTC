import React, { useState, useEffect } from 'react'; 
import { Home, LayoutDashboard, UserPlus, Calendar, Award, Plus, Edit, Trash2, Search, LogOut, X } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => { 
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard'); 
  const [activeSubSection, setActiveSubSection] = useState(''); 
  const [searchTerm, setSearchTerm] = useState(''); 
  
  // Data State
  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editing State
  const [editingItem, setEditingItem] = useState(null); 
  const [studentForm, setStudentForm] = useState({ firstName: '', lastName: '', email: '', mobileNo: '', educationCourse: '' });
  const [scheduleForm, setScheduleForm] = useState({ courseId: '', courseTitle: '', trainingDate: '', capacity: '' });
  const [assessmentForm, setAssessmentForm] = useState({ assessmentId: '', title: '', fee: '', status: 'Active' });

  // Initial Load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsRes, schedulesRes, assessmentsRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/schedules'),
        fetch('/api/assessments')
      ]);

      if (!studentsRes.ok || !schedulesRes.ok || !assessmentsRes.ok) throw new Error('Failed to load data');

      const [sData, schData, aData] = await Promise.all([
        studentsRes.json(),
        schedulesRes.json(),
        assessmentsRes.json()
      ]);

      setStudents(sData);
      setSchedules(schData);
      setAssessments(aData);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/admin/login');
  };

  // --- Student CRUD ---
  const handleSaveStudent = async () => {
    try {
      const url = editingItem ? `/api/students/${editingItem._id}` : '/api/students';
      const method = editingItem ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentForm)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save student');
      }

      alert(editingItem ? 'Student updated successfully!' : 'Student added successfully!');
      setEditingItem(null);
      setStudentForm({ firstName: '', lastName: '', email: '', mobileNo: '', educationCourse: '' });
      setActiveSubSection('');
      loadData();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student? This will also remove their registrations.')) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete student');
      alert('Student deleted successfully!');
      loadData();
    } catch (e) {
      alert(e.message);
    }
  };

  const startEditStudent = (student) => {
    setEditingItem(student);
    setStudentForm({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      mobileNo: student.mobileNo || '',
      educationCourse: student.educationCourse || ''
    });
    setActiveSubSection('student-form');
  };

  // --- Schedule CRUD ---
  const handleSaveSchedule = async () => {
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

      alert(editingItem ? 'Schedule updated successfully!' : 'Schedule added successfully!');
      setEditingItem(null);
      setScheduleForm({ courseId: '', courseTitle: '', trainingDate: '', capacity: '' });
      setActiveSubSection('');
      loadData();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete schedule');
      alert('Schedule deleted successfully!');
      loadData();
    } catch (e) {
      alert(e.message);
    }
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

      alert(editingItem ? 'Assessment updated successfully!' : 'Assessment added successfully!');
      setEditingItem(null);
      setAssessmentForm({ assessmentId: '', title: '', fee: '', status: 'Active' });
      setActiveSubSection('');
      loadData();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteAssessment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) return;
    try {
      const res = await fetch(`/api/assessments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete assessment');
      alert('Assessment deleted successfully!');
      loadData();
    } catch (e) {
      alert(e.message);
    }
  };

  const startEditAssessment = (assessment) => {
    setEditingItem(assessment);
    setAssessmentForm({
      assessmentId: assessment.assessmentId || '',
      title: assessment.title || '',
      fee: assessment.fee || '',
      status: assessment.status || 'Active'
    });
    setActiveSubSection('assessment-form');
  };


  // --- Renderers ---
  const filteredStudents = students.filter(student => 
    (student.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (student.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (student.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderDashboard = () => ( 
    <div className="space-y-6"> 
      <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2> 
      {loading ? <p>Loading...</p> : (
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
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Students</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.slice(0, 5).map((student) => (
                    <tr key={student._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.firstName} {student.lastName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.educationCourse || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(student.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
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
        <h2 className="text-2xl font-bold text-gray-800">Student Management</h2>
        <button 
          onClick={() => {
            setEditingItem(null);
            setStudentForm({ firstName: '', lastName: '', email: '', mobileNo: '', educationCourse: '' });
            setActiveSubSection('student-form');
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {activeSubSection === 'student-form' ? (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">{editingItem ? 'Edit Student' : 'New Student'}</h3>
            <button onClick={() => setActiveSubSection('')} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg px-4 py-2"
                  value={studentForm.firstName}
                  onChange={(e) => setStudentForm({...studentForm, firstName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg px-4 py-2"
                  value={studentForm.lastName}
                  onChange={(e) => setStudentForm({...studentForm, lastName: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                className="w-full border rounded-lg px-4 py-2"
                value={studentForm.email}
                onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No.</label>
              <input 
                type="text" 
                className="w-full border rounded-lg px-4 py-2"
                value={studentForm.mobileNo}
                onChange={(e) => setStudentForm({...studentForm, mobileNo: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education Course</label>
              <input 
                type="text" 
                className="w-full border rounded-lg px-4 py-2"
                value={studentForm.educationCourse}
                onChange={(e) => setStudentForm({...studentForm, educationCourse: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button 
                onClick={() => setActiveSubSection('')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveStudent}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingItem ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search students..." 
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.mobileNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.educationCourse}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => startEditStudent(student)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteStudent(student._id)}
                        className="text-red-600 hover:text-red-900"
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
      )}
    </div>
  );

  const renderSchedules = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Schedule Management</h2>
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

      {activeSubSection === 'schedule-form' ? (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">{editingItem ? 'Edit Schedule' : 'New Schedule'}</h3>
            <button onClick={() => setActiveSubSection('')} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course ID</label>
              <input 
                type="text" 
                className="w-full border rounded-lg px-4 py-2"
                value={scheduleForm.courseId}
                onChange={(e) => setScheduleForm({...scheduleForm, courseId: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
              <input 
                type="text" 
                className="w-full border rounded-lg px-4 py-2"
                value={scheduleForm.courseTitle}
                onChange={(e) => setScheduleForm({...scheduleForm, courseTitle: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Training Date</label>
              <input 
                type="date" 
                className="w-full border rounded-lg px-4 py-2"
                value={scheduleForm.trainingDate}
                onChange={(e) => setScheduleForm({...scheduleForm, trainingDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input 
                type="number" 
                className="w-full border rounded-lg px-4 py-2"
                value={scheduleForm.capacity}
                onChange={(e) => setScheduleForm({...scheduleForm, capacity: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button 
                onClick={() => setActiveSubSection('')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSchedule}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingItem ? 'Update Schedule' : 'Add Schedule'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedules.map((schedule) => (
                  <tr key={schedule._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{schedule.courseId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{schedule.courseTitle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {schedule.trainingDate ? new Date(schedule.trainingDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.capacity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold">{schedule.registered || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => startEditSchedule(schedule)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteSchedule(schedule._id)}
                        className="text-red-600 hover:text-red-900"
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
      )}
    </div>
  );

  const renderAssessments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Assessment Management</h2>
        <button 
          onClick={() => {
            setEditingItem(null);
            setAssessmentForm({ assessmentId: '', title: '', fee: '', status: 'Active' });
            setActiveSubSection('assessment-form');
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Add Assessment
        </button>
      </div>

      {activeSubSection === 'assessment-form' ? (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">{editingItem ? 'Edit Assessment' : 'New Assessment'}</h3>
            <button onClick={() => setActiveSubSection('')} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assessment ID</label>
              <input 
                type="text" 
                className="w-full border rounded-lg px-4 py-2"
                value={assessmentForm.assessmentId}
                onChange={(e) => setAssessmentForm({...assessmentForm, assessmentId: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input 
                type="text" 
                className="w-full border rounded-lg px-4 py-2"
                value={assessmentForm.title}
                onChange={(e) => setAssessmentForm({...assessmentForm, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee</label>
              <input 
                type="text" 
                className="w-full border rounded-lg px-4 py-2"
                value={assessmentForm.fee}
                onChange={(e) => setAssessmentForm({...assessmentForm, fee: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                className="w-full border rounded-lg px-4 py-2"
                value={assessmentForm.status}
                onChange={(e) => setAssessmentForm({...assessmentForm, status: e.target.value})}
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button 
                onClick={() => setActiveSubSection('')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAssessment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingItem ? 'Update Assessment' : 'Add Assessment'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assessments.map((assessment) => (
                  <tr key={assessment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assessment.assessmentId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{assessment.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assessment.fee}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        assessment.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {assessment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => startEditAssessment(assessment)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteAssessment(assessment._id)}
                        className="text-red-600 hover:text-red-900"
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
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg fixed h-full z-10 hidden md:block">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <LayoutDashboard className="w-8 h-8" />
            <span>Admin Portal</span>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          <button 
            onClick={() => { setActiveSection('dashboard'); setActiveSubSection(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeSection === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Home className="w-5 h-5" />
            Dashboard
          </button>
          <button 
            onClick={() => { setActiveSection('students'); setActiveSubSection(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeSection === 'students' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <UserPlus className="w-5 h-5" />
            Students
          </button>
          <button 
            onClick={() => { setActiveSection('schedules'); setActiveSubSection(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeSection === 'schedules' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Schedules
          </button>
          <button 
            onClick={() => { setActiveSection('assessments'); setActiveSubSection(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeSection === 'assessments' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Award className="w-5 h-5" />
            Assessments
          </button>
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 p-8">
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'students' && renderStudents()}
        {activeSection === 'schedules' && renderSchedules()}
        {activeSection === 'assessments' && renderAssessments()}
      </div>
    </div>
  );
};

export default AdminDashboard;