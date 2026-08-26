import os


if os.getenv("BIOCLEAN_DATABASE_ENGINE", "sqlite").lower() == "mysql":
    import pymysql

    pymysql.install_as_MySQLdb()
