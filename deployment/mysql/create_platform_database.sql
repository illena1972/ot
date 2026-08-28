-- Execute this script once in MySQL Workbench as a MySQL administrator.
-- It creates the central SaaS platform database only.
-- The existing bioclean_local database and its data are not changed.

CREATE DATABASE IF NOT EXISTS bioclean_platform
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

GRANT ALL PRIVILEGES ON bioclean_platform.* TO 'bioclean_app'@'localhost';

FLUSH PRIVILEGES;
