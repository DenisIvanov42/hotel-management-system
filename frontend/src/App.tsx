import axios from 'axios';
import { addDays, addWeeks, eachDayOfInterval, format, isToday, startOfWeek, subWeeks } from 'date-fns';
import { bg } from 'date-fns/locale';
import { useEffect, useRef, useState } from 'react';

interface Room {
  id: number;
  roomNumber: string;
  category: string;
}

export default function App() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isSortedNum, setIsSortedNum] = useState(false);
  
  // State to track which week we are currently viewing
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // A "ref" to prevent the mouse wheel from scrolling 10 weeks in one flick
  const isScrolling = useRef(false);

  useEffect(() => {
    axios.get('http://localhost:8080/api/rooms')
      .then(response => setRooms(response.data))
      .catch(error => console.error("Error fetching rooms:", error));
  }, []);

  // 1. DATES: Calculate strictly 7 days (Monday to Sunday)
  const currentWeekEnd = addDays(currentWeekStart, 6);
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });

  // Smart Month Display (e.g., "Юни 2026" or "Май - Юни 2026")
  const startMonth = format(currentWeekStart, 'LLLL', { locale: bg });
  const endMonth = format(currentWeekEnd, 'LLLL yyyy', { locale: bg });
  const displayMonth = startMonth === format(currentWeekEnd, 'LLLL', { locale: bg }) 
    ? endMonth 
    : `${startMonth} - ${endMonth}`;

  // 2. SCROLL LOGIC: Detect mouse wheel over the dates
  const handleWheel = (e: React.WheelEvent) => {
    // If we recently scrolled, ignore it for 250ms so it doesn't spin wildly
    if (isScrolling.current) return;
    
    isScrolling.current = true;
    if (e.deltaY > 0) {
      setCurrentWeekStart(prev => addWeeks(prev, 1)); // Scroll Down -> Next Week
    } else if (e.deltaY < 0) {
      setCurrentWeekStart(prev => subWeeks(prev, 1)); // Scroll Up -> Prev Week
    }

    setTimeout(() => {
      isScrolling.current = false;
    }, 250);
  };

  // 3. SORTING
  const displayRooms = isSortedNum 
    ? [...rooms].sort((a, b) => parseInt(a.roomNumber) - parseInt(b.roomNumber))
    : rooms;

  return (
    // h-screen and overflow-hidden prevent the whole webpage from scrolling!
    <div className="h-screen flex flex-col bg-slate-50 p-6 font-sans text-slate-800 overflow-hidden">
      
      {/* Header Area */}
      <div className="mb-4 flex items-baseline justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">График на стаите</h1>
          <p className="text-slate-500">Управление на резервациите</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Added tiny buttons just in case the mouse wheel is hard to use for some people */}
          <button onClick={() => setCurrentWeekStart(prev => subWeeks(prev, 1))} className="p-2 bg-white rounded shadow-sm border border-slate-200 hover:bg-slate-100">&larr;</button>
          <div className="text-2xl font-semibold text-indigo-600 capitalize w-48 text-center">
            {displayMonth}
          </div>
          <button onClick={() => setCurrentWeekStart(prev => addWeeks(prev, 1))} className="p-2 bg-white rounded shadow-sm border border-slate-200 hover:bg-slate-100">&rarr;</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 min-h-0 overflow-auto">
        <table className="w-full text-sm text-left border-collapse relative">
          
          <thead 
            className="bg-slate-100/95 backdrop-blur text-slate-600"
            onWheel={handleWheel} // <-- Magic scroll listener attached here!
          >
            <tr>
              {/* TOP LEFT BUTTON (Frozen to top AND left) */}
              <th className="p-3 border-r border-b border-slate-200 font-semibold w-48 sticky top-0 left-0 z-30 bg-slate-100 align-middle shadow-[1px_1px_0_#e2e8f0]">
                <button 
                  onClick={() => setIsSortedNum(!isSortedNum)}
                  className={`flex items-center gap-2 w-full px-2 py-1.5 rounded transition-colors border text-xs ${
                    isSortedNum 
                      ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  <span>{isSortedNum ? '102 -> 217' : 'По подразбиране'}</span>
                </button>
              </th>
              
              {/* DATE HEADERS (Frozen to top) */}
              {weekDays.map((date, index) => {
                const isCurrentDay = isToday(date);
                return (
                  <th 
                    key={index} 
                    className={`p-2 border-r border-b border-slate-200 text-center min-w-[120px] sticky top-0 z-20 bg-slate-100/95 transition-colors cursor-ew-resize ${
                      isCurrentDay ? 'text-indigo-700 shadow-[inset_0_-3px_0_#4f46e5]' : ''
                    }`}
                  >
                    <div className="text-xs uppercase tracking-wider font-bold">
                      {format(date, 'EEEEE', { locale: bg })}
                    </div>
                    <div className={`text-xl ${isCurrentDay ? 'font-black' : 'text-slate-900'}`}>
                      {format(date, 'd', { locale: bg })}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {displayRooms.map((room) => (
              <tr key={room.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                
                {/* ROOM INFO (Frozen to left) */}
                <td className="px-4 py-2 border-r border-slate-200 sticky left-0 z-10 bg-white group-hover:bg-slate-50 shadow-[1px_0_0_#e2e8f0]">
                  <div className="font-bold text-slate-900 text-base">{room.roomNumber}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">{room.category}</div>
                </td>

                {/* EMPTY BOOKING CELLS */}
                {weekDays.map((date, index) => {
                  const isCurrentDay = isToday(date);
                  return (
                    <td 
                      key={index} 
                      className={`p-0 border-r border-slate-100 relative cursor-pointer hover:bg-indigo-50 transition-colors h-14 ${
                        isCurrentDay ? 'bg-indigo-50/20' : ''
                      }`}
                      onClick={() => alert(`Clicked Room ${room.roomNumber} on ${format(date, 'dd.MM.yyyy')}`)}
                    >
                      {/* Booking blocks go here later! */}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}