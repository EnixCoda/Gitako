#!/bin/sh
rm -rf dist
yarn build

GIT_SHA=$(git rev-parse HEAD)
VERSION=v$(node scripts/get-version.js)
echo "Got version $VERSION"

# sentry
git push # make sure sentry can retrieve current commit on remote
yarn sentry-cli releases new "$VERSION"
yarn sentry-cli releases set-commits "$VERSION" --auto
yarn sentry-cli releases files "$VERSION" upload-sourcemaps dist --no-rewrite
yarn sentry-cli releases finalize "$VERSION"

cd dist
rm -f ./gitako.zip
zip -r gitako.zip * -x *.map
