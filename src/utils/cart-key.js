const debug = require('debug')('assistance-service:helpers:cart-key')

export function getCart(req) {
  let cardId = req.session.id
  let key = `cart ==> ${cardId}`
  debug(key)

  return key
}
