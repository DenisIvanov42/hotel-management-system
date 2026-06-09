package com.hms;

import com.hms.entity.Room;
import com.hms.repository.RoomRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoomRepository roomRepository;

    public DataInitializer(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (roomRepository.count() == 0) {
            System.out.println("Database is empty. Auto-filling ALL rooms...");
            roomRepository.saveAll(List.of(
                createRoom("105", "ИКОНОМИЧНА"),
                createRoom("110", "ИКОНОМИЧНА"),
                createRoom("203", "ИКОНОМИЧНА"),
                createRoom("205", "ИКОНОМИЧНА"),
                createRoom("210", "ИКОНОМИЧНА"),
                createRoom("215", "ИКОНОМИЧНА"),
                
                createRoom("106 (2+2)", "СТАНДАРТНА"),
                createRoom("108 (2+1+1)", "СТАНДАРТНА"),
                createRoom("112 (2+1+1)", "СТАНДАРТНА"),
                createRoom("114 (2+2)", "СТАНДАРТНА"),
                createRoom("111 (2+1+1)", "СТАНДАРТНА"),
                createRoom("113 (2+2)", "СТАНДАРТНА"),
                createRoom("206", "СТАНДАРТНА"),
                createRoom("207", "СТАНДАРТНА"),
                createRoom("208", "СТАНДАРТНА"),
                createRoom("209", "СТАНДАРТНА"),
                createRoom("211", "СТАНДАРТНА"),
                createRoom("212", "СТАНДАРТНА"),
                createRoom("213", "СТАНДАРТНА"),
                createRoom("214", "СТАНДАРТНА"),
                createRoom("217", "СТАНДАРТНА"),

                createRoom("107 (2+2)", "ЛУКС (ВАНА)"),
                createRoom("109 (2+1+1)", "ЛУКС (ВАНА)"),

                createRoom("103 (2+2)", "СТУДИО"),
                createRoom("104 (2+2)", "СТУДИО"),
                createRoom("202 (3)", "СТУДИО"),
                createRoom("204 (3)", "СТУДИО"),

                createRoom("102 (4)", "СТУДИО ЛУКС"),
                createRoom("201 (4)", "СТУДИО ЛУКС")
            ));
            System.out.println("All rooms added successfully!");
        }
    }

    private Room createRoom(String number, String category) {
        Room room = new Room();
        room.setRoomNumber(number);
        room.setCategory(category);
        return room;
    }
}
