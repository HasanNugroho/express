const _ = require('lodash')
const Knex = require('knex')
const Objection = require('objection')
const autoload = require('auto-load')
const path = require('path')
const Promise = require('bluebird')

const migrationSource = require('../db/migrator-source')
module.exports = {
    Objection,
    kenx: null,
    conAttempts: 0,

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

        return {
            ...this,
            ...models
        }
    },

    async connect() {
        try {
            APPS.logger.info('Connecting to database...')
            await this.knex.raw('SELECT 1 + 1;')
            APPS.logger.info('Database Connection Successful [ OK ]')
        } catch (err) {
            APPS.logger.error(JSON.stringify(err))
            if (this.conAttempts < 5) {
                if (err.code) {
                    APPS.logger.error(`Database Connection Error: ${err.code} ${err.address}:${err.port}`)
                } else {
                    APPS.logger.error(`Database Connection Error: ${err.message}`)
                }
                APPS.logger.warn(`Will retry in 3 seconds... [Attempt ${++this.conAttempts} of 5]`)
                await new Promise(resolve => setTimeout(resolve, 3000))
                await this.connect()
            } else {
                throw err
            }
        }
    },

    // -> Migrate DB Schemas
    async syncSchemas() {
        return this.knex.migrate.latest({
            tableName: 'migrations',
            migrationSource
        })
    }
}