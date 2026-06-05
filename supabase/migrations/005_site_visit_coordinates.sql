-- ============================================================
-- Proline Business OS — Migration 005: Site Visit Coordinates
-- ============================================================
-- WHY: Site visits need latitude/longitude columns so mobile
-- users can auto-capture their location and later navigate to
-- the site via Google Maps.
-- ============================================================

alter table site_visits
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;
