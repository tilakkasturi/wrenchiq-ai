#!/bin/bash

MODULE=${1:-application}
PROJECT=$MODULE

BUILD_HOME="bin"
mkdir -p "$BUILD_HOME" "$BUILD_HOME"/"$PROJECT"

echo "Packaging $MODULE"

# If a subdirectory named $MODULE exists, cd into it (monorepo layout).
# Otherwise assume we're already running from inside the repo (Bitbucket Pipelines).
if [ -d "$MODULE" ]; then
  cd "$MODULE"
  tar --exclude "$MODULE.tar.gz" -zcf "../$BUILD_HOME/$MODULE.tar.gz" .
else
  tar --exclude "$MODULE.tar.gz" --exclude ".git" -zcf "$BUILD_HOME/$MODULE.tar.gz" .
fi

echo "$MODULE package created"


