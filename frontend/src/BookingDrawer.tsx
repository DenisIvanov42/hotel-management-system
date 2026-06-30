import { addDays, differenceInCalendarDays, eachDayOfInterval, format, isSameDay, parseISO, subDays } from 'date-fns';
import { bg } from 'date-fns/locale';
import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import type { Booking, BookingPayload, SelectedSlot } from './types';

interface BookingDrawerProps {
  isOpen: boolean;
  slot: SelectedSlot | null;
  bookings: Booking[];
  onClose: () => void;
  onSave: (payload: BookingPayload, existingId?: number) => void;
  onDelete: (id: number) => void;
}

// 🎨 Our predefined Excel-like color palette
const PALETTE = [
  { id: 'slate', bg: 'bg-slate-500', ring: 'ring-slate-500' },
  { id: 'orange', bg: 'bg-orange-500', ring: 'ring-orange-500' },
  { id: 'blue', bg: 'bg-blue-500', ring: 'ring-blue-500' },
  { id: 'emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { id: 'rose', bg: 'bg-rose-500', ring: 'ring-rose-500' },
  { id: 'cyan', bg: 'bg-cyan-500', ring: 'ring-cyan-500' },
  { id: 'purple', bg: 'bg-purple-500', ring: 'ring-purple-500' },
];

export default function BookingDrawer({ isOpen, slot, bookings, onClose, onSave, onDelete }: BookingDrawerProps) {
  const [prevSlot, setPrevSlot] = useState<SelectedSlot | null>(slot);
  
  const [checkoutDate, setCheckoutDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState<number>(2);
  const [overridePrice, setOverridePrice] = useState<string | null>(null);
  const [discount, setDiscount] = useState<number | string>(0);
  const [displayName, setDisplayName] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('slate'); // Default color

  if (slot !== prevSlot) {
    setPrevSlot(slot);
    if (slot) {
      if (slot.existingBooking) {
        setCheckoutDate(parseISO(slot.existingBooking.endDate));
        setGuests(slot.existingBooking.guestsCount);
        setDiscount(slot.existingBooking.discount || 0);
        setOverridePrice(slot.existingBooking.price.toFixed(2));
        setDisplayName(slot.existingBooking.displayName);
        setBookingNotes(slot.existingBooking.notes);
        setSelectedColor(slot.existingBooking.color || 'slate');
      } else {
        setCheckoutDate(addDays(slot.date, 1));
        setGuests(2);
        setDiscount(0);
        setOverridePrice(null);
        setDisplayName('');
        setBookingNotes('');
        setSelectedColor('slate');
      }
    }
  }

  const actualCheckinDate = slot?.existingBooking ? parseISO(slot.existingBooking.startDate) : slot?.date;

  let baseTotal = 0;
  let autoPrice = 0;
  let calculatedNights = 0;

  if (actualCheckinDate && checkoutDate && checkoutDate > actualCheckinDate) {
    calculatedNights = differenceInCalendarDays(checkoutDate, actualCheckinDate);
    if (slot?.room.category) {
      const cat = slot.room.category;
      const ratePerNight = calculatedNights >= 3 ? cat.discountPrice : cat.basePrice;
      baseTotal = ratePerNight * calculatedNights;
      if (guests > 2) baseTotal += ((guests - 2) * 30 * calculatedNights);
      
      const parsedDiscount = typeof discount === 'string' ? parseFloat(discount) || 0 : discount;
      const discountAmountInEur = baseTotal * (parsedDiscount / 100);
      autoPrice = Math.max(0, baseTotal - discountAmountInEur);
    }
  }

  const displayPrice = overridePrice !== null ? overridePrice : autoPrice.toFixed(2);
  const actualDiscountAmountEur = baseTotal > 0 ? Math.max(0, baseTotal - parseFloat(displayPrice || '0')) : 0;

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setDiscount(valStr);
    const valNum = parseFloat(valStr);
    if (!isNaN(valNum) && baseTotal > 0) {
      const newPrice = baseTotal - (baseTotal * (valNum / 100));
      setOverridePrice(newPrice.toFixed(2));
    } else if (valStr === '') {
      setOverridePrice(null); 
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setOverridePrice(valStr);
    const valNum = parseFloat(valStr);
    if (!isNaN(valNum) && baseTotal > 0) {
      const newDiscount = ((baseTotal - valNum) / baseTotal) * 100;
      setDiscount(parseFloat(newDiscount.toFixed(2))); 
    } else if (valStr === '') {
      setDiscount(0);
    }
  };

  const getExcludedDates = () => {
    if (!slot) return [];
    const dates: Date[] = [];
    bookings.forEach(b => {
      if (b.room.id === slot.room.id && b.id !== slot.existingBooking?.id) {
        const interval = eachDayOfInterval({ start: parseISO(b.startDate), end: subDays(parseISO(b.endDate), 1) });
        dates.push(...interval);
      }
    });
    return dates;
  };

  const getMaxCheckoutDate = () => {
    if (!slot || !actualCheckinDate) return undefined;
    const futureBookings = bookings
      .filter(b => b.room.id === slot.room.id && b.id !== slot.existingBooking?.id)
      .map(b => parseISO(b.startDate))
      .filter(date => date >= actualCheckinDate)
      .sort((a, b) => a.getTime() - b.getTime());
    return futureBookings.length > 0 ? futureBookings[0] : undefined;
  };

  const handleSave = () => {
    if (!slot || !checkoutDate || !actualCheckinDate) return;
    const finalDiscount = typeof discount === 'string' ? parseFloat(discount) || 0 : discount;
    const payload: BookingPayload = {
      room: slot.room,
      startDate: format(actualCheckinDate, 'yyyy-MM-dd'),
      endDate: format(checkoutDate, 'yyyy-MM-dd'),
      displayName: displayName || 'Резервация',
      guestsCount: guests,
      price: parseFloat(displayPrice) || 0,
      discount: finalDiscount,
      notes: bookingNotes || '',
      color: selectedColor // Pass the color to backend!
    };
    onSave(payload, slot.existingBooking?.id);
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[60] transition-opacity" onClick={onClose} />}
      
      <div className={`fixed top-0 right-0 h-full w-[450px] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{slot?.existingBooking ? 'Редакция на Резервация' : 'Нова Резервация'}</h2>
            <p className="text-sm text-slate-500">Стая <span className="font-bold text-indigo-600">{slot?.room.roomNumber}</span> ({slot?.room.category?.name})</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Dates */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Настаняване</label>
              <div className="w-full px-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium h-[48px] flex items-center">
                {actualCheckinDate ? format(actualCheckinDate, 'dd/MM/yyyy', { locale: bg }) : ''}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center pt-5 px-1 text-slate-400">
              <div className={`text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap mb-1 transition-colors ${calculatedNights > 0 ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                {calculatedNights > 0 ? `${calculatedNights} нощ.` : '-'}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Напускане</label>
              <DatePicker
                selected={checkoutDate}
                onChange={(date: Date | null) => { setCheckoutDate(date); setOverridePrice(null); }}
                dateFormat="dd/MM/yyyy"
                minDate={actualCheckinDate ? addDays(actualCheckinDate, 1) : new Date()} 
                maxDate={getMaxCheckoutDate()}
                excludeDates={getExcludedDates()}
                popperPlacement="bottom-end"
                className="w-full px-3 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium h-[48px] focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                renderDayContents={(day: number, date?: Date) => {
                  let tooltip = "";
                  let isBooked = false;
                  if (date) {
                    isBooked = getExcludedDates().some(d => isSameDay(d, date));
                    if (!isBooked && actualCheckinDate && date > actualCheckinDate) {
                      tooltip = `${differenceInCalendarDays(date, actualCheckinDate)} нощувки`;
                    }
                  }
                  return <div title={isBooked ? "Стаята е заета" : tooltip} className={isBooked ? "text-red-400 line-through font-bold" : ""}>{day}</div>;
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Име (или група)</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full p-3 bg-white border border-slate-300 rounded-lg h-[48px] focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Гости</label>
              <input type="number" min="1" value={guests} onChange={(e) => { setGuests(parseInt(e.target.value) || 1); setOverridePrice(null); }} className="w-full px-3 bg-white border border-slate-300 rounded-lg h-[48px] focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Отстъпка (%)</label>
              <div className="relative flex items-center">
                <input type="number" step="5" min="0" max="100" value={discount} onChange={handleDiscountChange} className="w-full px-3 pr-8 bg-white border border-slate-300 rounded-lg font-bold h-[48px] text-orange-600 focus:ring-2 focus:ring-indigo-500 outline-none" />
                <span className="absolute right-4 text-slate-400 font-bold pointer-events-none">%</span>
              </div>
              <div className="mt-1 text-xs font-semibold text-orange-500">
                - {actualDiscountAmountEur.toFixed(2)} €
              </div>
            </div>
            
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Общо (EUR)</label>
              <div className="relative flex items-center">
                <input type="number" step="5" value={displayPrice} onChange={handlePriceChange} className="w-full px-3 pr-8 bg-white border border-slate-300 rounded-lg font-bold h-[48px] focus:ring-2 focus:ring-indigo-500 outline-none" />
                <span className="absolute right-4 text-slate-400 font-bold pointer-events-none">€</span>
              </div>
              <div className="mt-1 text-xs font-semibold text-emerald-600">
                ≈ {(parseFloat(displayPrice || '0') * 1.95583).toFixed(2)} лв.
              </div>
            </div>
          </div>

          {/* 🎨 NEW: The Color Picker Palette */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Цвят (Статус)</label>
            <div className="flex gap-3 bg-slate-50 p-3 border border-slate-200 rounded-lg">
              {PALETTE.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedColor(c.id)}
                  className={`w-8 h-8 rounded-full ${c.bg} shadow-sm border border-black/10 transition-all ${
                    selectedColor === c.id ? `ring-2 ring-offset-2 ${c.ring} scale-110` : 'hover:scale-110 hover:shadow-md'
                  }`}
                  title="Избери цвят"
                  type="button"
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Бележки към резервацията</label>
            <textarea rows={2} value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)} className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
          </div>
        </div>

        <div className="p-5 border-t border-slate-200 bg-slate-50 flex gap-3">
          {slot?.existingBooking && (
            <button onClick={() => onDelete(slot.existingBooking!.id)} className="px-4 py-3 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200 transition-colors">Изтрий</button>
          )}
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50">Отказ</button>
          <button onClick={handleSave} className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Запази</button>
        </div>
      </div>
    </>
  );
}