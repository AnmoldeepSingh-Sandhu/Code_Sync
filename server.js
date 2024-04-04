const express = require('express');
const app = express();
const http = require('http');
const {Server} = require('socket.io');
const ACTIONS = require('./src/actions');

const server = http.createServer(app);
const io = new Server(server);


const UserSocketMap = {};

// Define a chat history object to store messages for each room
const chatHistory = {};

function getAllConnectedClients(roomId){
    const uniqueClients = Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            userName: UserSocketMap[socketId],
        }
   });

   console.log("rooms = ", io.sockets.adapter.rooms);
   console.log("clients = ", uniqueClients);

    return uniqueClients;
}

io.on('connection', (socket) => {

    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({roomId, userName}) => {
        console.log('JOIN triggered', userName);

        UserSocketMap[socket.id] = userName;
        socket.join(roomId);

        const clients = getAllConnectedClients(roomId);

        clients.forEach(({socketId}) => {
            
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                user: userName,
                socketId: socket.id,
                history: chatHistory[roomId],
            });
        });
    });


    //Sending code changes to all users
    socket.on(ACTIONS.CODE_CHANGE,({roomId,code})=> {
        // socket.in will broadcast the information to everyone except sender
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, {code});
    });

    socket.on(ACTIONS.SYNC_CODE,({code, socketId})=> {
        // Over here we are using io to send information to specific user with that socketId
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, {code});
    });


    //Sending code changes to all users, including the sender
    socket.on(ACTIONS.FILE_UPLOAD, ({ roomId, code }) => {
        // Use socket.emit to send the code change event to the sender
        socket.emit(ACTIONS.FILE_UPLOAD, { code });

        // Use io.in(roomId).emit to broadcast the code change event to all users in the room, except the sender
        socket.in(roomId).emit(ACTIONS.FILE_UPLOAD, { code });
    });


    //Chat
    socket.on(ACTIONS.SEND_MESSAGE, ({roomId, message, user}) => {
        console.log("Sent server Message = ", message, user);

        // Update the chat history
        if (!chatHistory[roomId]) {
            chatHistory[roomId] = [];
        }

        chatHistory[roomId].push({message, user});


        io.to(roomId).emit(ACTIONS.RECEIVE_MESSAGE, {message, user});
    });


    //Listening for disconnected user. You don't need to call this for client side.
    //Server automatically listens for it.
    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];

        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                user: UserSocketMap[socket.id],
            });
        });

        delete UserSocketMap[socket.id];
        socket.leave();
    });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`listening on port ${PORT}`));