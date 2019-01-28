#!/bin/bash
# here is comment
num="123"


echo 'Hello world'
echo $num
#database
date=`date +%Y%m`
# mongodump -h 127.0.0.1 --port 27040 -u rscdba -p a11111 -d rsc_main -o /root/server/dbback/${date}/
# mongodump -h 127.0.0.1 --port 27040 -u rscdba -p a11111 -d rsc_trade -o /root/server/dbback/${date}/
# mongodump -h 127.0.0.1 --port 27040 -u rscdba -p a11111 -d rsc_traffic -o /root/server/dbback/${date}/
# mongodump -h 127.0.0.1 --port 27040 -u rscdba -p a11111 -d rsc_store -o /root/server/dbback/${date}/
# mongodump -h 127.0.0.1 --port 27040 -u rscdba -p a11111 -d rsc_map -o /root/server/dbback/${date}/
# mongodump -h 127.0.0.1 --port 27040 -u rscdba -p a11111 -d rsc_dynamic -o /root/server/dbback/${date}/
# mongodump -h 127.0.0.1 --port 27040 -u rscdba -p a11111 -d rsc_store -o /root/server/dbback/${date}/
# mongodump -h 127.0.0.1 --port 27040 -u rscdba -p a11111 -d rsc_statistical -o /root/server/dbback/${date}/
# mongodump -h 127.0.0.1 --port 27040 -u rscdba -p a11111 -d rsc_im -o /root/server/dbback/${date}/

mongodump -h 127.0.0.1 --port 27033 -u rscdba -p a11111 -d rsc_main -o /root/code/date/back/${date}/
mongodump -h 127.0.0.1 --port 27033 -u rscdba -p a11111 -d rsc_trade -o /root/code/date/back/${date}/
mongodump -h 127.0.0.1 --port 27033 -u rscdba -p a11111 -d rsc_traffic -o /root/code/date/back/${date}/
mongodump -h 127.0.0.1 --port 27033 -u rscdba -p a11111 -d rsc_store -o /root/code/date/back/${date}/
mongodump -h 127.0.0.1 --port 27033 -u rscdba -p a11111 -d rsc_map -o /root/code/date/back/${date}/
#mongodump -h 127.0.0.1 --port 27033 -u rscdba -p a11111 -d rsc_dynamic -c unify_dynamics -o /root/code/date/back/${date}/rsc_dynamic/unify_dynamics
mongodump -h 127.0.0.1 --port 27033 -u rscdba -p a11111 -d rsc_store -o /root/code/date/back/${date}/
mongodump -h 127.0.0.1 --port 27033 -u rscdba -p a11111 -d rsc_statistical -o /root/code/date/back/${date}/
mongodump -h 127.0.0.1 --port 27033 -u rscdba -p a11111 -d rsc_im -o /root/code/date/back/${date}/
mongodump -h 127.0.0.1 --port 27035 -u rscdba -p a11111 -d rsc_pay -o /root/code/date/back/${date}/
