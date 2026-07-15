import { differenceInCalendarDays, parseISO } from 'date-fns';
import { bg } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import type { Booking, Room } from './types';

interface ProfitCalculatorProps {
  rooms: Room[];
  bookings: Booking[];
}

export default function ProfitCalculator({ rooms, bookings }: ProfitCalculatorProps) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // If empty, we assume ALL rooms are selected
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);

  const toggleRoom = (roomId: number) => {
    setSelectedRoomIds(prev => 
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };

  const selectAll = () => setSelectedRoomIds([]);

  // Calculate the profit dynamically whenever dates or rooms change
  const totalRevenue = useMemo(() => {
    if (!startDate || !endDate || startDate >= endDate) return 0;

    let revenue = 0;

    bookings.forEach(b => {
      // 1. Skip if we are filtering by specific rooms and this room isn't selected
      if (selectedRoomIds.length > 0 && !selectedRoomIds.includes(b.room.id)) return;

      const bStart = parseISO(b.startDate);
      const bEnd = parseISO(b.endDate);

      // 2. Find if the booking overlaps with our selected date range
      const overlapStart = bStart > startDate ? bStart : startDate;
      const overlapEnd = bEnd < endDate ? bEnd : endDate;
      const overlapNights = differenceInCalendarDays(overlapEnd, overlapStart);

      // 3. If there is an overlap, calculate the prorated price for those specific nights
      if (overlapNights > 0) {
        const totalBookingNights = differenceInCalendarDays(bEnd, bStart);
        const pricePerNight = b.price / totalBookingNights;
        revenue += overlapNights * pricePerNight;
      }
    });

    return revenue;
  }, [bookings, startDate, endDate, selectedRoomIds]);

  // Sort rooms for the UI
  const sortedRooms = [...rooms].sort((a, b) => parseInt(a.roomNumber) - parseInt(b.roomNumber));
  const isAllSelected = selectedRoomIds.length === 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mt-4 shrink-0 flex gap-6">
      
      {/* LEFT SIDE: Dates & Rooms */}
      <div className="flex-1 border-r border-slate-100 pr-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
          </svg>
          Справка Приходи
        </h2>

        {/* 1. Added flex-row to force side-by-side layout */}
        <div className="flex flex-row gap-4 mb-5">
          
          {/* 2. Added min-w-0 so Flexbox doesn't accidentally crush the inputs */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">От дата</label>
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => setStartDate(date)}
              dateFormat="dd/MM/yyyy"
              locale={bg}
              placeholderText="Начална дата"
              popperPlacement="bottom-start"
              className="w-full px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium h-10 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">До дата</label>
            <DatePicker
              selected={endDate}
              onChange={(date: Date | null) => setEndDate(date)}
              dateFormat="dd/MM/yyyy"
              locale={bg}
              minDate={startDate || undefined}
              placeholderText="Крайна дата"
              popperPlacement="bottom-start"
              className="w-full px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium h-10 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
          
        </div>
        

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex justify-between items-end">
            <span>Филтър по стаи</span>
            <button onClick={selectAll} className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${isAllSelected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              Всички стаи
            </button>
          </label>
          <div className="flex flex-wrap gap-2">
            {sortedRooms.map(room => {
              const isSelected = selectedRoomIds.includes(room.id);
              return (
                <button
                  key={room.id}
                  onClick={() => toggleRoom(room.id)}
                  className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-all border ${
                    isSelected 
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' 
                      : isAllSelected 
                        ? 'bg-slate-100 text-slate-700 border-slate-200' // If all selected, look default
                        : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-300 hover:text-emerald-500'
                  }`}
                >
                  {room.roomNumber}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: The Big Total */}
      <div className="w-64 flex flex-col justify-center items-center bg-emerald-50 rounded-xl border border-emerald-100 p-6">
        <div className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-2 text-center">
          Генериран Приход
        </div>
        
        {(!startDate || !endDate) ? (
          <div className="text-slate-400 text-sm font-medium text-center italic mt-2">
            Изберете период,<br/>за да видите резултат
          </div>
        ) : (
          <>
            <div className="text-4xl font-black text-emerald-700 drop-shadow-sm mb-1">
              {totalRevenue.toFixed(0)} €
            </div>
            <div className="text-sm font-bold text-emerald-600/70">
              ≈ {(totalRevenue * 1.95583).toFixed(2)} лв.
            </div>
            
            <div className="mt-4 text-xs font-semibold text-emerald-600/80 bg-emerald-100/50 px-3 py-1.5 rounded-full">
              За {differenceInCalendarDays(endDate, startDate)} нощувки
            </div>
          </>
        )}
      </div>

    </div>
  );
}