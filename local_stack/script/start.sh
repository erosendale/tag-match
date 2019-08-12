# Start up all the containers, make builds where necessary
docker-compose up -d

cat neo4j/schema.cql | docker exec -i local_stack_neo4j_1 cypher-shell -u neo4j -p test
