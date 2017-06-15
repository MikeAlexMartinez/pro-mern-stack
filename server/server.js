import express from 'express';
import bodyParser from 'body-parser';
import { ObjectId } from 'mongodb';
//import path from 'path';
import renderedPageRouter from './renderedPageRouter.jsx';

import Issue from './issue.js';

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

/*
app.get('*', (req, res) => {
  res.sendFile(path.resolve('static/index.html'));
});*/

app.use('/', renderedPageRouter);

console.log('About to attempt starting!');

// Connect to database and start server
function setDb(newDb) {
  db = newDb;
}

export { app, setDb };
