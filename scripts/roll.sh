#!/bin/sh
rm -rf dist
yarn build

GITAKO_VERSION=v$(node scripts/get-version.js)
echo "Got version $GITAKO_VERSION"

# sentry
yarn sentry-cli releases new "$GITAKO_VERSION"
yarn sentry-cli releases set-commits --auto $GITAKO_VERSION
yarn sentry-cli releases files "$GITAKO_VERSION" upload-sourcemaps dist --no-rewrite
yarn sentry-cli releases finalize "$GITAKO_VERSION"

cd dist
rm -f ./gitako.zip
zip -r gitako.zip * -x *.map
