const path = require ('path')
const http = require ('http')
const express = require ('express')
const socketio = require ('socket.io')
const Filter = require ('bad-words')
const {generateMessage, generateLocationMessage} = require ('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server  = http.createServer (app)
const io = socketio(server)

const port = process.env.PORT || 3000

const publicDirectoryPath = path.join(__dirname, '../public')

app.use (express.static(publicDirectoryPath))

const AdminName = 'Gumpu Nirvahaka'

io.on ('connection', (socket)=>{
    console.log ('New connection!')

    socket.on('join', ({username, room}, callback)=>{
        const { error, user } = addUser({id: socket.id, username, room})
        if (error) {
            return callback(error)
        }
        console.log (' User: ', user.username, ' is connected to room:', user.room)
        socket.join(user.room)
        socket.emit ('message', generateMessage (AdminName, 'Welcome !'))
        socket.broadcast.to(user.room).emit ('message', generateMessage(AdminName, `${user.username} has joined`))
        io.to(user.room).emit ('roomData', {
            room: user.room,
            users: getUsersInRoom (user.room)
        })
        callback()
    })
    socket.on ('sendmsg', (msg, callback)=>{
        const user = getUser (socket.id) 
        const filter = new Filter()

        if (filter.isProfane(msg)) {
            return callback ('Faul language not allowed')
        }
        io.to(user.room).emit ('message', generateMessage(user.username, msg))
       
        callback()
    })
    socket.on ('sendLocation', (loc, callback)=> {
        const user = getUser (socket.id)
        //const msg = "location lat: " + loc.latitude + " long:" + loc.longitude
        //const msg = `Location: ${loc.latitude}, ${loc.longitude}`
        io.to(user.room).emit ('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${loc.latitude},${loc.longitude}`))
        callback ()
    })      
    socket.on ('disconnect', ()=>{
        const user = removeUser(socket.id)
        if (user) {
            console.log (' User: ', user.username, ' is disconnected from room:', user.room)
            io.to(user.room).emit ('message', generateMessage(AdminName, `${user.username} has left`))
            io.to(user.room).emit ('roomData', {
                room: user.room,
                users: getUsersInRoom (user.room)
            })
        }
    })
})

server.listen(port, ()=> {
    console.log ('server is up on port: ' + port)
})