# Start up all the containers, make builds where necessary
docker-compose up -d

# Wait until a cypher-shell command returns no error on it's stderr, so we know the db is ready
echo "Waiting for neo4j..."
while [ -n "$(docker exec -i tag-match-neo cypher-shell -u neo4j -p test 'MATCH (n) RETURN n' 2>&1 > /dev/null)" ]; do
    printf "."
    sleep 0.1
done

cat neo4j/schema.cql | docker exec -i tag-match-neo cypher-shell -u neo4j -p test
echo "\nNeo4j indexes created"

# Not necessary for tests since supertest can startup and stop the app
#pm2 start ../backend/app.js --watch
