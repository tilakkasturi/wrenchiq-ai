#!/bin/bash

MODULE=${1:-application}
PROJECT=$MODULE

BUILD_HOME="bin"
mkdir -p "$BUILD_HOME" "$BUILD_HOME"/"$PROJECT"

echo "Packaging $MODULE"

cd $MODULE
tar --exclude $MODULE.tar.gz -zcvf ../"$BUILD_HOME"/$MODULE.tar.gz . 

echo "$MODULE packaged created"


