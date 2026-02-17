MariaDB einloggen:

# Als root
docker exec -it mariadb mariadb -u root -proot

# Oder als appuser
docker exec -it mariadb mariadb -u appuser -paddpassword appdb

# Tabellen prüfen:
USE appdb;
SHOW TABLES;
SELECT * FROM users;



# ALLE user anzeigen:
curl http://localhost/api/users.php

# Alle Tokens
curl http://localhost/api/tokens.php