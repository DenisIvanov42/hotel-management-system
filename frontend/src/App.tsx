import axios from 'axios';
import { addDays, addWeeks, differenceInCalendarDays, eachDayOfInterval, format, isToday, startOfWeek, subWeeks } from 'date-fns';
import { bg } from 'date-fns/locale';
import { useCallback, useEffect, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// --- INTERFACES ---
interface Category {
  id: number;
  name: string;
  basePrice: number;
  discountPrice: number;
}

interface Room {
  id: number;
  roomNumber: string;
  category: Category;
}

interface SelectedSlot {
  room: Room;
  date: Date;
}

export default function App() {
  // --- STATE ---
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isSortedNum, setIsSortedNum] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  // Drawer States
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [checkoutDate, setCheckoutDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState<number>(2);
  const [overridePrice, setOverridePrice] = useState<string | null>(null);

  // Refs for scrolling
  const isScrolling = useRef(false);
  const headerRef = useRef<HTMLTableSectionElement>(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    axios.get('/api/rooms')
      .then(response => setRooms(response.data))
      .catch(error => console.error("Error fetching rooms:", error));
  }, []);

  // --- CALENDAR DATES ---
  const currentWeekEnd = addDays(currentWeekStart, 6);
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });

  const startMonth = format(currentWeekStart, 'LLLL', { locale: bg });
  const endMonth = format(currentWeekEnd, 'LLLL yyyy', { locale: bg });
  const displayMonth = startMonth === format(currentWeekEnd, 'LLLL', { locale: bg }) 
    ? endMonth 
    : `${startMonth} - ${endMonth}`;

  // --- SCROLL LOGIC ---
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (isScrolling.current) return;
    isScrolling.current = true;
    if (e.deltaY > 0) setCurrentWeekStart(prev => addWeeks(prev, 1));
    else if (e.deltaY < 0) setCurrentWeekStart(prev => subWeeks(prev, 1));
    setTimeout(() => { isScrolling.current = false; }, 250);
  }, []);

  useEffect(() => {
    const thead = headerRef.current;
    if (thead) thead.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      if (thead) thead.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // --- MATH & LOGIC ---
  const handleCellClick = (room: Room, date: Date) => {
    setSelectedSlot({ room, date });
    setCheckoutDate(addDays(date, 1)); // Default to 1 night
    setGuests(2); 
    setOverridePrice(null);
  };

  let autoPrice = 0;
  let calculatedNights = 0;

  if (selectedSlot && checkoutDate) {
    const checkin = selectedSlot.date;
    const checkout = checkoutDate;
    
    if (checkout > checkin) {
      calculatedNights = differenceInCalendarDays(checkout, checkin);
      
      // Safety check in case the database has a ghost room with no category!
      if (selectedSlot.room.category) {
        const cat = selectedSlot.room.category;
        const ratePerNight = calculatedNights >= 3 ? cat.discountPrice : cat.basePrice;
        autoPrice = ratePerNight * calculatedNights;

        if (guests > 2) {
          const extraPeople = guests - 2;
          autoPrice += (extraPeople * 30 * calculatedNights);
        }
      }
    }
  }

  const displayPrice = overridePrice !== null ? overridePrice : autoPrice.toFixed(2);
  const displayRooms = isSortedNum ? [...rooms].sort((a, b) => parseInt(a.roomNumber) - parseInt(b.roomNumber)) : rooms;

  return (
    <div className="h-screen flex flex-col bg-slate-50 p-6 font-sans text-slate-800 overflow-hidden relative">
      
      {/* HEADER */}
      <div className="mb-4 flex items-baseline justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">График на стаите</h1>
          <p className="text-slate-500">Управление на резервациите</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentWeekStart(prev => subWeeks(prev, 1))} className="p-2 bg-white rounded shadow-sm border border-slate-200 hover:bg-slate-100">&larr;</button>
          <div className="text-2xl font-semibold text-indigo-600 capitalize min-w-[300px] text-center whitespace-nowrap">
            {displayMonth}
          </div>
          <button onClick={() => setCurrentWeekStart(prev => addWeeks(prev, 1))} className="p-2 bg-white rounded shadow-sm border border-slate-200 hover:bg-slate-100">&rarr;</button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 min-h-0 overflow-auto relative">
        <table className="w-full text-sm text-left border-collapse">
          <thead ref={headerRef} className="text-slate-600">
            <tr>
              <th className="p-3 border-r border-b border-slate-300 font-semibold w-48 sticky top-0 left-0 z-50 bg-slate-200 align-middle shadow-[1px_1px_0_#cbd5e1]">
                <button 
                  onClick={() => setIsSortedNum(!isSortedNum)}
                  className={`flex items-center gap-2 w-full px-2 py-1.5 rounded transition-colors border text-xs ${isSortedNum ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  <span>{isSortedNum ? '102 -> 217' : 'По подразбиране'}</span>
                </button>
              </th>
              
              {weekDays.map((date, index) => {
                const isCurrentDay = isToday(date);
                return (
                  <th key={index} className={`p-2 border-r border-b border-slate-200 text-center min-w-[120px] sticky top-0 z-40 bg-slate-100 transition-colors cursor-ew-resize shadow-[0_1px_0_#e2e8f0] ${isCurrentDay ? 'text-indigo-700 shadow-[inset_0_-3px_0_#4f46e5]' : ''}`}>
                    <div className="text-xs uppercase tracking-wider font-bold">{format(date, 'EEEEE', { locale: bg })}</div>
                    <div className={`text-xl ${isCurrentDay ? 'font-black' : 'text-slate-900'}`}>{format(date, 'd', { locale: bg })}</div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {displayRooms.map((room) => (
              <tr key={room.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                <td className="px-4 py-2 border-r border-slate-200 sticky left-0 z-20 bg-white group-hover:bg-slate-50 shadow-[1px_0_0_#e2e8f0]">
                  <div className="font-bold text-slate-900 text-base">{room.roomNumber}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">{room.category?.name}</div>
                </td>
                {weekDays.map((date, index) => {
                  const isCurrentDay = isToday(date);
                  return (
                    <td 
                      key={index} 
                      className={`p-0 border-r border-slate-100 relative cursor-pointer hover:bg-indigo-100 transition-colors h-14 z-0 ${isCurrentDay ? 'bg-indigo-50/30' : ''}`}
                      onClick={() => handleCellClick(room, date)}
                    >
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DRAWER */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[60] transition-opacity" onClick={() => setSelectedSlot(null)} />
      )}

      <div className={`fixed top-0 right-0 h-full w-[450px] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${selectedSlot ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Нова Резервация</h2>
            <p className="text-sm text-slate-500">
              Стая <span className="font-bold text-indigo-600">{selectedSlot?.room.roomNumber}</span> ({selectedSlot?.room.category?.name})
            </p>
          </div>
          <button onClick={() => setSelectedSlot(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Настаняване</label>
              <div className="w-full px-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium h-[48px] flex items-center">
                {selectedSlot ? format(selectedSlot.date, 'dd.MM.yyyy', { locale: bg }) : ''}
              </div>
              <div className="mt-1 text-xs font-semibold text-indigo-600 capitalize">
                {selectedSlot ? format(selectedSlot.date, 'EEEE', { locale: bg }) : ''}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center pt-5 px-1 text-slate-400">
              <div className={`text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap mb-1 transition-colors ${calculatedNights > 0 ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                {calculatedNights > 0 ? `${calculatedNights} нощувк${calculatedNights === 1 ? 'а' : 'и'}` : '-'}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Напускане</label>
              <DatePicker
                selected={checkoutDate}
                onChange={(date: Date | null) => { setCheckoutDate(date); setOverridePrice(null); }}
                dateFormat="dd/MM/yyyy"
                minDate={selectedSlot ? addDays(selectedSlot.date, 1) : new Date()} 
                className="w-full px-3 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all h-[48px]"
                popperPlacement="bottom-end" 

                renderDayContents={(day: number, date?: Date) => {
                  let tooltip = "";
                  if (selectedSlot && date && date > selectedSlot.date) {
                    const n = differenceInCalendarDays(date, selectedSlot.date);
                    tooltip = `${n} нощувк${n === 1 ? 'а' : 'и'}`;
                  }
                  return <div title={tooltip}>{day}</div>;
                }}
              />
              <div className="mt-1 text-xs font-semibold text-indigo-600 capitalize">
                {checkoutDate ? format(checkoutDate, 'EEEE', { locale: bg }) : 'Изберете дата'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Име (или група)</label>
            <input type="text" placeholder="напр. Даниела и Митко" className="w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Брой гости</label>
              <input 
                type="number" min="1" value={guests}
                onChange={(e) => { setGuests(parseInt(e.target.value) || 1); setOverridePrice(null); }}
                className="w-full px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all h-[48px]" 
              />
              <div className="mt-1 text-[10px] text-slate-400">Над 2 души: +30€/вечер</div>
            </div>
            
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Общо (EUR)</label>
              <div className="relative flex items-center">
                <input 
                  type="number" step="0.01" value={displayPrice}
                  onChange={(e) => setOverridePrice(e.target.value)} 
                  className="w-full px-3 pr-8 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all h-[48px]" 
                />
                <span className="absolute right-4 text-slate-400 font-bold pointer-events-none">€</span>
              </div>
              <div className="mt-1 text-xs font-semibold text-emerald-600">
                ≈ {(parseFloat(displayPrice || '0') * 1.95583).toFixed(2)} лв.
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Бележки / Статус</label>
            <textarea rows={3} placeholder="напр. Платено, или проблем с климатика..." className="w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"></textarea>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
          <button onClick={() => setSelectedSlot(null)} className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors">Отказ</button>
          <button className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-colors">Запази</button>
        </div>
      </div>
    </div>
  );
}