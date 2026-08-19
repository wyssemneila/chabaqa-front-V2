# Native systemd migration

Native services must be cut over only with the Docker Mongo/Redis volumes retained.
The systemd units are installed from this directory after a verified restore.

`chabaqa-openwa.service` is optional and runs the native OpenWA multi-session
gateway for creator campaigns. Its port stays localhost-only; follow
`docs/OPENWA_NATIVE.md` before enabling it.
