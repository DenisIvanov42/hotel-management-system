package com.hms.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hms.entity.DailyNote;
import com.hms.repository.DailyNoteRepository;

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = "http://localhost:5173")
public class DailyNoteController {

    @Autowired
    private DailyNoteRepository noteRepository;

    @GetMapping
    public List<DailyNote> getAllNotes() {
        return noteRepository.findAll();
    }

    // A smart "Upsert" - if a note exists for this date, update it. If not, create it!
    @PostMapping
    public DailyNote saveNote(@RequestBody DailyNote requestNote) {
        Optional<DailyNote> existingNote = noteRepository.findByDate(requestNote.getDate());
        
        if (existingNote.isPresent()) {
            DailyNote noteToUpdate = existingNote.get();
            noteToUpdate.setText(requestNote.getText());
            return noteRepository.save(noteToUpdate);
        } else {
            return noteRepository.save(requestNote);
        }
    }
}