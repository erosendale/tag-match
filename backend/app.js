const express = require('express'),
    router = express.Router(),
    bodyParser = require('body-parser');
const app = express();

// My custom middleware
app.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now());
    next(); // pass control to the next handler
});

router.route('/profile/:userId')
    .get(function (req, res) {
        res.send(`get profile! ${req.params.userId}`);
    })
    .post(function (req, res) {
        res.send(`post profile! ${req.params.userId}`);
    });

router.route('/find')
    .get(function (req, res) {
        res.send(`finding matches!`);
    });

router.route('/like/:userId')
    .post(function (req, res) {
        res.send(`liked user! ${req.params.userId}`);
    })
    .delete(function (res, req) {
        res.send(`deleted like for user! ${req.params.userId}`);
    });

app.use('/api/v1', router);
   
app.listen(3000, () => console.log(`Listening on port 3000`));

module.exports = app; // for testing