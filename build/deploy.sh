#!/bin/bash
#AZURE_CONTAINER_NAME=data
set -ex
DEPLOYMENT_ENVIRONMENT=$1
PROJECT=$2
TAG=$BITBUCKET_TAG

if [ -z "$TAG" ]; then
  TAG=$(echo $BITBUCKET_BRANCH | tr "/" "-")
fi

echo "Deploying artifacts"

az config set extension.use_dynamic_install=yes_without_prompt
az storage fs directory upload -f buildartifacts --account-name $AZURE_STORAGE_ACCOUNT -s "bin/$PROJECT/*" -d $PROJECT/$DEPLOYMENT_ENVIRONMENT/release/$TAG --recursive --account-key "$AZURE_STORAGE_ACCOUNT_KEY"
if [[ "$DEPLOYMENT_ENVIRONMENT" == "PROD" ]]; then
  az storage fs directory upload -f buildartifacts --account-name $AZURE_STORAGE_ACCOUNT -s "bin/$PROJECT/*" -d $PROJECT/$DEPLOYMENT_ENVIRONMENT/release/LATEST --recursive --account-key "$AZURE_STORAGE_ACCOUNT_KEY"
fi
#az storage blob directory upload -c buildartifacts --account-name $AZURE_STORAGE_ACCOUNT -s "$PROJECT_ui.zip" -d  $AZURE_CONTAINER_NAME/$DEPLOYMENT_ENVIRONMENT/$BITBUCKET_TAG/$PROJECT --recursive --account-key "$AZURE_STORAGE_ACCOUNT_KEY"
