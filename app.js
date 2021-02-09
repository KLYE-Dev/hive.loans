var express = require("express"),
  app = express(),
  server = require("http").createServer(app),
  io = require("socket.io")(server),
  session = require("express-session"),
  bodyParser = require('body-parser'),
  cp = require("child_process"),
  fs = require("fs");
var log = require('fancy-log');
const dotenv = require('dotenv');
const debug = require('debug');
dotenv.config();
var clientIp;
const sessiondata = {
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false, // don't create session until something stored,
  resave: false, // don't save session if unmodified
  cookie:{maxAge:6000}
}

//EXPERIMENTAL DB CREATION / MIGRATION
async function migrateDB() {
    log('Initializing ...');
    // execute pending migrations
    log('Migrating DB...');
    await require('./dbtender.js').start();
    log('DB Migration complete.');
  }

migrateDB();

var sessionMiddleware = session(sessiondata);

app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

io.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});





//  clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
//  res.header('Access-Control-Allow-Origin', '*');

function httpRedirect(req,res, next){
  clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (req.headers['x-forwarded-proto'] === 'http') {
    res.redirect('http://127.0.0.1:666');
  }else{
    next();
  }
}
//set routes to public static files
app.use("/", httpRedirect, express.static(__dirname + "/client"));

var numClients = 0;

//socket.io Routes
io.on("connection", function(socket) {
  log('New Client: ' + clientIp + ' - Clients Connected:', numClients);
  var file1 = require('./socket.js')(socket, io);

  //numClients = (numClients + 1);
  //io.emit('usersconnected', { numClients: numClients });


  socket.on('disconnect', function() {
      //numClients = (numClients - 1);
      //io.emit('usersconnected', { numClients: numClients });
      log('Disconnect Client: ' + clientIp + ' - Clients Connected:', numClients);
  });
});

server.listen(process.env.PORT);
log(`Hive.Loans v${process.env.VERSION} Started on Port: ${process.env.PORT}`);
