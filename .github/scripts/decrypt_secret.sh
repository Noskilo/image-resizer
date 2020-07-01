#!/bin/sh

# Decrypt the file
gpg --quiet --batch --yes --decrypt --passphrase="$SECRET_PASSWORD" \
--output .github/secrets/admin-secret.json .github/secrets/admin-secret.json.gpg