module.exports = {
    async init() {
        APPS.logger.info('================================')
        APPS.logger.info('Chicken Farm Dashboard')
        APPS.logger.info('================================')
        APPS.logger.info('Initializing...')

        APPS.models = require('./db').init()

        try {
            await APPS.models.onReady()
            await APPS.configSvc.loadDb()
            // await APPS.configSvc.applyFlags()
        } catch (err) {
            APPS.logger.error('Database Initialization Error: ' + err.message)
            if (APPS.IS_DEBUG) {
              APPS.logger.error(err)
            }
            process.exit(1)
        }
        
        this.bootMaster();
        
    },

    async bootMaster(){
        try {
            
        } catch (error) {
            throw error;
        }
    }
}