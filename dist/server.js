'use strict';

require('babel-polyfill');

var _sourceMapSupport = require('source-map-support');

var _sourceMapSupport2 = _interopRequireDefault(_sourceMapSupport);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _mongodb = require('mongodb');

var _issue = require('./issue.js');

var _issue2 = _interopRequireDefault(_issue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_sourceMapSupport2.default.install();
const app = (0, _express2.default)();
/* Initialises express to use static middleware in the site */
app.use(_express2.default.static('static'));
/* enable body parsing */
app.use(_bodyParser2.default.json());

// define db in global scope.
let db;

/* enable strong etags */
app.enable('etag');

app.get('/api/issues', (req, res) => {
  console.log(req.method + ': ' + req.url + ', ' + req.headers['user-agent']);

  db.collection('issues').find().toArray().then(issues => {
    console.log(issues.length + ' issues retrieved.');
    const metadata = { total_count: issues.length };
    res.json({ _metadata: metadata, records: issues });
  }).catch(error => {
    console.log(error);
    res.status(500).json({ message: `Internal Server Error: ${error}` });
  });
});

app.post('/api/issues', (req, res) => {
  console.log(req.method + ': ' + req.url + ', ' + req.headers['user-agent']);

  const newIssue = req.body;
  newIssue.created = new Date();
  if (!newIssue.status) {
    newIssue.status = 'New';
  }

  const err = _issue2.default.validateIssue(newIssue);
  if (err) {
    console.log(err);
    res.status(422).json({ message: `Invalid request: ${err}` });
    return;
  }

  db.collection('issues').insertOne(_issue2.default.cleanupIssue(newIssue)).then(result => db.collection('issues').find({ _id: result.insertedId }).limit(1).next()).then(newIssue => {
    console.log('Posted new issue: ' + newIssue.title);
    res.json(newIssue);
  }).catch(error => {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error: $(error)' });
  });
});

console.log('About to attempt starting!');

// Connect to database and start server
_mongodb.MongoClient.connect('mongodb://localhost:27017/issuetracker').then(connection => {
  db = connection;
  app.listen(3000, function () {
    console.log('App started on port 3000');
  });
}).catch(error => {
  console.log('ERROR: ', error);
});
//# sourceMappingURL=server.js.map