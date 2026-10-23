Lossless transfer copy of the verified production download.
Direct uploads.github.com authentication is unavailable from the cloud
workspace. GitHub Actions reassembles these sub-100MB parts, checks the full
ZIP checksum and every archived file, and publishes the permanent assets.

To restore manually (POSIX shell), from this directory:
cat production.part-* > LAST-SAVE-Soundtrack-Production.zip
sha256sum --check LAST-SAVE-Soundtrack-Production.zip.sha256
unzip LAST-SAVE-Soundtrack-Production.zip

These are media transfer files only, excluded from the game's main branch.
