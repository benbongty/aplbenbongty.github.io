import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Target } from 'lucide-react';

interface CalendarProps {
  dailyCounts: Record<string, number>;
  username: string;
}

export default function Calendar({ dailyCounts, username }: CalendarProps) {
  const [dailyGoal, setDailyGoal] = useState(5);
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{monthNames[month]} {year}</h2>
            <p className="text-sm text-gray-500">
              {username ? `Tracking progress for ${username}` : 'Enter a username to see your progress'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            <Target className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Daily Goal:</label>
            <input 
              type="number" 
              min="1" 
              value={dailyGoal} 
              onChange={e => setDailyGoal(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={goToToday} className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">Today</button>
            <button onClick={nextMonth} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 lg:gap-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-500 py-1 sm:py-2 uppercase tracking-wider">
            <span className="sm:hidden">{d.charAt(0)}</span>
            <span className="hidden sm:inline">{d}</span>
          </div>
        ))}
        {days.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="h-16 sm:h-20 lg:h-24 rounded-lg sm:rounded-xl bg-gray-50/50 border border-transparent" />;
          
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const count = dailyCounts[dateStr] || 0;
          const isGoalMet = count >= dailyGoal;
          const isToday = isCurrentMonth && day === todayDate;
          
          return (
            <div 
              key={day} 
              className={`relative h-16 sm:h-20 lg:h-24 rounded-lg sm:rounded-xl border p-1 sm:p-2 lg:p-3 transition-all duration-200 group cursor-pointer
                ${isGoalMet ? 'bg-green-500 border-green-600 shadow-sm hover:bg-green-600' : 
                  count > 0 ? 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200' : 
                  'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}
                ${isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
              `}
            >
              <span className={`text-xs sm:text-sm font-bold ${isGoalMet ? 'text-white' : count > 0 ? 'text-yellow-800' : 'text-gray-700'}`}>
                {day}
              </span>
              
              {count > 0 && (
                <div className={`absolute bottom-1 right-1 sm:bottom-2 sm:right-2 lg:bottom-3 lg:right-3 flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full font-bold text-[10px] sm:text-xs lg:text-sm shadow-sm
                  ${isGoalMet ? 'bg-white text-green-600' : 'bg-yellow-500 text-white'}
                `}>
                  {count}
                </div>
              )}

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-10 w-max bg-gray-900 text-white text-xs font-medium rounded-lg py-2 px-3 shadow-xl transform scale-95 group-hover:scale-100 transition-transform origin-bottom">
                {count === 0 ? 'No problems solved' : `${count} problem${count !== 1 ? 's' : ''} solved`} on {dateStr}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
