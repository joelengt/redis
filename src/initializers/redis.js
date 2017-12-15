var debug = require('debug')('assistance-service:initializers:redis')
var redis = require('redis')
var bluebird = require('bluebird')

bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

var client = redis.createClient()

client.on('error', function (error) {
    debug(error)
})

module.exports = client
