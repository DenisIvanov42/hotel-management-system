package com.hms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hms.entity.Room;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
}
