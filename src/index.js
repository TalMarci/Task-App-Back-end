const express = require('express')
bodyParser = require('body-parser')
require('./db/mongoose')


const personRouter = require('./routers/person')
const taskRouter = require('./routers/task')


const app = express()
const port = process.env.PORT || 3000 // set up port


// Add headers for swagger compability
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    
    // Request headers you wish to allow
    res.setHeader('Access-Control-Expose-Headers', 'location, x-created-id' );
    res.setHeader('Access-Control-Allow-Headers', '*');
    
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    // Pass to next layer of middleware
    next();
    });

// make the app use the API of person and tasks   
app.use(personRouter)
app.use(taskRouter)


// listen to mongoDB server and can receive http requests.
app.listen(port, () => {
    console.log('Server is up on port ' + port)
})