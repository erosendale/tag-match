'use strict';

const Neo4jConn = require('../helpers/Neo4j');

const router = require('express').Router();

router.route('/:userId')
    .post(addLike)
    .delete(deleteLike);

module.exports = router;

function addLike(req,res,next) {
    const userId = req.user.id;
    const recipId = req.params.userId;

    // Start a session with neo4j
    const session = Neo4jConn.session();
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
            Neo4jConn.close();
            res.json('success');
        },
        onError: next
    });
}

// unmatch
function deleteLike(req,res,next) {
    const userId = req.user.id;
    const recipId = req.params.userId;

    // Start a session with neo4j
    const session = Neo4jConn.session();
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
            Neo4jConn.close();
            res.json('success');
        },
        onError: next
    });
}