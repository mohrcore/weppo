#!/bin/bash

DBDIR=db
DBNAME=kolo
INITDBDIR=initdb
PORT=27017

if [ -d "${DBDIR}" ]; then
    rm -r ${DBDIR}
fi

mkdir ${DBDIR}

mongod --dbpath ${DBDIR} --port ${PORT} &
MONGOD_PID=`echo $!`

CONNECTION_STRING="mongodb://localhost:${PORT}"

for f in ${INITDBDIR}/*; do
    bname=`basename ${f}`
    collection="${bname%.*}"
    mongoimport ${CONNECTION_STRING} --db ${DBNAME} --collection ${collection} --file ${f}
done

kill ${MONGOD_PID}
echo "-----------> PID: ${MONGOD_PID}"
