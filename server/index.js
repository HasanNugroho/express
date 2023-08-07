
const path = require('path')

let APPS = {
    IS_DEBUG: process.env.NODE_ENV === 'development',
    SERVERPATH: path.join(process.cwd(), 'server'),
    ROOTPATH: process.cwd(),
    Error: require('./helpers/error'),
    configSvc: require('./core/config'),
    kernel: require('./core/kernel')
}

global.APPS = APPS

APPS.configSvc.init()

APPS.logger = require('./core/logger').init('MASTER')

APPS.kernel.init()