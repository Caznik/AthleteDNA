package com.caznik.athletedna.domain.model;

import java.util.List;

// A single page of activities plus the total count of matching rows (across all
// pages), so callers can compute how many pages exist. Framework-free on purpose:
// the persistence adapter translates Spring Data's Page into this, keeping the
// domain independent of Spring.
public record ActivityPage(List<Activity> items, long totalElements) {}
