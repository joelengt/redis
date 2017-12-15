import {usersService} from '/services'
import messages from '../messages'
import crypto from 'crypto'
import uuid from 'uuid'
import jwt from 'jsonwebtoken'
import redis from '../initializers/redis'
import _ from 'lodash'

import {
  noop,
  authtenticatePassword,
  encryptPassword,
  isValidEmail,
  getCart,
  cartExists
} from '/utils'

var debug = require('debug')('assistance-service:controllers:auth')

class AuthController {
  async login (req, res) {
    // Get body data
    let user = {
      email: req.body.email,
      password: req.body.password
    }

    // Validate email format
    if (!isValidEmail(user.email)) {
      let payload = {success: false}
      return res['400'](payload, 'El formato de email no es valido')
    }

    // Validate body data
    if (!user.email || !user.password) {
      let payload = {success: false}
      return res['400'](payload, messages.userCreateBadRequest)
    }

    try {
      // validate user in data base
      let userFound = await usersService.getByEmail(user.email)

      // find by email
      if (userFound.status !== 200) {
        let payload = {success: false}
        return res['400'](payload, 'El campo email no es valido')
      }

      // validate password
      let isAuthenticate = await authtenticatePassword(user.password, userFound.data.item.password_salt, userFound.data.item.secure_password)

      // Evaluate if auth
      if (!isAuthenticate) {
        let payload = {success: false}
        return res['400'](payload, 'El campo password no es valido')
      }

      let payload = {
        access_token: userFound.data.item.access_token,
        refresh_token: userFound.data.item.refresh_token,
        userAccess: userFound.data.item.user_type_id,
        name: userFound.data.item.name,
        photo: userFound.data.item.photo,
      }

      return res.ok(payload, 'Usuario Autentificado')
    } catch (err) {
      let payload = {success: false}
      return res['500'](payload, err)
    }
  }

  async signup (req, res) {
    try {
      let userService = await usersService.create(req.body)
      if (userService.status !== 201) {
        return res[`${userService.status}`]({success: false}, userService.message)
      }

      let payload = userService.data
      return res['201'](payload, userService.message)
    } catch (err) {
      return res['500']({success: false}, err)
    }
  }

