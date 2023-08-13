// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
const logger = require('../core/logger');

module.exports = {

  development: {
    client: 'mysql',
    connection: {
      database: 'sitani',
      user:     'root',
      password: null
    },
    pool: {
      min: 2,
      max: 10
    },
    log: {
      warn(message) {
        logger.warn(message)
      },
      error(message) {
        logger.error(message)
      },
      deprecate(message) {
        logger.info(message)
      },
      debug(message) {
        logger.info(message)
      },
    }
  },

  staging: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user:     'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    },
    log: {
      warn(message) {
        logger.warn(message)
      },
      error(message) {
        logger.error(message)
      },
      deprecate(message) {
        logger.info(message)
      },
      debug(message) {
        logger.info(message)
      },
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user:     'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    },
    log: {
      warn(message) {
        logger.warn(message)
      },
      error(message) {
        logger.error(message)
      },
      deprecate(message) {
        logger.info(message)
      },
      debug(message) {
        logger.info(message)
      },
    }
  }

};
