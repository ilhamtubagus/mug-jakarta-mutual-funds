#!/bin/bash

#Export env file into environment variables
export $(xargs < '../.env')

#Construct mongo config
config="mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@${DB_INSTANCES}/${DB_NAME}?${DB_OPTIONS}"

#Execute mongo script with above config
echo "Executing script for Mongo config: $config"

mongo "${config}" ./scripts/index.js

