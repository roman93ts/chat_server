const express = require('express'); // экспорт Express пакета
const socket = require('socket.io'); // экспорт socket пакета
const app = express(); // создание сервера

const port = 3001;
server = app.listen(port, () => {
	console.log('server is running on port: '+port);
})

const io = socket(server);

const database = {
	rooms:[
		{
			roomName: 'Global',
			messages: [],
			users: []
		},
		{
			roomName: 'Room_1',
			messages: [],
			users: []
		},
		{
			roomName: 'Room_2',
			messages: [],
			users: []
		}
	]
}

io.on('connection',socket => {
	socket.on('SEND_USER', function(data){
      database.rooms.forEach(room => {
        if (room.roomName === data.currentRoom) {
          room.users.push({username:data.username,userSocket: socket.id})
        } // socket.id нужен для обнаружения пользователя при дисконнекте
      });
      const arrRoomsName = database.rooms.map(room => room.roomName);
      if (data.userSocket === socket.id){
        io.emit('RECEIVE_USER', {
        initialRoom : database.rooms[0],
        arrRoomsName : arrRoomsName
        }); //отправляем все данные по первой (дефолтной) комнате + имена комнат
      }
  })

  socket.on('SEND_MESSAGE', function(data){
      data.hours<10 ? data.hours = "0"+data.hours : data.hours = ""+data.hours;
      data.minutes<10 ? data.minutes = "0"+data.minutes : data.minutes = ""+data.minutes;
      let roomID;
      database.rooms.forEach((room,id) => {
        if (room.roomName === data.currentRoom){
          roomID = id;
          room.messages.push({
            username: data.username,
            message: data.message,
            hours: data.hours,
            minutes: data.minutes
          })
        }
      }) // получили текст сообщения, имя автора, дату отправки => добавили в массив сообщений текущей комнаты
      // if (data.userSocket === socket.id){
      // let roomUsers = database.rooms[roomID].users.map(user=>s user.username);
      io.emit('RECEIVE_MESSAGE', {
        roomMsgs: database.rooms[roomID].messages,
        roomUsrs: database.rooms[roomID].users
      });
      // }
  })

  socket.on('GO_TO_ROOM', data => {
  	// let roomID;
    database.rooms.forEach((room,id) => {
      if (data.prevRoom === room.roomName && data.prevRoom!==data.nextRoom){
        room.users = room.users.filter(user => user.userSocket!==socket.id);
      }
      if (data.nextRoom === room.roomName && data.prevRoom!==data.nextRoom){
        // roomID = id;
        room.users.push({username:data.userName,userSocket: socket.id})
      }
    })
    io.emit('COME_TO_ROOM', database.rooms);
  })

	socket.on('disconnect', data => {
    database.rooms.forEach(room => {
      room.users = room.users.filter(user => user.userSocket!==socket.id)
    });
    const updData = [];
    database.rooms.forEach(room => {
      updData.push({
        roomName: room.roomName,
        users: room.users
      })
    })
    io.emit('DISCONNECT_USER',updData);
	});
  	// socket.broadcast.emit('message');//отправка сообщения всем, кроме текущего пользователя
})
// ---------------------------------------------
