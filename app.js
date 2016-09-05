var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io')(server),
	users = [];

server.listen(8888);
app.use(express.static(__dirname));

app.get('/', function(req, res) {
	app.sendFile('index.html');
});

app.get('/login', function(req, res) {
	var username = req.query.username,
		fail = false;

	if (users.indexOf(username) !== -1) {
		res.send('fail');
		return;
	}

	users.push(username);
	res.send('success');
});

io.on('connection', function(socket) {
	socket.on('add_user', function(username) {
		socket.username = username;
		
		socket.emit('login', {users: users});
		socket.broadcast.emit('user_joined', {username: username});
	});

	socket.on('new_message', function(data) {
		socket.broadcast.emit('new_message', {
			time: data.time,
			username: socket.username,
			message: data.message
		});
	});

	socket.on('disconnect', function() {
		users.splice(users.indexOf(socket.username), 1);
		socket.broadcast.emit('user_left', {username: socket.username});
	});
});
