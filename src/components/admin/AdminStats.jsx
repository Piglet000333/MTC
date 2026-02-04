import React from 'react';
import { Calendar, UserPlus, Award } from 'lucide-react';

const AdminStats = ({ schedules, students, assessments, darkMode }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> 
      {/* Schedules Card */}
      <div className={`relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${darkMode ? 'bg-gray-800 border border-gray-700 shadow-black/20' : 'bg-white border border-gray-100 shadow-gray-200/50'}`}> 
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center justify-between mb-4"> 
            <div className={`p-3 rounded-2xl ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <Calendar className="w-6 h-6" /> 
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${darkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}>
              +12%
            </span>
          </div>
          <div> 
            <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Schedules</p> 
            <h3 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{schedules.length}</h3> 
          </div> 
        </div> 
        {/* Decorative Background Blob */}
        <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl opacity-20 ${darkMode ? 'bg-blue-500' : 'bg-blue-200'}`}></div>
      </div> 

      {/* Students Card */}
      <div className={`relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${darkMode ? 'bg-gray-800 border border-gray-700 shadow-black/20' : 'bg-white border border-gray-100 shadow-gray-200/50'}`}> 
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center justify-between mb-4"> 
            <div className={`p-3 rounded-2xl ${darkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}>
              <UserPlus className="w-6 h-6" /> 
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${darkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}>
              +5%
            </span>
          </div>
          <div> 
            <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Active Students</p> 
            <h3 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{students.length}</h3> 
          </div> 
        </div> 
         <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl opacity-20 ${darkMode ? 'bg-green-500' : 'bg-green-200'}`}></div>
      </div> 

      {/* Assessments Card */}
      <div className={`relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${darkMode ? 'bg-gray-800 border border-gray-700 shadow-black/20' : 'bg-white border border-gray-100 shadow-gray-200/50'}`}> 
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center justify-between mb-4"> 
            <div className={`p-3 rounded-2xl ${darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
              <Award className="w-6 h-6" /> 
            </div>
             <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${darkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}>
              +8%
            </span>
          </div>
          <div> 
            <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Assessments</p> 
            <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{assessments.length}</h3> 
          </div> 
        </div> 
         <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl opacity-20 ${darkMode ? 'bg-purple-500' : 'bg-purple-200'}`}></div>
      </div> 
    </div>
  );
};

export default AdminStats;
