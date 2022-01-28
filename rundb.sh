#!/bin/bash

DBDIR=db
PORT=27017

mongod --dbpath ${DBDIR} --port ${PORT}
