import 'babel-polyfill';

import SourceMapSupport from 'source-map-support';

import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient, ObjectId } from 'mongodb';
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
  if (req.query.effort_lte || req.query.effort_gte) filter.effort = {};
  if (req.query.effort_lte) filter.effort.$lte = parseInt(req.query.effort_lte, 10);
  if (req.query.effort_gte) filter.effort.$gte = parseInt(req.query.effort_gte, 10);
  console.log(filter);
  if (req.query.search) filter.$text = { $search : req.query.search };

  if (req.query._summary === undefined) {
    const offset = req.query._offset ? parseInt(req.query._offset, 10) : 0;
    let limit = req.query.limit ? parseInt(req.query._limit, 10) : 20;
    if (limit > 50) limit = 50;
    
    const cursor = db.collection('issues')
                     .find(filter)
                     .sort({ _id: 1 })
                     .skip(offset)
                     .limit(limit);
    
    let totalCount;
    cursor.count(false).then(result => {
      totalCount = result;
      return cursor.toArray();
    })
    .then((issues) => {
        console.log(issues.length + ' issues retrieved.')
        res.json({ metadata: {totalCount}, records: issues });
    }).catch((error) => {
      console.log(error);
      res.status(500).json({ message: `Internal Server Error: ${error}`});
    });
  } else {
    db.collection('issues')
      .aggregate([
        { $match: filter },
        { $group: { _id: { owner: '$owner', status: '$status' }, count: { $sum: 1 }}}
      ])
      .toArray()
      .then(results => {
        const stats = {};
        results.forEach(result => {
          if (!stats[result._id.owner]) stats[result._id.owner] = {};
          stats[result._id.owner][result._id.status] = result.count;
        });
        res.json(stats);
      })
      .catch(error => {
        console.log(error);
        res.status(500).json({ message: `Internal Server Error: ${error}` });
      });
  }
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

app.get('/api/issues/:id', (req, res) => {
  let issueId;
  try {
    console.log("try: ", req.params.id);
    issueId = new ObjectId(req.params.id);
    console.log(issueId);
  } catch (error) {
    console.log(req.params.id);
    console.log(issueId);
    res.status(422).json({ message: `Invalid issue ID format: ${error}` });
    return;
  }

  db.collection('issues').find({ _id: issueId }).limit(1)
    .next()
    .then(issue => {
      if(!issue) res.status(404).json({ message: `No such issue: ${issueId}` });
      else res.json(issue);
    })
    .catch(error => {
      console.log(error);
      res.status(500).json({ message: `Internal Server Error: ${error}` });
    });
});

app.put('/api/issues/:id', (req, res) => {
  let issueId;
  try {
    issueId = new ObjectId(req.params.id);
  } catch(error) {
    res.status(422).json({message: `Invalid issue ID format: ${error}`});
    return;
  }

  const issue = req.body;
  delete issue._id;

  const err = Issue.validateIssue(issue);
  if (err) {
    res.status(422).json({ message: `Invalid request: ${err}` });
    return;
  }

  db.collection('issues').update({ _id: issueId }, Issue.convertIssue(issue))
    .then(() => db.collection('issues').find({ _id: issueId }).limit(1)
    .next()
  )
  .then(savedIssue => {
    res.json(savedIssue);
  }).catch( error => {
    console.log(error);
    res.status(500).json({ message: `Internal Server Error: ${error}` });
  });
});

app.delete('/api/issues/:id', (req, res) => {
  let issueId;
  try {
    issueId = new ObjectId(req.params.id);
  } catch (error) {
    res.status(422).json({ message: `Invalid issue ID format: ${error}` });
    return;
  }

  db.collection('issues').deleteOne({ _id: issueId }).then((deleteResult) => {
    if(deleteResult.result.n === 1 ) res.json({ status: 'OK' });
    else res.json({ status: 'Warning: object not found'});
  })
  .catch(error => {
    console.log(error);
    res.status(500).json({ message: `Internal Server Error: ${error}` });
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
