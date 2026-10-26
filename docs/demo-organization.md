# Демонстрационная организация

Демонстрационную организацию создают только в отдельной базе MySQL. Рабочую базу клиента First для презентаций не используют: в ней находятся реальные данные сотрудников.

## Что создаёт команда

Команда `seed_demo_organization` добавляет в организацию `demo`:

- четыре подразделения и три службы;
- пять должностей и пять вымышленных сотрудников;
- семь видов СИЗ и складские остатки;
- три нормы выдачи со сроками 12 и 18 месяцев;
- демонстрационные выдачи, рассчитанные относительно текущей даты.

На рабочем экране появляются примеры «Просрочено», «Срок заканчивается» и «Не выдано». Один сотрудник без назначенной нормы показывает, что фактические сроки выдачи контролируются и для таких сотрудников.

## Подготовка

1. Создайте пустую базу MySQL, например `bioclean_demo`.
2. Предоставьте используемому приложением пользователю MySQL права на эту базу.
3. Добавьте в файл Windows `hosts` строку с адресом сервера, например:

   ```text
   172.23.0.199 demo.bioclean.local
   ```

4. Добавьте `demo.bioclean.local` в `BIOCLEAN_ALLOWED_HOSTS`, а `http://demo.bioclean.local:8000` — в `BIOCLEAN_CSRF_TRUSTED_ORIGINS` файла `.env`.

## Создание организации

Из каталога приложения выполните:

```powershell
.\venv\Scripts\python.exe manage.py provision_organization `
  --name "BioClean Демо" `
  --slug demo `
  --database-name bioclean_demo `
  --domain demo.bioclean.local
```

Затем заполните демонстрационную базу:

```powershell
.\venv\Scripts\python.exe manage.py seed_demo_organization --organization demo
```

Создайте администратора отдельной командой и задайте уникальный пароль:

```powershell
.\venv\Scripts\python.exe manage.py create_organization_admin `
  --organization demo `
  --username demo_admin
```

Перезапустите службу приложения и откройте `http://demo.bioclean.local:8000`.

## Повторное формирование

Для пересоздания набора используйте оба защитных параметра:

```powershell
.\venv\Scripts\python.exe manage.py seed_demo_organization `
  --organization demo `
  --reset `
  --confirm-reset-demo
```

Команда принципиально работает только с организацией `demo`, имя базы которой содержит слово `demo`. Запуск для First или другого клиента будет отклонён.
