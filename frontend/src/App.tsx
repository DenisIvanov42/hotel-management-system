import axios from 'axios';
import { addDays, addWeeks, differenceInCalendarDays, eachDayOfInterval, format, isSameDay, isToday, parseISO, startOfWeek, subDays, subWeeks } from 'date-fns';
import { bg } from 'date-fns/locale';
import { useCallback, useEffect, useRef, useState } from 'react';
import BookingDrawer from './BookingDrawer';
import type { Booking, BookingPayload, DailyNote, Room, SelectedSlot } from './types';

export default function App() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([]);
  
  const [isSortedNum, setIsSortedNum] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [hoveredDateStr, setHoveredDateStr] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [summaryDate, setSummaryDate] = useState<Date | null>(null);
  const [dailyNoteText, setDailyNoteText] = useState('');

  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomNoteText, setRoomNoteText] = useState('');

  const isScrolling = useRef(false);
  const pillRef = useRef<HTMLDivElement>(null);

  const [hoveredBookingId, setHoveredBookingId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      axios.get('/api/rooms'),
      axios.get('/api/bookings'),
      axios.get('/api/notes')
    ]).then(([roomsRes, bookingsRes, notesRes]) => {
      setRooms(roomsRes.data);
      setBookings(bookingsRes.data);
      setDailyNotes(notesRes.data);
    }).catch(error => console.error("Error fetching data:", error));
  }, []);

  const currentWeekEnd = addDays(currentWeekStart, 6);
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });
  const startMonth = format(currentWeekStart, 'LLLL', { locale: bg });
  const endMonth = format(currentWeekEnd, 'LLLL yyyy', { locale: bg });
  const displayMonth = startMonth === format(currentWeekEnd, 'LLLL', { locale: bg }) ? endMonth : `${startMonth} - ${endMonth}`;

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (isScrolling.current) return;
    isScrolling.current = true;
    if (e.deltaY > 0) setCurrentWeekStart(prev => addWeeks(prev, 1));
    else if (e.deltaY < 0) setCurrentWeekStart(prev => subWeeks(prev, 1));
    setTimeout(() => { isScrolling.current = false; }, 250);
  }, []);

  useEffect(() => {
    const pill = pillRef.current;
    if (pill) pill.addEventListener('wheel', handleWheel, { passive: false });
    return () => { if (pill) pill.removeEventListener('wheel', handleWheel); };
  }, [handleWheel]);

  const displayRooms = isSortedNum ? [...rooms].sort((a, b) => parseInt(a.roomNumber) - parseInt(b.roomNumber)) : rooms;

  const handleSaveBooking = async (payload: BookingPayload, existingId?: number) => {
    try {
      if (existingId) {
        const res = await axios.put(`/api/bookings/${existingId}`, payload);
        setBookings(prev => prev.map(b => b.id === res.data.id ? res.data : b));
      } else {
        const res = await axios.post('/api/bookings', payload);
        setBookings(prev => [...prev, res.data]);
      }
      setSelectedSlot(null);
    } catch (error) { console.error(error); alert("Грешка при запазване!"); }
  };

  const handleDeleteBooking = async (id: number) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете тази резервация?")) return;
    try {
      await axios.delete(`/api/bookings/${id}`);
      setBookings(prev => prev.filter(b => b.id !== id));
      setSelectedSlot(null);
    } catch (error) { console.error(error); alert("Грешка при изтриване!"); }
  };

  const handleSaveDailyNote = async () => {
    if (!summaryDate) return;
    const payload = { date: format(summaryDate, 'yyyy-MM-dd'), text: dailyNoteText };
    try {
      const res = await axios.post('/api/notes', payload);
      setDailyNotes(prev => {
        const exists = prev.find(n => n.date === res.data.date);
        return exists ? prev.map(n => n.date === res.data.date ? res.data : n) : [...prev, res.data];
      });
      setSummaryDate(null);
    } catch (error) { console.error(error); alert("Грешка при запазване на бележката!"); }
  };

  // NEW: Save Room Peculiarity
  const handleSaveRoomNote = async () => {
    if (!editingRoom) return;
    try {
      const res = await axios.put(`/api/rooms/${editingRoom.id}`, { ...editingRoom, notes: roomNoteText });
      setRooms(prev => prev.map(r => r.id === res.data.id ? res.data : r));
      setEditingRoom(null);
    } catch (error) { console.error(error); alert("Грешка при запазване на бележката за стаята!"); }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 p-6 font-sans text-slate-800 overflow-hidden relative">
      <div className="mb-4 flex items-baseline justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">График на стаите</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-2xl font-semibold text-indigo-600 capitalize min-w-[280px] text-right whitespace-nowrap">
            {displayMonth}
          </div>
          <div ref={pillRef} className="inline-flex rounded-lg border border-slate-300 bg-white p-1 shadow-sm cursor-ns-resize" title="Скролирайте тук с мишката, за да сменяте седмиците">
            <button onClick={() => setCurrentWeekStart(prev => subWeeks(prev, 1))} className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 rounded-md transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </button>
            <div className="w-px bg-slate-200 self-stretch my-1 mx-1" />
            <button onClick={() => setCurrentWeekStart(prev => addWeeks(prev, 1))} className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 rounded-md transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 min-h-0 overflow-auto relative">
        <table className="w-full text-sm text-left border-separate border-spacing-0">
          <thead className="text-slate-600">
            <tr>
              <th className="p-3 border-r border-b border-slate-300 font-semibold w-56 sticky top-0 left-0 z-50 bg-slate-200 align-middle shadow-[1px_1px_0_#cbd5e1]">
                <button onClick={() => setIsSortedNum(!isSortedNum)} className="flex items-center justify-center gap-2 w-full px-2 py-1.5 rounded bg-white border border-slate-300 hover:bg-slate-50 transition-colors">
                  <span>{isSortedNum ? '102 -> 217' : 'По подразбиране'}</span>
                </button>
              </th>
              {weekDays.map((date, index) => {
                const isCurrentDay = isToday(date);
                const isHovered = hoveredDateStr === format(date, 'yyyy-MM-dd');
                return (
                  <th key={index} className={`p-2 border-r border-b border-slate-200 text-center min-w-[140px] sticky top-0 z-40 shadow-[0_1px_0_#e2e8f0] transition-colors ${isCurrentDay ? 'text-indigo-700 shadow-[inset_0_-3px_0_#4f46e5]' : ''} ${isHovered ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                    <div className="text-xs uppercase tracking-wider font-bold">{format(date, 'EEEEE', { locale: bg })}</div>
                    <div className={`text-xl ${isCurrentDay ? 'font-black' : 'text-slate-900'}`}>{format(date, 'd', { locale: bg })}</div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {displayRooms.map((room) => (
              <tr key={room.id} className="border-b hover:bg-indigo-50 transition-colors group">
                <td className="px-4 py-2 border-r border-b border-slate-200 sticky left-0 z-20 bg-white group-hover:bg-indigo-50 shadow-[1px_0_0_#e2e8f0] transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-base">{room.roomNumber}</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide">{room.category?.name}</div>
                    </div>
                    {/* NEW: Room Notes Icon Indicator */}
                    <button 
                      onClick={() => { setEditingRoom(room); setRoomNoteText(room.notes || ''); }}
                      title={room.notes || "Добави бележка за стаята"}
                      className={`p-1.5 rounded-full transition-all ${room.notes ? 'text-blue-500 hover:bg-blue-100' : 'text-slate-300 opacity-0 group-hover:opacity-100 hover:text-blue-500 hover:bg-blue-50'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </td>
                
                {weekDays.map((date, index) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const isHovered = hoveredDateStr === dateStr;
                  const booking = bookings.find(b => b.room.id === room.id && date >= parseISO(b.startDate) && date < parseISO(b.endDate));

                  if (booking) {
                    const isLastDay = isSameDay(date, subDays(parseISO(booking.endDate), 1));
                    const isFirstVisibleDay = isSameDay(date, parseISO(booking.startDate)) || index === 0;
                    const totalNights = differenceInCalendarDays(parseISO(booking.endDate), parseISO(booking.startDate));
                    const pricePerNight = (booking.price / totalNights).toFixed(0);
                    const hasNotes = booking.notes && booking.notes.trim().length > 0;
                    
                    const bgColorClass = booking.isPaid ? 'bg-purple-600' : 'bg-orange-500';
                    const bottomBorderColorClass = booking.isPaid ? 'border-b-purple-600' : 'border-b-orange-500';
                    const isThisHovered = hoveredBookingId === booking.id;

                    return (
                      <td 
                        key={index} 
                        onClick={() => setSelectedSlot({ room, date, existingBooking: booking })} 
                        onMouseEnter={() => { setHoveredDateStr(dateStr); setHoveredBookingId(booking.id); }}
                        onMouseLeave={() => { setHoveredDateStr(null); setHoveredBookingId(null); }}
                        className={`p-0 relative cursor-pointer transition-all h-14 z-0 text-white ${bgColorClass} border-b ${bottomBorderColorClass} ${isLastDay ? 'border-r border-r-slate-200' : 'border-r-0'} ${isThisHovered ? 'brightness-90 shadow-inner' : ''}`}
                      >
                        {isFirstVisibleDay && (
                          <div className="absolute inset-0 flex flex-col justify-center px-3 overflow-visible whitespace-nowrap z-10 pointer-events-none">
                            <div className="text-sm font-bold truncate drop-shadow-sm flex items-center gap-1.5">
                              {booking.displayName || 'Резервация'}
                              {hasNotes && <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white/80 drop-shadow-sm" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 110-2H7z" clipRule="evenodd" /></svg>}
                            </div>
                            <div className="text-[10px] text-white/90 font-medium">
                              {booking.guestsCount} гости • {pricePerNight}€/н
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  }

                  return (
                    <td 
                      key={index} 
                      onMouseEnter={() => setHoveredDateStr(dateStr)}
                      onMouseLeave={() => setHoveredDateStr(null)}
                      className={`p-0 border-r border-b border-slate-100 relative cursor-pointer transition-colors h-14 z-0 ${isHovered ? 'bg-indigo-100/60' : ''} ${isToday(date) && !isHovered ? 'bg-slate-100' : ''} hover:!bg-indigo-300 hover:shadow-inner`} 
                      onClick={() => setSelectedSlot({ room, date })}
                    ></td>
                  );
                })}
              </tr>
            ))}
          </tbody>

          <tfoot className="sticky bottom-0 z-30 bg-slate-100 shadow-[0_-1px_0_#cbd5e1]">
            <tr>
              <td className="p-3 border-r border-slate-200 font-bold text-slate-700 sticky left-0 z-40 bg-slate-100 shadow-[1px_0_0_#cbd5e1]">Общо за деня</td>
              {weekDays.map((date, index) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const isHovered = hoveredDateStr === dateStr;
                const hasNote = dailyNotes.some(n => n.date === dateStr && n.text.trim().length > 0);
                let totalGuests = 0;
                bookings.forEach(b => { if (date >= parseISO(b.startDate) && date < parseISO(b.endDate)) totalGuests += b.guestsCount; });

                return (
                  <td key={index} onClick={() => { setSummaryDate(date); const existingNote = dailyNotes.find(n => n.date === dateStr); setDailyNoteText(existingNote ? existingNote.text : ''); }} onMouseEnter={() => setHoveredDateStr(dateStr)} onMouseLeave={() => setHoveredDateStr(null)} className={`p-2 border-r border-slate-200 text-center cursor-pointer transition-all ${isHovered ? 'bg-indigo-100 text-indigo-900 shadow-inner' : 'bg-slate-100 text-slate-600'}`}>
                    <div className="text-sm font-bold">{totalGuests} гости</div>
                    {hasNote ? <div className="mx-auto mt-1.5 w-2 h-2 bg-amber-500 rounded-full shadow-sm"></div> : <div className="h-3.5"></div>}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      <BookingDrawer isOpen={!!selectedSlot} slot={selectedSlot} bookings={bookings} onClose={() => setSelectedSlot(null)} onSave={handleSaveBooking} onDelete={handleDeleteBooking} />

      {/* Daily Notes Modal */}
      {summaryDate && (() => {
        let modalGuests = 0;
        let modalRevenue = 0;
        bookings.forEach(b => {
          if (summaryDate >= parseISO(b.startDate) && summaryDate < parseISO(b.endDate)) {
            modalGuests += b.guestsCount;
            const nights = differenceInCalendarDays(parseISO(b.endDate), parseISO(b.startDate));
            modalRevenue += (b.price / nights);
          }
        });

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[80] flex items-center justify-center transition-opacity" onClick={(e) => { if (e.target === e.currentTarget) setSummaryDate(null); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden transform scale-100">
              <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-bold text-slate-900">Бележки за деня</h2>
                <button onClick={() => setSummaryDate(null)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="p-6">
                <div className="text-center mb-5">
                  <div className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-1">{format(summaryDate, 'EEEE', { locale: bg })}</div>
                  <div className="text-3xl font-black text-slate-900">{format(summaryDate, 'dd MMMM yyyy', { locale: bg })}</div>
                </div>
                <div className="flex justify-center gap-3 mb-6">
                  <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm border border-slate-200">👥 {modalGuests} гости</div>
                  <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm border border-emerald-200">💶 Общо: {modalRevenue.toFixed(0)} €</div>
                </div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Дневни бележки и задачи</label>
                <textarea rows={5} value={dailyNoteText} onChange={(e) => setDailyNoteText(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none mb-4 shadow-inner"></textarea>
                <button onClick={handleSaveDailyNote} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-colors">Запази бележката</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* NEW: Room Peculiarity Modal */}
      {editingRoom && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[80] flex items-center justify-center transition-opacity" onClick={(e) => { if (e.target === e.currentTarget) setEditingRoom(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden transform scale-100">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-blue-50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Детайли за стаята</h2>
                <p className="text-sm font-bold text-blue-600">Стая {editingRoom.roomNumber} ({editingRoom.category?.name})</p>
              </div>
              <button onClick={() => setEditingRoom(null)} className="text-blue-400 hover:text-blue-700 hover:bg-blue-200 p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Особености на стаята</label>
              <textarea 
                rows={4} 
                value={roomNoteText} 
                onChange={(e) => setRoomNoteText(e.target.value)} 
                className="w-full p-4 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none mb-4 shadow-inner"
                placeholder="напр. Климатикът работи само на 24 градуса..."
              ></textarea>
              <div className="flex gap-3">
                <button onClick={() => { setRoomNoteText(''); handleSaveRoomNote(); }} className="px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors">Изчисти</button>
                <button onClick={handleSaveRoomNote} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-colors">Запази особеността</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}