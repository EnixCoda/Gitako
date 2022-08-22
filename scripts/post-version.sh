#!/bin/bash
# exit on error
set -e

# get current version
version=$(node scripts/get-version.js)

# remove git tag
git tag -d v$version

# update Safari version
make version-safari

# merge to previous git
git add .
git commit --amend --no-edit

# add git tag
git tag v$version
