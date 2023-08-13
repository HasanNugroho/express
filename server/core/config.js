const _ = require('lodash')
const yaml = require('js-yaml')
const path = require('path')
const fs = require('fs')
const cfgHelper = require('../helpers/config')

module.exports = {
    init() {
        let confPaths = {
            config: path.join(APPS.ROOTPATH, 'config.yml'),
            data: path.join(APPS.SERVERPATH, 'app/data.yml'),
        }


        let appconfig = {}
        let appdata = {}
        try {
            appconfig = yaml.load(
                cfgHelper.parseConfigValue(
                    fs.readFileSync(confPaths.config, 'utf8')
                )
            )
            appdata = yaml.load(fs.readFileSync(confPaths.data, 'utf8'))
        } catch (err) {
            console.error(err.message)
            process.exit(1)
        }

        appconfig = _.defaultsDeep(appconfig, appdata.defaults.config)

        APPS.config = appconfig

    },

    async loadDb() {
        let loadDb = await APPS.models.users.query();
        if (loadDb.length === 0) {
            APPS.config.setup = true
        }
    }
}