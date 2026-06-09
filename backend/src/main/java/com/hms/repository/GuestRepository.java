package com.hms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hms.entity.Guest;

@Repository
public interface GuestRepository extends JpaRepository<Guest, Long> {
}
