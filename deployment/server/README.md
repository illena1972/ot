# Развертывание на Beget

Точные пути и имена баз нужно подставить из панели конкретного аккаунта Beget.

1. Загрузить содержимое релиза в каталог сайта `app.bioclean.ru` рядом с
   `public_html`.
2. Создать виртуальное окружение `venv` и установить зависимости командой
   `pip install -r requirements.txt`.
3. Скопировать `config/hosting.env.example` в `.env`, установить
   `BIOCLEAN_ENV=prod`, надежный
   `BIOCLEAN_SECRET_KEY` и реквизиты MySQL. Файл `.env` не публиковать.
   Если хостинг выдает отдельного MySQL-пользователя каждой базе, добавить для
   последующих организаций переменные
   `BIOCLEAN_ORGANIZATION_<SLUG>_DATABASE_USER` и
   `BIOCLEAN_ORGANIZATION_<SLUG>_DATABASE_PASSWORD`.
4. Скопировать `.htaccess.example` в `.htaccess` и заменить `BEGET_LOGIN` на
   логин аккаунта Beget.
5. Создать ссылку `public`, указывающую на `public_html`, если этого требует
   конфигурация Passenger на аккаунте.
6. Выполнить `python manage.py migrate_all_organizations`, затем
   `python manage.py collectstatic --noinput`.
7. Перезапустить Passenger через файл `tmp/restart.txt`.

Перед первой публикацией обязательно сделать резервные копии всех баз данных.

Для следующих обновлений после резервного копирования можно выполнить
`bash deployment/server/update.sh`. Скрипт проверит конфигурацию, применит
миграции ко всем активным организациям, соберет статику и перезапустит
Passenger.

Ежедневные резервные копии всех баз создаются командой
`bash deployment/server/backup.sh`. Настройка хранения и CronTab описана в
файле `DATABASE_BACKUPS.md`.

Повторяемый порядок подключения следующего клиента описан в файле
`docs/add-organization-beget.md` исходного проекта.
