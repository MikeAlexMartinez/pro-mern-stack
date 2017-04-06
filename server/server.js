/* ES2015 style import statements */
import SourceMapSupport from 'source-map-support';
SourceMapSupport.install();
import 'babel-polyfill';

import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';

import Issue from './issue.js';

/* start express */
const app = express();
/* Initialises express to use static middleware in the site */
app.use(express.static('static'));
/* enable body parsing */
app.use(bodyParser.json());

// define db in global scope.
let db;

/* enable strong etags */
app.enable('etag');

/* Enables hot module reloading via middleware */
if(process.env.NODE_ENV !== 'production') {
    const webpack = require('webpack');
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const webpackHotMiddleware = require('webpack-hot-middleware');

    const config = require('../webpack.config');
    config.entry.app.push('webpack-hot-middleware/client', 'webpack/hot/only-dev-server');
    config.plugins.push(new webpack.HotModuleReplacementPlugin());

    const bundler = webpack(config);
    app.use(webpackDevMiddleware(bundler, {noInfo: true}));
    app.use(webpackHotMiddleware(bundler, {log: console.log}));
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
MongoClient.connect('mongodb://localhost/issuetracker').then(connection => {
    db = connection;
    app.listen(3000, function() {
        console.log('App started on port 3000');
    }); 
}).catch(error => {
    console.log('ERROR: ', error);
});
