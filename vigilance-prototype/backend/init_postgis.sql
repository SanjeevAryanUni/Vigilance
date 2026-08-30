-- PostGIS initialization script for VIGILANCE Road Damage Intelligence Platform
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verified spatial index query for DBSCAN clustering (15 meters threshold)
-- SELECT ST_ClusterDBSCAN(ST_Transform(geom, 3857), eps := 15.0, minpoints := 1) OVER () AS cluster_id, * FROM detections;
