package com.hms;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.hms.entity.Category;
import com.hms.entity.Room;
import com.hms.repository.CategoryRepository;
import com.hms.repository.RoomRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoomRepository roomRepository;
    private final CategoryRepository categoryRepository;

    public DataInitializer(RoomRepository roomRepository, CategoryRepository categoryRepository) {
        this.roomRepository = roomRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (categoryRepository.count() == 0) {
            System.out.println("Seeding Categories...");
            
            Category eco = createCategory("ИКОНОМИЧНА", 105.0, 95.0);
            Category standard = createCategory("СТАНДАРТНА", 115.0, 105.0);
            Category lux = createCategory("ЛУКС (ВАНА)", 125.0, 115.0);
            Category studio = createCategory("СТУДИО", 135.0, 125.0);
            Category studioLux = createCategory("СТУДИО ЛУКС", 145.0, 135.0);

            categoryRepository.saveAll(List.of(eco, standard, lux, studio, studioLux));

            System.out.println("Seeding Rooms...");
            roomRepository.saveAll(List.of(
                createRoom("105", eco), createRoom("110", eco), createRoom("203", eco),
                createRoom("205", eco), createRoom("210", eco), createRoom("215", eco),
                
                createRoom("106 (2+2)", standard), createRoom("108 (2+1+1)", standard),
                createRoom("112 (2+1+1)", standard), createRoom("114 (2+2)", standard),
                createRoom("111 (2+1+1)", standard), createRoom("113 (2+2)", standard),
                createRoom("206", standard), createRoom("207", standard),
                createRoom("208", standard), createRoom("209", standard),
                createRoom("211", standard), createRoom("212", standard),
                createRoom("213", standard), createRoom("214", standard),
                createRoom("217", standard),

                createRoom("107 (2+2)", lux), createRoom("109 (2+1+1)", lux),

                createRoom("103 (2+2)", studio), createRoom("104 (2+2)", studio),
                createRoom("202 (3)", studio), createRoom("204 (3)", studio),

                createRoom("102 (4)", studioLux), createRoom("201 (4)", studioLux)
            ));
            System.out.println("Database Initialized!");
        }
    }

    private Category createCategory(String name, Double base, Double discount) {
        Category c = new Category();
        c.setName(name);
        c.setBasePrice(base);
        c.setDiscountPrice(discount);
        return c;
    }

    private Room createRoom(String number, Category category) {
        Room room = new Room();
        room.setRoomNumber(number);
        room.setCategory(category);
        return room;
    }
}