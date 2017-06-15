/* eslint-disable */
var db = new Mongo().getDB('issuetracker');

// delete all issues first
db.issues.deleteMany({});

var owners = ['Ravan', 'Eddie', 'Mike', 'Michael', 'Bella', 'Pieta', 'Victor'];
var statuses = ['Fixed', 'New', 'Open', 'Assigned', 'Verified', 'Closed'];

var i;
for(i=0; i<1000; i++) {
    var randomCreatedDate = new Date(
        // within the last 60 days
        (new Date()) - Math.floor(Math.random() * 60) * 1000*60*60*24
    );
    var randomCompletionDate = new Date(
        // within the last 60 days
        (new Date()) - Math.floor(Math.random() * 60) * 1000*60*60*24
    );
    var randomOwner = owners[Math.floor(Math.random() * owners.length)];
    var randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    var randomEffort = Math.ceil(Math.random() * 20);
    var issue = {
        created: randomCreatedDate,
        completionDate: randomCompletionDate,
        owner: randomOwner,
        status: randomStatus,
        effort: randomEffort,
    };
    issue.title = 'this is issue ' + i;
    db.issues.insert(issue); 
}