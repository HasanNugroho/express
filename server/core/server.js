const http = require('http')
const https = require('https')


module.exports = {
    servers: {
        http: null,
        https: null
    },
    connections: new Map(),

    async startHTTP() {
        APPS.logger.info(`HTTP Server on port: ${APPS.config.port}`)
        this.servers.http = http.createServer(APPS.app)

        this.servers.http.listen(APPS.config.port, APPS.config.bindIP)
        this.servers.http.on('error', (error) => {
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
    
        this.servers.http.on('listening', () => {
            APPS.logger.info('HTTP Server: [ RUNNING ]')
        })
    
        this.servers.http.on('connection', conn => {
            let connKey = `http:${conn.remoteAddress}:${conn.remotePort}`
            this.connections.set(connKey, conn)
            conn.on('close', () => {
                this.connections.delete(connKey)
            })
        })
    },
     /**
     * Start HTTPS Server
     */
    async startHTTPS () {
        APPS.logger.info(`HTTPS Server on port: [ ${APPS.config.ssl.port} ]`)
        const tlsOpts = {}
        try {
            if (APPS.config.ssl.format === 'pem') {
                tlsOpts.key = APPS.config.ssl.inline ? APPS.config.ssl.key : fs.readFileSync(APPS.config.ssl.key)
                tlsOpts.cert = APPS.config.ssl.inline ? APPS.config.ssl.cert : fs.readFileSync(APPS.config.ssl.cert)
            } else {
                tlsOpts.pfx = APPS.config.ssl.inline ? APPS.config.ssl.pfx : fs.readFileSync(APPS.config.ssl.pfx)
            }
            if (!_.isEmpty(APPS.config.ssl.passphrase)) {
                tlsOpts.passphrase = APPS.config.ssl.passphrase
            }
            if (!_.isEmpty(APPS.config.ssl.dhparam)) {
                tlsOpts.dhparam = APPS.config.ssl.dhparam
            }
        } catch (err) {
            APPS.logger.error('Failed to setup HTTPS server parameters:')
            APPS.logger.error(err)
            return process.exit(1)
        }
        this.servers.https = https.createServer(tlsOpts, APPS.app)

        this.servers.https.listen(APPS.config.ssl.port, APPS.config.bindIP)
        this.servers.https.on('error', (error) => {
        if (error.syscall !== 'listen') {
            throw error
        }

        switch (error.code) {
            case 'EACCES':
            APPS.logger.error('Listening on port ' + APPS.config.ssl.port + ' requires elevated privileges!')
            return process.exit(1)
            case 'EADDRINUSE':
            APPS.logger.error('Port ' + APPS.config.ssl.port + ' is already in use!')
            return process.exit(1)
            default:
            throw error
        }
        })

        this.servers.https.on('listening', () => {
            APPS.logger.info('HTTPS Server: [ RUNNING ]')
        })

        this.servers.https.on('connection', conn => {
            let connKey = `https:${conn.remoteAddress}:${conn.remotePort}`
            this.connections.set(connKey, conn)
            conn.on('close', () => {
                this.connections.delete(connKey)
            })
        })
    },
    /**
   * Close all active connections
   */
  closeConnections (mode = 'all') {
    for (const [key, conn] of this.connections) {
      if (mode !== `all` && key.indexOf(`${mode}:`) !== 0) {
        continue
      }
      conn.destroy()
      this.connections.delete(key)
    }
    if (mode === 'all') {
      this.connections.clear()
    }
  },
  /**
   * Stop all servers
   */
  async stopServers () {
    this.closeConnections()
    if (this.servers.http) {
      await Promise.fromCallback(cb => { this.servers.http.close(cb) })
      this.servers.http = null
    }
    if (this.servers.https) {
      await Promise.fromCallback(cb => { this.servers.https.close(cb) })
      this.servers.https = null
    }
    this.servers.graph = null
  },
  /**
   * Restart Server
   */
  async restartServer (srv = 'https') {
    this.closeConnections(srv)
    switch (srv) {
      case 'http':
        if (this.servers.http) {
          await Promise.fromCallback(cb => { this.servers.http.close(cb) })
          this.servers.http = null
        }
        this.startHTTP()
        break
      case 'https':
        if (this.servers.https) {
          await Promise.fromCallback(cb => { this.servers.https.close(cb) })
          this.servers.https = null
        }
        this.startHTTPS()
        break
      default:
        throw new Error('Cannot restart server: Invalid designation')
    }
  }
}