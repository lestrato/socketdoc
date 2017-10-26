
const express = require('../node_modules/express');
const app = express();
var http = require('http').Server(app);
var io = require('../node_modules/socket.io')(http);

fs = require('fs')

var editor_val = '';
var users = {};

app.use(express.static('../node_modules'))

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

  // on join
  fs.readFile(__dirname + '/names.txt', 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    names_list = data.split(/\r?\n/);
    name = names_list[Math.floor((Math.random() * names_list.length - 1) + 0)];

    fs.readFile(__dirname + '/color_codes.txt', 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
      codes_list = data.split(/\r?\n/);
      color = codes_list[Math.floor((Math.random() * codes_list.length - 1) + 0)];

      users[socket.id] = {
        'id' : socket.id,
        'name' : name,
        'color' : color,
      }
      socket.emit('name', users[socket.id]);
      io.emit('announce action', users[socket.id], 'joined!');
      socket.emit('set text', editor_val);

      for (i in users) {
        if (users[i].cursor_coords) socket.emit('update cursor', users[i]);
      }
    });

    socket.on('disconnect', function() {
      io.emit('delete cursor', socket.id);
      console.log(socket.id);
      delete users[socket.id];
    });
  });


  socket.on('new actions', function(user, changeObjs){
    insertions = 0;
    deletions = 0;
    for (c in changeObjs) {
      changeObj = changeObjs[c];
      console.log(changeObj)
      switch(changeObj.origin) {
          case "+input":
              insertions += 1;
              deletions += changeObj.removed.length ? changeObj.removed.length != 1 || changeObj.removed[0] != '' : 0;
              break;
          case "+delete":
              deletions += changeObj.removed[0].length;
              break;
          // convert cut to deletions
          case "cut":
              deletions += changeObj.removed[0].length;
              break;
          // convert paste to insertions and deletions
          case "paste":
              insertions += changeObj.text.length
              deletions += changeObj.removed[0].length
              break;
          default:
              break;
      };
    }
    io.emit('announce action', user, 'had ' + insertions + ' insertions and ' + deletions + ' deletions.');
  });


  socket.on('update text', function(new_editor_val){
    socket.broadcast.emit('set text', new_editor_val);
  });

  socket.on('update cursor', function(cursor_coords){
    users[socket.id]['cursor_coords'] = cursor_coords;
    socket.broadcast.emit('update cursor', users[socket.id]);
  });

  // console.log('a user connected');
  // io.emit('new connection', 'A new user has connected!');

  // socket.on('disconnect', function(){
  //   console.log('user disconnected');
  // });

  // socket.on('chat message', function(msg, name){
  //   message = name + ' says: ' + msg;
  //   console.log(message)
  //   io.emit('chat message', message);
  // });

  // socket.on('currently typing', function(name){
  // 	if (name != '') console.log(name + ' is currently typing...');
  //   io.emit('currently typing', name);
  // });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
    