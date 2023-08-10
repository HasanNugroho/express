const yaml = require('js-yaml')
const path = require('path')
const fs = require('fs')
const cfgHelper = require('../helpers/config')

module.exports = {
    init() {
        let confPaths = {
            config: path.join(APPS.ROOTPATH, 'config.yml'),
        }


        let appconfig = {}
        try {
            appconfig = yaml.load(
                cfgHelper.parseConfigValue(
                  fs.readFileSync(confPaths.config, 'utf8')
                )
              )
        } catch (err) {
            console.error(err.message)
            process.exit(1)
        }

        APPS.config = appconfig

    },

    async loadDb(){
        let loadDb = APPS.models.settings.getSettings();
        APPS.logger.info(JSON.stringify(loadDb))
        if(!loadDb) {
            APPS.config.setup = true;
        }
    }
}