'use strict';

var _sourceMapSupport = require('source-map-support');

var _sourceMapSupport2 = _interopRequireDefault(_sourceMapSupport);

require('babel-polyfill');

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _mongodb = require('mongodb');

var _issue = require('./issue.js');

var _issue2 = _interopRequireDefault(_issue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_sourceMapSupport2.default.install(); /* ES2015 style import statements */


/* start express */
var app = (0, _express2.default)();
/* Initialises express to use static middleware in the site */
app.use(_express2.default.static('static'));
/* enable body parsing */
app.use(_bodyParser2.default.json());

// define db in global scope.
var db = void 0;

/* enable strong etags */
app.enable('etag');

/* Enables hot module reloading via middleware */
if (process.env.NODE_ENV !== 'production') {
    var webpack = require('webpack');
    var webpackDevMiddleware = require('webpack-dev-middleware');
    var webpackHotMiddleware = require('webpack-hot-middleware');

    var config = require('../webpack.config');
    config.entry.app.push('webpack-hot-middleware/client', 'webpack/hot/only-dev-server');
    config.plugins.push(new webpack.HotModuleReplacementPlugin());

    var bundler = webpack(config);
    app.use(webpackDevMiddleware(bundler, { noInfo: true }));
    app.use(webpackHotMiddleware(bundler, { log: console.log }));
}

app.get('/api/issues', function (req, res) {
    console.log(req.method + ": " + req.url + ", " + req.headers["user-agent"]);

    db.collection('issues').find().toArray().then(function (issues) {
        console.log(issues.length + " issues retrieved.");
        var metadata = { total_count: issues.length };
        res.json({ _metadata: metadata, records: issues });
    }).catch(function (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error: ${error}" });
    });
});

app.post('/api/issues', function (req, res) {
    console.log(req.method + ": " + req.url + ", " + req.headers["user-agent"]);

    var newIssue = req.body;
    newIssue.created = new Date();
    if (!newIssue.status) {
        newIssue.status = 'New';
    }

    var err = _issue2.default.validateIssue(newIssue);
    if (err) {
        console.log(err);
        res.status(422).json({ message: "Invalid request: ${err}" });
        return;
    }

    db.collection('issues').insertOne(newIssue).then(function (result) {
        return db.collection('issues').find({ _id: result.insertedId }).limit(1).next();
    }).then(function (newIssue) {
        console.log("Posted new issue: " + newIssue.title);
        res.json(newIssue);
    }).catch(function (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error: $(error)" });
    });
});

// Connect to database and start server
_mongodb.MongoClient.connect('mongodb://localhost/issuetracker').then(function (connection) {
    db = connection;
    app.listen(3000, function () {
        console.log('App started on port 3000');
    });
}).catch(function (error) {
    console.log('ERROR: ', error);
});
//# sourceMappingURL=server.js.map