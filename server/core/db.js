const _ = require('lodash')
const Knex = require('knex')
const Objection = require('objection')
const autoload = require('auto-load')
const path = require('path')
const Promise = require('bluebird')

module.exports = {
    Objection,
    kenx: null,

    init() {
        let self = this
        let dbClient = 'mysql2'
        let dbConfig = (!_.isEmpty(process.env.DATABASE_URL)) ? process.env.DATABASE_URL : {
            host: APPS.config.db.host.toString(),
            user: APPS.config.db.user.toString(),
            password: APPS.config.db.pass.toString() ? APPS.config.db.pass.toString() : null,
            database: APPS.config.db.db.toString(),
            port: APPS.config.db.port
        }

        // Initialize Knex
        this.knex = Knex({
            client: dbClient,
            useNullAsDefault: true,
            asyncStackTraces: APPS.IS_DEBUG,
            connection: dbConfig,
            pool: {
                ...APPS.config.pool,
                async afterCreate(conn, done) {
                    // -> Set Connection App Name
                    await conn.promise().query(`set autocommit = 1`)
                    done()
                }
            },
            debug: APPS.IS_DEBUG
        })

        Objection.Model.knex(this.knex)

        // Load DB Models

        const models = autoload(path.join(APPS.SERVERPATH, 'models'))

        // Set init tasks
        let conAttempts = 0
        let initTasks = {
            // -> Attempt initial connection
            async connect() {
                try {
                    APPS.logger.info('Connecting to database...')
                    await self.knex.raw('SELECT 1 + 1;')
                    APPS.logger.info('Database Connection Successful [ OK ]')
                } catch (err) {
                    if (conAttempts < 5) {
                        if (err.code) {
                            APPS.logger.error(`Database Connection Error: ${err.code} ${err.address}:${err.port}`)
                        } else {
                            APPS.logger.error(`Database Connection Error: ${err.message}`)
                        }
                        APPS.logger.warn(`Will retry in 3 seconds... [Attempt ${++conAttempts} of 5]`)
                        await new Promise(resolve => setTimeout(resolve, 3000))
                        await initTasks.connect()
                    } else {
                        throw err
                    }
                }
            },

            // -> Migrate DB Schemas
            async syncSchemas() {
                return self.knex.migrate.latest({
                    tableName: 'migrations',
                    migrationSource
                })
            },

            // -> Migrate DB Schemas from beta
            async migrateFromBeta() {
                return migrateFromBeta.migrate(self.knex)
            }
        }

        // Perform init tasks
        let initTasksQueue = (APPS.IS_MASTER) ? [
            initTasks.connect(),
            // initTasks.migrateFromBeta,
            // initTasks.syncSchemas
          ] : [
            () => { return Promise.resolve() }
          ]
      

        // initTasks.connect()
        APPS.logger.info(`Using database driver ${dbClient} for ${APPS.config.db.type} [ OK ]`)
        this.onReady = Promise.each(initTasksQueue, t => t()).return(true)

        return {
            ...this,
            ...models
        }
    }
}