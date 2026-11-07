# Development runtime

The four runtime files in this folder are copied unmodified from the PHP 8.4 runtime in the installed `laravel/sail` v1.69.0 package (MIT), maintained by Laravel and its contributors. Original source: https://github.com/laravel/sail/tree/v1.69.0/runtimes/8.4

The tracked copy allows a clean checkout to build its Sail application image without installing thousands of PHP dependency files into the Windows/OneDrive checkout. Composer and Node dependencies live in Docker-managed Linux volumes; editable application source stays in the project folder.

When deliberately updating Sail, refresh these four files from the reviewed locked package version and rerun the image/platform/startup tests. Do not modify vendor files or silently switch runtimes.
