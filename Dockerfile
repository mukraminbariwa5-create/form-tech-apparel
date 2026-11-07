# Production build. Resolve and commit composer.lock before release.
FROM node:24-alpine AS frontend
WORKDIR /build
COPY package*.json ./
RUN npm ci
COPY vite.config.ts tsconfig.json ./
COPY resources resources
RUN npm run build:ssr && npm prune --omit=dev

FROM php:8.4-fpm-alpine AS php-base
RUN apk add --no-cache icu-libs libpq oniguruma libzip \
    && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS icu-dev postgresql-dev oniguruma-dev libzip-dev \
    && docker-php-ext-install pdo_pgsql mbstring intl bcmath zip opcache \
    && apk del .build-deps
WORKDIR /var/www/html

FROM php-base AS application
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY . .
RUN test -f composer.lock && composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
COPY --from=frontend /build/public/build public/build
COPY --from=frontend /build/bootstrap/ssr bootstrap/ssr
COPY docker/php-production.ini /usr/local/etc/php/conf.d/99-form-tech.ini
RUN chown -R www-data:www-data storage bootstrap/cache
USER www-data
CMD ["php-fpm"]

FROM node:24-alpine AS ssr
WORKDIR /var/www/html
COPY --from=frontend /build/node_modules node_modules
COPY --from=frontend /build/bootstrap/ssr bootstrap/ssr
USER node
CMD ["node", "bootstrap/ssr/ssr.js"]

FROM caddy:2-alpine AS web
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY public /var/www/html/public
COPY --from=frontend /build/public/build /var/www/html/public/build
