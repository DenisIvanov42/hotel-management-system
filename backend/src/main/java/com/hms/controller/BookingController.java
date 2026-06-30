package com.hms.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hms.entity.Booking;
import com.hms.repository.BookingRepository;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*") 
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    // 1. GET ALL BOOKINGS (React calls this when the page loads)
    @GetMapping
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // 2. CREATE A NEW BOOKING (React calls this when "Запази" is clicked on a new slot)
    @PostMapping
    public Booking createBooking(@RequestBody Booking booking) {
        return bookingRepository.save(booking);
    }

    // 3. UPDATE AN EXISTING BOOKING (React calls this when "Запази" is clicked on a blue block)
    @PutMapping("/{id}")
    public Booking updateBooking(@PathVariable Long id, @RequestBody Booking bookingDetails) {
        // Find the old booking in the database
        Booking booking = bookingRepository.findById(id).orElseThrow();
        
        // Update its fields
        booking.setRoom(bookingDetails.getRoom());
        booking.setDisplayName(bookingDetails.getDisplayName());
        booking.setGuestsCount(bookingDetails.getGuestsCount());
        booking.setStartDate(bookingDetails.getStartDate());
        booking.setEndDate(bookingDetails.getEndDate());
        booking.setPrice(bookingDetails.getPrice());
        booking.setDiscount(bookingDetails.getDiscount());
        booking.setNotes(bookingDetails.getNotes());
        
        // Save and return it
        return bookingRepository.save(booking);
    }

    // 4. DELETE A BOOKING
    @DeleteMapping("/{id}")
    public void deleteBooking(@PathVariable Long id) {
        bookingRepository.deleteById(id);
    }
}
