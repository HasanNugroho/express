const express = require('express')
const compression = require('compression')
const http = require('http')

module.exports = () => {
    const app = express()
    app.use(compression())

    // ----------------------------------------
    // Start HTTP server
    // ----------------------------------------

    APPS.logger.info(`Starting HTTP server on port ${APPS.config.port}...`)

    app.set('port', APPS.config.port)

    APPS.logger.info(`HTTP Server on port: [ ${APPS.config.port} ]`)
    APPS.server = http.createServer(app)
    APPS.server.listen(APPS.config.port, APPS.config.bindIP)

    var openConnections = []

    APPS.server.on('connection', (conn) => {
        let key = conn.remoteAddress + ':' + conn.remotePort
        openConnections[key] = conn
        conn.on('close', () => {
            openConnections.splice(key, 1)
        })
    })

    APPS.server.destroy = (cb) => {
        APPS.server.close(cb)
        for (let key in openConnections) {
            openConnections[key].destroy()
        }
    }

    APPS.server.on('error', (error) => {
        if (error.syscall !== 'listen') {
            throw error
        }

        switch (error.code) {
            case 'EACCES':
                APPS.logger.error('Listening on port ' + APPS.config.port + ' requires elevated privileges!')
                return process.exit(1)
            case 'EADDRINUSE':
                APPS.logger.error('Port ' + APPS.config.port + ' is already in use!')
                return process.exit(1)
            default:
                throw error
        }
    })

    APPS.server.on('listening', () => {
        APPS.logger.info('HTTP Server: [ RUNNING ]')
        APPS.logger.info('🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻')
        APPS.logger.info('')
        APPS.logger.info(`Browse to http://YOUR-SERVER-IP:${APPS.config.port}/ to complete setup!`)
        APPS.logger.info('')
        APPS.logger.info('🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺')
    })
}