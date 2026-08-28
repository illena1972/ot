-- Пустая база для проверки второй организации.
-- Рабочие базы bioclean_local и bioclean_platform этот скрипт не изменяет.

CREATE DATABASE IF NOT EXISTS bioclean_demo
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

GRANT ALL PRIVILEGES ON bioclean_demo.* TO 'bioclean_app'@'localhost';
FLUSH PRIVILEGES;
