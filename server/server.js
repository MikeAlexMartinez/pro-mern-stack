'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

const Issue = require('./issue.js');

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
    console.log(req.method + ": " + req.url + ", " + req.headers["user-agent"]);
    
    db.collection('issues').find().toArray().then(issues => {
        console.log(issues.length + " issues retrieved.")
        const metadata = {total_count: issues.length};
        res.json({ _metadata: metadata, records: issues});
    }).catch(error => {
        console.log(error);
        res.status(500).json({ message: `Internal Server Error: ${error}`});
    });
});

app.post('/api/issues', (req, res) => {
    console.log(req.method + ": " + req.url + ", " + req.headers["user-agent"]);

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
    
    db.collection('issues').insertOne(newIssue).then(result => 
        db.collection('issues').find({ _id: result.insertedId }).limit(1).next()
    ).then(newIssue => {
        console.log("Posted new issue: " + newIssue.title);
        res.json(newIssue);
    }).catch(error => {
        console.log(error);
        res.status(500).json({ message: `Internal Server Error: $(error)` });
    });
});

// Connect to database and start server
MongoClient.connect('mongodb://localhost:27017/issuetracker').then(connection => {
    db = connection;
    app.listen(3000, function() {
        console.log('App started on port 3000');
    }); 
}).catch(error => {
    console.log('ERROR: ', error);
});
