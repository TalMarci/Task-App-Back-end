const mongoose = require('mongoose')
const validator = require('validator')


// // new person:
const Person = mongoose.model('Person', {
    name: {
        type: String,
        // can add trim that we dont have spaces on the name
        trim: true,
        default: ""
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        // using the validator npm package with Email, can check other methods
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid!')
            }
        }
    },
    activeTaskCount: {
        type: Number,
        default: 0
    },
    favoriteProgrammingLanguage: {
        type: String,
        trim: true,
        default: ""
    }
})

module.exports = Person
 