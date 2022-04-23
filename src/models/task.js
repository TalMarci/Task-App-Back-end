const mongoose = require('mongoose')
const validator = require('express-validator')


// new task:
const Task = mongoose.model('Task', {
    title: {
        type: String,
        required:true
    },
    details: {
        type: String,
        default: ""
    },
    ownerId: {
        type: String
    },
    status: {
        type: String,
        default: "active",
        validate(value){
            if(!value.localeCompare("active")==0 & !value.localeCompare("done")==0)
            throw new Error('status is invalid!')
        }
    },
    dueDate:{
        type: String,
        validate(value) {
            if (!value.match(/^\d{4}-\d{2}-\d{2}$/)) return false;

            const date = new Date(value);
            if (!date.getTime()) return false;
            return date.toISOString().slice(0, 10) === value;
        }
    }

})

module.exports = Task
