const debug = require('debug')('assistance-service:controllers:api');
const redis = require('../initializers/redis');

export function cartExists (cartKey) {
  return redis.existsAsync(cartKey).then((data) => {
    return data !== 0;
  })
}
