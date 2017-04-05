'use strict';
const express = require('express');
const bodyParser = require('body-parser');

const MongoClient = require('mongodb').MongoClient;
// define db in global scope.
let db;

const app = express();


/* Initialises express to use static middleware in the site */
app.use(express.static('static'));

/* enable body parsing */
app.use(bodyParser.json());

/* enable strong etags */
app.enable('etag');

const validIssueStatus = {
    New: true,
    Open: true,
    Assigned: true,
    Fixed: true,
    Verified: true,
    Closed: true
};

const issueFieldType = {
    status: 'required',
    owner: 'required',
    effort: 'optional',
    created: 'required',
    completionDate: 'optional',
    title: 'required'
};

function validateIssue(issue) {
    for(const field in issueFieldType) {
        const type = issueFieldType[field];
        if(!type) {
            delete issue[field];
        } else if (type === "required" && !issue[field]) {
            return `${field} is required.`;
        }
    }

    if(!validIssueStatus[issue.status])
        return `${issue.status} is not a valid status.`;

    return null;
}

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

    const err = validateIssue(newIssue);
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
MongoClient.connect('mongodb://localhost/issuetracker').then(connection => {
    db = connection;
    app.listen(3000, function() {
        console.log('App started on port 3000');
    }); 
}).catch(error => {
    console.log('ERROR: ', error);
});
