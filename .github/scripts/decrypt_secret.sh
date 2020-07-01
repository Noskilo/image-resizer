#!/bin/sh

# Decrypt the file
mkdir $HOME/secrets
gpg --quiet --batch --yes --decrypt --passphrase=$SECRET_PASSWORD \
--output $HOME/secrets/admin-secret.json admin-secret.json.gpg