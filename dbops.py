import sys
from pymongo import MongoClient
import pymongo
import os

client = MongoClient("localhost", 27017)
db = client.kolo

if (sys.argv[1] == "dump"):
    os.system("mkdir mongodump_tmp")
    for colname in db.list_collection_names():
        print(f"dumping {colname}")
        os.system(f"mongoexport --collection={colname} --db=kolo --out=mongodump_tmp/{colname}.json")
    os.system("rm -rf initdb")
    os.system("mv mongodump_tmp/ initdb/")

if (sys.argv[1] == "load"):
    for f in os.listdir("initdb"):
        col = f.split('.')[0]
        print(f"loading {f} to {col}")
        db.drop_collection(col)
        os.system(f"mongoimport mongodb://localhost:27017 --db=kolo --collection {f.split('.')[0]} --file initdb/{f}")
