import pymysql

# Django loads this package before settings.py reads .env. Register the pure
# Python MySQL driver unconditionally so both SQLite and MySQL modes start.
pymysql.install_as_MySQLdb()
