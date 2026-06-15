export interface Category {
  id: number;
  name: string;
  basePrice: number;
  discountPrice: number;
}

export interface Room {
  id: number;
  roomNumber: string;
  category: Category;
}

export interface Booking {
  id: number;
  room: Room;
  displayName: string;
  guestsCount: number;
  startDate: string; 
  endDate: string;   
  price: number;
  discount: number; 
  notes: string;
  isPaid: boolean;
}

export interface DailyNote {
  id?: number;
  date: string;
  text: string;
}

export interface SelectedSlot {
  room: Room;
  date: Date;
  existingBooking?: Booking;
}

// Tells TypeScript exactly what we are sending to the backend (Everything in Booking except the ID!)
export type BookingPayload = Omit<Booking, 'id'>;