   /* Test sample method */
  async test (req, res) {
    try {
      debug('this is a pretty test sample ==>', getCart(req))

      /* verify if the key exists */
      let isExists = await redis.existsAsync('cart:JU_hZMAQ4Mo9LwIn8isLM4a0BfArY2To:1060').then((data) => {
        debug('cart from Redis', data)
        return data !== 0
      })

      /* Checking the Existence of Keys */
      redis.exists('frameworks', function(err, reply) {
          if (reply === 1) {
              debug('exists');
          } else {
              debug('doesn\'t exist');
          }
      });


      /* Storing Strings */

      /* Create a simple string */
      redis.set("person", "joel2");
      redis.setex('username', 60, 20);

      /* get a string */
      redis.get("person", function(err, reply) {
          // reply is null when the key is missing 
          debug('result!!!!! get ', reply);
      });



      /* Storing hash*/

      /* Create a hash */
      // redis.hmset('frameworks', 'javascript', 'AngularJS', 'css', 'Bootstrap', 'node', 'Express'); // first element is the name list, and the next come the items
      redis.hmset('frameworks', {
          'javascript': 'AngularJS',
          'css': 'Bootstrap',
          'node': 'Express'
      });

      /* get a all values in a hash */
      redis.hgetall("frameworks", function(err, reply) {
          // reply is null when the key is missing 
          debug('result!!!!! hash ', reply);
      });


      /* Storing Lists */

      /* Creating a list */ // - rpush means , to push to right, instand you can use lpush to left 
      redis.rpush(['frameworks2', 'angularjs', 'backbone'], function(err, reply) { // first element is the name list, and the next come the items
          debug('result!!!!! list ', reply); //prints 2
      });

      /* read items */
      redis.lrange('frameworks2', 0, -1, function(err, reply) {
          debug('result!!!!! list ', reply); // ['angularjs', 'backbone']
      });



      /* Storing sets */
      
      /* create */
      redis.sadd(['tags', 'angularjs', 'backbonejs', 'emberjs'], function(err, reply) {
          debug('result!! set', reply); // 3
      });

      /* read */
      redis.smembers('tags', function(err, reply) {
          debug('result!! set', reply);
      });



      /* Deleting and Expiring Keys */
      redis.del('foo_rand000000000000', function(err, reply) {
          debug('deleting', reply);
      });

      /* set a expiring */
      redis.set('aa', 'val1');
      redis.expire('aa', 30); // will be expire in 30 seconds

      /* Incrementing and Decrementing */
      redis.set('lolis', 10, function() {
          redis.incr('lolis', function(err, reply) {
              debug(reply); // 11
          });
      });


      // get the cart item as a promise

      let cartList = await redis //cart: user.id or cart.id
        .zrevrangeAsync('cart:1765', 0, -1) // Search on a ZSET - a set sort with the list items - get the list items of the cart: cart:1765:100, cart:1765:1232, cart:1765:2323 --> then find out each like a hash with the item data
        .then(function (data) {
          if (data.length === 0) {
            return [];
          }

          debug('INSIDE', data) // ZSET list with the hash names items cart:1765:100

          var transaction = redis.multi();

          _.map(data, function (itemKey) {
            transaction.hgetall(itemKey);
          });

          return transaction.execAsync();
        })
        .then(function (data) {
          return cartResponse(data);
        });

      // redis.decr('lolis', function(err, reply) {
      //     debug(reply); // 11
      // });

      /* get a list */
      // redis.zrevrangebyscore("cart:nythvsazo6XAkmbed7W9-iIrLdKeOX1n", function(err, reply) {
      //     // reply is null when the key is missing 
      //     debug('result!!!!! zset ', reply);
      // });

      // let cartKey = 'person'

      /* get a content by a key */
      // let redisItem1 = await redis.getAsync(cartKey)
      // .then((res) => {
      //     debug('Element 1 ==> ', res); // result
      // })
      // .catch((err) => {
      //     debug('ERROR 1 ==> ', err); // result
      // })

      // let redisItem2 = await redis.multi().get(cartKey).execAsync()
      // .then((res) => {
      //     debug('Element 2 ==> ', res); // result
      // })
      // .catch((err) => {
      //     debug('ERROR 2 ==> ', err); // result
      // })

      

      // let currentCart = await redis.zrevrangeAsync(cartKey, 0, -1).then((data) => {
      //     debug('current data', data)
      //     if (data.length === 0) {
      //       return [];
      //     }

      //     var transaction = redis.multi();

      //     _.map(data, function (itemKey) {
      //       transaction.hgetall(itemKey);
      //     });

      //     return transaction.execAsync();
      // })
      // .then(function (data) {
      //   // return cartResponse(data);
      //   return data
      // })
      // .catch(function (error) {
      //   // return cartResponse(data);
      //   // return data

      //   debug('ERROR REDIS', error)
      // });


      // debug('current Cartdata', currentCart)

      // client.multi().get('foo').execAsync().then(function(res) {
      //     console.log(res); // => 'bar' 
      // });

      let payload = { message: isExists }
      return res['200'](payload, 'nice!!')


    } catch(err) {
      let payload = { success: false }
      debug('Error', err)
      return res['500'](payload, err)
    }
  }


  /**
   * List cart items
   */
  cart (req, res) {
    var cartKey = getCartKey(req);

    var getQuantity = function (items) {
      var quantity = 0;
      _.each(items, function (item) {
        quantity += parseInt(item.quantity, 10);
      });
      return quantity;
    };

    var cartResponse = function (items) {
      items = _.map(items, function (item) {
        item.id = parseInt(item.id, 10);
        item.$price = numeral(item.price).format();
        item.quantity = parseInt(item.quantity, 10);

        if (item.offer)
          item.$offer = numeral(item.offer).format();

        return item;
      });

      var payload = {
        prices: cartPrices(items),
        quantity: getQuantity(items),
        items: items
      };

      if (!res) {
        return payload;
      }

      return res.ok(payload, messages.cartListed);
    };

    return checkIfCartExists(cartKey)
    .then(function (exists) {
      if (!exists) {
        return cartResponse([]);
      }

      return redis
      .zrevrangeAsync(cartKey, 0, -1)
      .then(function (data) {
        if (data.length === 0) {
          return [];
        }

        var transaction = redis.multi();

        _.map(data, function (itemKey) {
          transaction.hgetall(itemKey);
        });

        return transaction.execAsync();
      })
      .then(function (data) {
        return cartResponse(data);
      });
    })

  }
}


export default AuthController
