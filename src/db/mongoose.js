const mongoose = require('mongoose')

// connect the mongoose to the database
mongoose.connect('mongodb://127.0.0.1:27017/task-manager-mini-project', {
    useNewUrlParser: true,
    useCreateIndex: true
})
