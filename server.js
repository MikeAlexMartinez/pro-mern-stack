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

const issues = [
    {
        id: 1, status: 'Open', owner: 'Ravan',
        created: new Date('2016-08-15'), effort: 5, completionDate: undefined,
        title: 'Error in console when clicking Add'
    },
    {
        id: 2, status: 'Assigned', owner: 'Eddie',
        created: new Date('2016-08-16'), effort: 14, completionDate: new Date('2016-08-30'),
        title: 'Missing bottom border on panel'
    }
];

const validIssueStatus = {
    New: true,
    Open: true,
    Assigned: true,
    Fixed: true,
    Verified: true,
    Closed: true
};

const issueFieldType = {
    id: 'required',
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
        const metadata = {total_count: issues.length};
        res.json({ _metadata: metadata, records: issues});
    }).catch(error => {
        console.log(error);
        res.status(500).json({ message: `Internal Server Error: ${error}`});
    });
});

app.post('/api/issues', (req, res) => {
    console.log(req.method + ": " + req.url + ", " + req.headers["user-agent"]);

    console.log(issues);
    const newIssue = req.body;
    newIssue.id = issues.length + 1;
    newIssue.created = new Date();
    if(!newIssue.status) {
        newIssue.status = 'New';
    }

    const err = validateIssue(newIssue)
    if(err) {
        console.log(err);
        res.status(422).json({ message: `Invalid request: ${err}` });
        return;
    }
    
    issues.push(newIssue);
    res.json(newIssue);
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
