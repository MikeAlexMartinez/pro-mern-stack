import 'babel-polyfill';

import SourceMapSupport from 'source-map-support';

import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

import Issue from './issue.js';

SourceMapSupport.install();
const app = express();
/* Initialises express to use static middleware in the site */
app.use(express.static('static'));
/* enable body parsing */
app.use(bodyParser.json());

// define db in global scope.
let db;

/* enable strong etags */
app.enable('etag');

app.get('/api/issues', (req, res) => {
  console.log(req.method + ' (Updated): ' + req.url + ', ' + req.headers['user-agent']);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.efort_lte || req.query.effort_gte) filter.effort = {};
  if (req.query.effort_lte) filter.effort.$lte = parseInt(req.query.effort_lte, 10);
  if (req.query.effort_gte) filter.effort.$gte = parseInt(req.query.effort_gte, 10);

  db.collection('issues').find(filter).toArray().then((issues) => {
    console.log(issues.length + ' issues retrieved.')
    const metadata = {total_count: issues.length};
    res.json({ _metadata: metadata, records: issues});
  }).catch((error) => {
    console.log(error);
    res.status(500).json({ message: `Internal Server Error: ${error}`});
  });
});

app.post('/api/issues', (req, res) => {
  console.log(req.method + ': ' + req.url + ', ' + req.headers['user-agent']);

  const newIssue = req.body;
  newIssue.created = new Date();
  if(!newIssue.status) {
    newIssue.status = 'New';
  }

  const err = Issue.validateIssue(newIssue);
  if(err) {
    console.log(err);
    res.status(422).json({ message: `Invalid request: ${err}` });
    return;
  }

  db.collection('issues').insertOne(Issue.cleanupIssue(newIssue)).then(result => 
        db.collection('issues').find({ _id: result.insertedId }).limit(1).next()
    ).then((newIssue) => {
      console.log('Posted new issue: ' + newIssue.title);
      res.json(newIssue);
    }).catch((error) => {
      console.log(error);
      res.status(500).json({ message: 'Internal Server Error: $(error)' });
    });
});

app.get('*', (req, res) => {
  res.sendFile(path.resolve('static/index.html'));
});

console.log('About to attempt starting!');

// Connect to database and start server
MongoClient.connect('mongodb://localhost:27017/issuetracker').then((connection) => {
  db = connection;
  app.listen(3000, function() {
    console.log('Yay! App started on port 3000');
  }); 
}).catch((error) => {
  console.log('ERROR: ', error);
});
