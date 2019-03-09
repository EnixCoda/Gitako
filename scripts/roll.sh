#!/bin/sh
rm -rf dist
NODE_ENV=production yarn webpack
GITAKO_VERSION=$(node scripts/get-version.js)
echo "Got version $GITAKO_VERSION"

# sentry
yarn sentry-cli releases new "$GITAKO_VERSION"
yarn sentry-cli releases files "$GITAKO_VERSION" upload-sourcemaps dist --no-rewrite
yarn sentry-cli releases finalize "$GITAKO_VERSION"

cd dist
rm -f ./gitako.zip
zip -r gitako.zip * -x *.map 
