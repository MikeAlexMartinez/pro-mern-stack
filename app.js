const express = require('express');

const app = express();

/* Initialises express to use static middleware in the site */
app.use(express.static('static'));

app.listen(3000, function() {
    console.log('App started on port 3000');
});
