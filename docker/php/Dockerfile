# ==============================================================================
# docker/php/Dockerfile
#
# Kept intentionally simple — the previous version copied php.ini-production
# which enables settings (e.g. opcache.enable=1 without opcache extension)
# that can prevent PHP-FPM from starting, making localhost unreachable.
#
# APCu for FPM: the 00-apcu.ini written below is loaded by BOTH php-cli
# AND php-fpm because both scan the same conf.d directory.
# The 00- prefix ensures it loads before any other ini file (alphabetically).
# ==============================================================================

FROM php:8.3-fpm

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install pdo pdo_mysql

RUN pecl install apcu \
    && docker-php-ext-enable apcu

# Write APCu config as 00-apcu.ini so it sorts FIRST and cannot be overridden.
# apc.enable_cli=1 enables APCu in CLI (php -r, test commands).
# apc.enabled=1    enables APCu in FPM (web requests).
RUN { \
    echo "extension=apcu.so"; \
    echo "apc.enabled=1"; \
    echo "apc.enable_cli=1"; \
    echo "apc.shm_size=32M"; \
    echo "apc.ttl=3600"; \
    echo "apc.entries_hint=4096"; \
    } > /usr/local/etc/php/conf.d/00-apcu.ini

# Build-time verification — fails the build if anything is missing
RUN php -m | grep -i pdo_mysql \
    && php -m | grep -i apcu \
    && php -r "if(!apcu_store('t',1,5)||apcu_fetch('t')!==1){echo 'FAIL';exit(1);}echo 'APCu OK';"

WORKDIR /var/www/api