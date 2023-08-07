// const _ = require('lodash')
const winston = require('winston')

/* global WIKI */

module.exports = {
  loggers: {},
  init(uid) {
    const loggerFormats = [
      winston.format.label({ label: uid }),
      winston.format.timestamp()
    ]

    if (APPS.config.logFormat === 'json') {
      loggerFormats.push(winston.format.json())
    } else {
      loggerFormats.push(winston.format.colorize())
      loggerFormats.push(winston.format.printf(info => `[${info.label}] ${info.timestamp} ${info.level}: ${info.message}`))
    }

    const logger = winston.createLogger({
      level: APPS.config.logLevel,
      format: winston.format.combine(...loggerFormats)
    })

    // Init Console (default)

    logger.add(new winston.transports.Console({
      level: APPS.config.logLevel,
      prettyPrint: true,
      colorize: true,
      silent: false,
      timestamp: true
    }))

    return logger
  }
}