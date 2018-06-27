#!/bin/bash

# Check optional
if [ -z $SERVER_PORT ]; then export SERVER_PORT=443; fi
if [ -z $MAXIMUM_CONNECTIONS_FROM_BROWSER ]; then export MAXIMUM_CONNECTIONS_FROM_BROWSER=256; fi
if [ -z $MAXIMUM_CONNECTIONS_FROM_TERMINAL ]; then export MAXIMUM_CONNECTIONS_FROM_TERMINAL=256; fi
if [ -z $FEE ]; then export FEE=0.18; fi
if [ -z $TYPE ]; then export TYPE=12; fi
if [ -z $POOL_NAME ]; then echo 'You need to input a pool name using POOL_NAME ENV variable'; exit; fi
if [ -z $POOL_WEBSITE ]; then echo 'You need to input a pool website using POOL_WEBSITE ENV variable'; exit; fi
if [ -z $POOL_SERVERS ]; then export POOL_SERVERS='https://p1.webdollar.fun'; fi

# Check NOSSL in case we don't need a SSL
if [ -z $NOSSL ]; then

	# Check requirements
	if [ -z $EMAIL ]; then echo "Please fill environment variable EMAIL"; exit; fi
	if [ -z $DOMAIN ]; then echo "Please fill environment variable DOMAIN"; exit; fi

	echo "Generate $DOMAIN certificate"
	certbot certonly --text --non-interactive --rsa-key-size 4096 --agree-tos \
					 --standalone --expand --reinstall --email $EMAIL -d $DOMAIN

	# Symbolic links
	ln -s /etc/letsencrypt/live/$DOMAIN/privkey.pem certificates/private.key
	ln -s /etc/letsencrypt/live/$DOMAIN/cert.pem certificates/certificate.crt
	ln -s /etc/letsencrypt/live/$DOMAIN/chain.pem certificates/ca_bundle.crt

fi

# Start Pool
if [ $TYPE = 11]; then
(sleep 15;echo 11;sleep 5;echo $FEE;sleep 5;echo "$POOL_NAME";sleep 5;echo "$POOL_WEBSITE";sleep 5;echo y;sleep 5;echo "$POOL_SERVERS";) | npm run commands
else
(sleep 15;echo $TYPE;sleep 5;echo $FEE;) | npm run commands
fi