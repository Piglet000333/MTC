import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';

const RecentStudents = ({ students, registrations, schedules, darkMode, setActiveSection }) => {
  return (
    <div className={`rounded-3xl shadow-xl border overflow-hidden transition-all duration-300 ${darkMode ? 'bg-gray-800/50 backdrop-blur-xl border-gray-700 shadow-black/20' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>
      <div className={`px-8 py-6 border-b flex items-center justify-between ${darkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
         <div>
           <h3 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Students</h3>
           <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Latest student registrations and enrollments</p>
         </div>
         <button 
           onClick={() => setActiveSection('schedules')} 
           className={`group flex items-center gap-2 text-sm font-semibold transition-colors ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
         >
           View All Students
           <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
         </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={darkMode ? 'bg-gray-900/50' : 'bg-gray-50/50'}>
            <tr>
              <th className={`px-8 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Student</th>
              <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Enrolled Course</th>
              <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date Joined</th>
              <th className={`px-6 py-5 text-right text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
            {students.slice(0, 5).map((student) => {
              const activeReg = registrations.find(r => (r.studentId?._id || r.studentId) === student._id && r.status !== 'cancelled');
              const schedId = activeReg?.scheduleId?._id || activeReg?.scheduleId;
              const schedule = schedules.find(s => s._id === schedId);
              const courseTitle = schedule?.courseTitle || schedule?.title || 'No course selected';
                
              return (
                <tr key={student._id} className={`group transition-all duration-200 ${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/50'}`}>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm transition-transform group-hover:scale-105 ${
                         darkMode ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-900/20' : 'bg-gradient-to-br from-blue-100 to-indigo-50 text-blue-600'
                      }`}>
                         {student.profilePicture ? (
                           <img src={student.profilePicture} alt="" className="w-full h-full object-cover rounded-xl" />
                         ) : (
                           <span>{student.firstName?.[0]}{student.lastName?.[0]}</span>
                         )}
                      </div>
                      <div>
                         <div className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{student.firstName} {student.lastName}</div>
                         <div className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                     <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        activeReg 
                          ? (darkMode ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200')
                          : (darkMode ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-500 border-gray-200')
                     }`}>
                        {courseTitle}
                     </span>
                  </td>
                  <td className={`px-6 py-5 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                     <div className="flex items-center gap-2">
                       <Calendar className="w-3.5 h-3.5 opacity-70" />
                       {new Date(student.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                     </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right">
                     <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                       activeReg 
                         ? (darkMode ? 'text-green-400 bg-green-500/10' : 'text-green-700 bg-green-50')
                         : (darkMode ? 'text-gray-400 bg-gray-700/50' : 'text-gray-500 bg-gray-100')
                     }`}>
                       <div className={`w-1.5 h-1.5 rounded-full ${activeReg ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                       {activeReg ? 'Active' : 'Unregistered'}
                     </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentStudents;
