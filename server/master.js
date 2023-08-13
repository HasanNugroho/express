const autoload = require('auto-load')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const compression = require('compression')
const express = require('express')
const session = require('express-session')
const KnexSessionStore = require('connect-session-knex')(session)
const path = require('path')

module.exports = async () => {

    APPS.auth = require('./core/auth').init()

    // ----------------------------------------
    // Load middlewares
    // ----------------------------------------

    const mw = autoload(path.join(APPS.SERVERPATH, '/middlewares'))
    const ctrl = autoload(path.join(APPS.SERVERPATH, '/controllers'))

    const app = express()
    APPS.app = app
    app.use(compression())

    // ----------------------------------------
    // Security
    // ----------------------------------------

    app.use(mw.security)
    app.use(cors({ origin: false }))
    app.options('*', cors({ origin: false }))

        // ----------------------------------------
    // SSL Handlers
    // ----------------------------------------

    app.use('/', ctrl.ssl)

        // ----------------------------------------
    // Passport Authentication
    // ----------------------------------------

    app.use(cookieParser())
    app.use(session({
        // secret: APPS.config.sessionSecret,
        secret: 'S3c123T',
        resave: false,
        saveUninitialized: false,
        store: new KnexSessionStore({
        knex: APPS.models.knex
        })
    }))
    app.use(APPS.auth.passport.initialize())
    app.use(APPS.auth.authenticate)

    await APPS.servers.startHTTP()

    if (APPS.config.ssl.enabled === true || APPS.config.ssl.enabled === 'true' || APPS.config.ssl.enabled === 1 || APPS.config.ssl.enabled === '1') {
        await APPS.servers.startHTTPS()
    }
}