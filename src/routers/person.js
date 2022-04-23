const express = require('express')
const Person = require('../models/person')
const Task = require('../models/task')
// express give us a simply way to create a new router.
const router = new express.Router()
jsonParser = bodyParser.json()

//create a person
router.post('/api/people',jsonParser, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'favoriteProgrammingLanguage'] // fields that we allow to update
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    // validate that user updates valid fields
    if(!isValidOperation){
        return res.status(400).send('Required data fields are missing, data makes no sense, or data contains illegal values.')
    }
    // check if email is already exists
    const people = await Person.find({email: req.body.email})
    if(!(people.length === 0)){
        return res.status(400).send("A person with email '"+ req.body.email +"' already exists.")
    }
    const person = new Person(req.body)
    // add new person
    try{
        await person.save()
        person.__v = undefined
        res.set({
            'Location': "/api/people/"+person._id,
            'x-Created-Id': person._id
          })
        res.status(201).send("Person created successfully\n")
        
    }catch (e) {
        res.status(400).send(e.message)
    }
})

//get all existing people
router.get('/api/people',jsonParser, async (req, res)=> {
    try{
        const people = await Person.find({}) //  retreive all people
        // remove the __v field
        for(const person of people){
            person.__v = undefined
        }
        res.status(200).send(people)
    }catch(e){
        res.status(500).send(e.message) // server error
    }
})

// get person by a specipied id
router.get('/api/people/:id',jsonParser, async (req, res)=> {
    const _id = req.params.id
    // validate correct ID length:
    if(_id.length !==24){
        return res.status(400).send('User ID must be 24 characters long.')
    }
    try{
        const person = await Person.findById(_id) //check if person exist
        if(!person){ //no such person found
            return res.status(404).send("A person with the id '"+_id+"' does not exist.")
        }
        person.__v = undefined //remove the person __v field
        res.status(200).send(person)
    }catch(e){
        res.status(500).send(e.message) // server error
    }
})

//update fields of person by id
router.patch('/api/people/:id',jsonParser, async (req, res) => {
    const _id = req.params.id
    // validate correct ID length:
    if(_id.length !==24){
        return res.status(400).send('User ID must be 24 characters long.')
    }

    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'favoriteProgrammingLanguage'] // fields that we allow to update
    // validate that client updates valid fields
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send("Required data fields are missing, data makes no sense, or data contains illegal values.")
    }

    try{
        const person = await Person.findByIdAndUpdate(_id, req.body, {new: true, runValidators: true})

        if(!person){
            return res.status(404).send("A person with the id '"+_id+"' does not exist.")
        }
        person.__v = undefined //remove the person __v field
        res.status(200).send(person)
                
    }catch (e) {
        res.status(400).send(e.message)
    }
})

// delete person by id
router.delete('/api/people/:id',jsonParser, async (req, res) => {
    const _id = req.params.id
    // validate correct ID length:
    if(_id.length !==24){
        return res.status(400).send('User ID must be 24 characters long.')
    }

    try{
        const person = await Person.findByIdAndDelete(_id)

        if(!person){
            return res.status(404).send("A person with the id "+_id+" does not exist.")
        }

        await Task.deleteMany({ownerId: _id}) //delete all the tasks that that person have

        res.status(204).send("Person removed successfully:\n")
                
    }catch (e) {
        res.status(500).send(e.message) // server error
    }
})

// get the tasks of a person by ID
router.get('/api/people/:id/tasks',jsonParser, async (req, res)=> {
    const status = req.query.status
    const _id = req.params.id
    // validate correct ID length:
    if(_id.length !==24){
        return res.status(400).send('User ID must be 24 characters long.')
    }
    try{
        const person = await Person.findById(_id)
        if(!person){ //person not exist
            return res.status(404).send("A person with the id "+_id+" does not exist.")
        }

        // check if client add 'TaskStatus' filter
        if( status !== undefined){
            if((status !== 'active') && (status !== 'done')){
                return res.status(404).send("Invalid inpud to status!")
            }
            const tasks = await Task.find({ownerId: _id, status: status})
            for(const task of tasks){
                task.__v = undefined //remove the person __v field
            }
            res.status(200).send(tasks)
        }
        // if not:
        else{
            const tasks = await Task.find({ownerId: _id})
            for(const task of tasks){
                task.__v = undefined //remove the person __v field
            }
            res.status(200).send(tasks)
        }
    }catch(e){
        res.status(500).send(e.message) // server error
    }
})

// add new task to a person by ID
router.post('/api/people/:id/tasks',jsonParser, async (req, res) => {
    const _id = req.params.id
    // validate correct ID length:
    if(_id.length !==24){
        return res.status(400).send('User ID must be 24 characters long.')
    }
    const updates = Object.keys(req.body)
    const allowedUpdates = ['title', 'details', 'dueDate','status'] // fields that we allow to update
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    // validate that user updates valid fields
    if(!isValidOperation){
        return res.status(400).send("Required data fields are missing, data makes no sense, or data contains illegal values.")
    }
    try{
        const person = await Person.findById(_id)
        if(!person){ //no person exist with this ID
            return res.status(404).send("A person with the id "+_id+" does not exist.")
        }
        req.body.ownerId = _id
        const task = new Task(req.body)
        await task.save()
        // update person 'activeTaskCount' field if needed
        if(task.status === 'active'){
            await Person.findByIdAndUpdate(_id, {$inc: {activeTaskCount: 1}} , {new: true, runValidators: true})
        }
        res.set({
            'Location': "/api/tasks/"+task._id,
            'x-Created-Id': task._id
          })
        res.status(201).send("Task created and assigned successfully")
                
    }catch (e) {
        res.status(400).send(e.message)
    }
})


module.exports = router