#!/bin/sh

# Infinite update loop, sleep 600 seconds
while [[ true ]]; do
	# Update remote
	git remote update

	#Start checking
	UPSTREAM=${1:-'@{u}'}
	LOCAL=$(git rev-parse @)
	REMOTE=$(git rev-parse "$UPSTREAM")
	BASE=$(git merge-base @ "$UPSTREAM")

	if [ $LOCAL = $REMOTE ]; then
		echo "No need to update, checking again in 600 seconds"
	elif [ $LOCAL = $BASE ]; then
		echo "Update found! stopping node"
		pm2 stop npm
		echo "Getting the update"
		git pull
		echo "Restarting node"
		pm2 start npm
	fi
	sleep 30
done