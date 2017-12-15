import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import methodOverride from 'method-override'
import path from 'path'
import multer from 'multer'
import _ from 'lodash'
import expressSession from 'express-session'
import redis from './initializers/redis'
Promise = require('bluebird')

require('rootpath')()

var debug = require('debug')('assistance-service:index')
const app = express()
const server = require('http').Server(app)
// const io = require('socket.io')(server)
const port = process.env.PORT
var RedisStore = require('connect-redis')(expressSession)

var cookieConfig = {
  domain: '.' + process.env.APP_DOMAIN,
  httpOnly: true,
  path: '/',
  secure: false,
  maxAge: 31 * 24 * 60 * 60 * 1000
};

// Allow Cors Header
function allowCrossTokenHeader (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization')
  next()
}

debug('PATH >><', path.join(__dirname, '../uploads'))

app.set('view engine', 'jade')
app.set('views', path.join(__dirname, '../views'))

// Config Server
app.use(express.static(path.join(__dirname, '../public')))
app.use(express.static(path.join(__dirname, '../uploads')))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(methodOverride('_method'))
app.use(allowCrossTokenHeader)
app.use(multer({dest: path.join(__dirname, '../uploads/face')}))

app.use(expressSession({
  secret: 'server-secret',
  resave: false,
  saveUninitialized: true,
  name: 'server-name',
  cookie: cookieConfig,
  store: new RedisStore({
    client: redis
  })
}));

require('./initializers/routes')(app)

// Server Listen
server.listen(port, (err) => {
  if (err) return debug(`Error: Server not started - ${err}`)
  debug(`Server listing on port ${port}`)
})
