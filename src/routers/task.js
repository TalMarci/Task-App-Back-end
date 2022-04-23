const express = require('express')
const Person = require('../models/person')
const Task = require('../models/task')
const router = new express.Router()
jsonParser = bodyParser.json()
stringParser = bodyParser.text({type:'*/*'})


// get task by a specipied id
router.get('/api/tasks/:id',jsonParser, async (req, res)=> {
    const _id = req.params.id
    try{
        // validate correct ID length:
        if(_id.length !==24)
            return res.status(400).send('Task ID must be 24 characters long.')
        const task = await Task.findById(_id) //check if task exist
        if(!task){ // no such task found
            return res.status(404).send("A task with the id '"+_id+"' does not exist.")
        }
        task.__v = undefined
        res.status(200).send(task)
    }catch(e){ 
        res.status(500).send(e.message) // server error

    }
})

//update fields of task by id
router.patch('/api/tasks/:id',jsonParser,async (req, res)=>{
    try{
        const _id = req.params.id
        const updates=Object.keys(req.body)
        const allowedUpdates = ['title', 'details', 'dueDate','status'] // fields that we allow to update
        // validate that client updates valid fields
        const isValidOperation = updates.every(updates => allowedUpdates.includes(updates))
        if(_id.length !==24)
            return res.status(400).send('Task ID must be 24 characters long.')
        if(!isValidOperation)
            return res.status(400).send("Required data fields are missing, data makes no sense, or data contains illegal values.")

        const orgTask = await Task.findById(_id)
        if(!orgTask) // no such task found
            return res.status(404).send("A task with the id '"+_id+"' does not exist.")

        if(orgTask.status === 'done' && req.body.status === 'active'){
            await Person.findByIdAndUpdate(orgTask.ownerId, {$inc: {activeTaskCount: 1}} , {new: true, runValidators: true})
        }
        if(orgTask.status === 'active' && req.body.status === 'done'){
            await Person.findByIdAndUpdate(orgTask.ownerId, {$inc: {activeTaskCount: -1}} , {new: true, runValidators: true})
    }
        const task = await Task.findByIdAndUpdate(_id, req.body, {new:true,runValidators : true})
        
        task.__v= undefined // remove defaultive field
        res.status(200).send(task)  
    } catch(e){
        res.status(400).send(e.message) // server error
    }
})

// delete task by id
router.delete('/api/tasks/:id',jsonParser, async(req, res)=>{
    try{
        _id=req.params.id
        // validate correct ID length
        if(_id.length !==24)
            return res.status(400).send('User ID must be 24 characters long.')
        const task = await Task.findByIdAndDelete(_id)
        if(!task) // no such task found
            return res.status(404).send("Requested task is not present.")
        task.__v=undefined
        // change owner's task count id needed to
        if(task.status.localeCompare("active")===0)
        await Person.findByIdAndUpdate(task.ownerId, {$inc: {activeTaskCount: -1}} , {new: true, runValidators: true})
        res.status(204).send("Task removed successfully.")
    }catch(e){
        res.status(500).send(e.message) // server error
    }
})

//get status of task by id
router.get('/api/tasks/:id/status',jsonParser, async (req, res)=> {
    const _id = req.params.id
    try{
        // validate correct ID length:
        if(_id.length !==24){
            return res.status(400).send('Task ID must be 24 characters long.')
        }
        const task = await Task.findById(_id)
        if(!task){ // no such task found
            return res.status(404).send("A task with the id '"+_id+"' does not exist.")
        }
        res.send(task.status)
    }catch(e){
        res.status(500).send(e.message) // server error
    }
})

// change status of task by id
router.put('/api/tasks/:id/status',stringParser, async (req, res)=> {
    const _id = req.params.id
    const _stat = req.body
    const _status=_stat.replaceAll('"','')
    try{
        // validate correct ID length:
        if(_id.length !==24){
            return res.status(400).send('Task ID must be 24 characters long.')
        }
        const task = await Task.findById(_id)
        if(!task){ // no such task found
            return res.status(404).send("A task with the id '"+_id+"' does not exist.")
        }
        if(_status.localeCompare("active")!==0 && _status.localeCompare("done")!==0){
            return res.status(400).send("value '"+_status+"' is not a legal task status.")
        }
        if(task.status.localeCompare(_status)!==0){ // user actually change status
            task.status=_status
            //change task count
            if(_status.localeCompare("done")===0) // change owner task count
                await Person.findByIdAndUpdate(task.ownerId, {$inc: {activeTaskCount: -1}} , {new: true, runValidators: true})
            else
                await Person.findByIdAndUpdate(task.ownerId, {$inc: {activeTaskCount: 1}} , {new: true, runValidators: true})
        }
        await task.save()
        res.status(200).send("Task's status updated successfully.")
    }catch(e){
        res.status(500).send(e.message) // server error
    }
})

// get owner'sID by task id.
router.get('/api/tasks/:id/owner',jsonParser, async (req, res)=> {
    const _id = req.params.id
    try{
        // validate correct ID length:
        if(_id.length !==24){
            return res.status(400).send('Task ID must be 24 characters long.')
        }
        const task = await Task.findById(_id)
        if(!task){ // no such task found
            return res.status(404).send("A task with the id '"+_id+"' does not exist.")
        }
        res.send(task.ownerId)
    }catch(e){ // server error
        res.status(500).send(e.message)
    }
})

// change Owner's id by task id
router.put('/api/tasks/:id/owner',stringParser, async (req, res)=> {
    const _id = req.params.id
    const id = req.body
    const newId=id.replaceAll('"','')
    try{
        // validate Task ID length:
        if(_id.length !==24){
            return res.status(400).send('Task ID must be 24 characters long.')
        }
        const task = await Task.findById(_id)
        if(!task){ // no such task found
            return res.status(404).send("A task with the id '"+_id+"' does not exist.")
        }
        // validate new owner ID length:
        if(newId.length !==24){
            return res.status(400).send('Owner ID must be 24 characters long.')
        }
        const owner = await Person.findById(newId)
        if(!owner) // no such owner
            return res.status(404).send("A person with the id '"+_id+"' does not exist.")
        // change task count if task has an "active" status
        if(task.status.localeCompare("active")===0){
            owner.activeTaskCount+=1
            await owner.save()
            await Person.findByIdAndUpdate(task.ownerId, {$inc: {activeTaskCount: -1}} , {new: true, runValidators: true})
        }
        task.ownerId=newId
        await task.save()
        res.status(204).send("Task Owner updated successfully.")
    }catch(e){
        res.status(500).send(e.message) // server error
    }
})



module.exports = router