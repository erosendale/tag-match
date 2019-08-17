const Neo4jConn = require('../helpers/Neo4j');

function addLike(req,res) {

    const userId = req.headers.userid;
    const recipId = req.swagger.params.recipid.value.recipid;

    // Start a session with neo4j
    const session = Neo4jConn.driver.session();
    session
    .run(`
    MATCH (p:Profile {userId: {userId}})
    MATCH (f:Profile {userId: {recipId}})
    MERGE (p)-[:LIKES]->(f)`, {
        userId: userId,
        recipId: recipId
    })
    .subscribe({
        onCompleted: function() {
            session.close();
            Neo4jConn.driver.close();
            res.json('success');
        },
        onError: function(error) {
            console.log(error);
            res.status(500).json({message: JSON.stringify(error)});
        }
    });
}

// unmatch
function deleteLike(req,res) {

    const userId = req.headers.userid;
    const recipId = req.swagger.params.recipid.value;

    // Start a session with neo4j
    const session = Neo4jConn.driver.session();
    session
    .run(`
    MATCH (p:Profile {userId: {userId}})
    MATCH (f:Profile {userId: {recipId}})
    MATCH (p)-[r:LIKES]->(f)
    DELETE r
    WITH p,f
    MATCH (f)-[r2:LIKES]->(p)
    DELETE r2`, { // Delete the likes both ways so the people need to find eachother again
        userId: userId,
        recipId: recipId
    })
    .subscribe({
        onCompleted: function() {
            session.close();
            Neo4jConn.driver.close();
            res.json('success');
        },
        onError: function(error) {
            console.log(error);
            res.status(500).json({message: JSON.stringify(error)});
        }
    });
}

module.exports = {
    addLike,
    deleteLike
}