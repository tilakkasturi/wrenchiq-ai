#!/bin/bash

PROJECT=$1
REPO=$BITBUCKET_REPO_FULL_NAME
BUILD_HOME="bin"
README=README.txt
VERSION=version.txt
mkdir -p "$BUILD_HOME" "$BUILD_HOME"/"$PROJECT"

echo "Tagging versions"

cd "$BUILD_HOME"
echo -e "Project : $PROJECT\n Repo : $REPO\n Version : $BITBUCKET_TAG\n Build Number : $BITBUCKET_BUILD_NUMBER\n Tag : $BITBUCKET_TAG\n git revision : $BITBUCKET_COMMIT\n created by: $BITBUCKET_STEP_TRIGGERER_UUID" >>README.txt
echo -e "Project : $PROJECT\n Repo : $REPO\n Version : $BITBUCKET_TAG\n Build Number : $BITBUCKET_BUILD_NUMBER\n Tag : $BITBUCKET_TAG\n git revision : $BITBUCKET_COMMIT\n created by: $BITBUCKET_STEP_TRIGGERER_UUID" >>version.txt

cp -r  "$PROJECT".tar.gz $PROJECT
cp -r  "$README"  $PROJECT
cp -r  "$VERSION" $PROJECT