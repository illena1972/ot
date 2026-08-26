-- Execute this script once in MySQL Workbench as a MySQL administrator.
-- Replace the password below with a new long password before execution.
-- Do not save the password in this file after creating the user.

CREATE DATABASE IF NOT EXISTS bioclean_local
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

CREATE USER IF NOT EXISTS 'bioclean_app'@'localhost'
  IDENTIFIED BY 'REPLACE_WITH_A_LONG_RANDOM_PASSWORD';

GRANT ALL PRIVILEGES ON bioclean_local.* TO 'bioclean_app'@'localhost';

FLUSH PRIVILEGES;
