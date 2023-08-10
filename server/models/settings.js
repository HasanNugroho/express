const {
    Model
} = require('objection');
const _ = require('lodash')

class Settings extends Model {

    static get tableName() {
        return 'settings';
    }

    static get idColumn() {
        return 'key';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['key'],

            properties: {
                key: {
                    type: 'string'
                },
                createdAt: {
                    type: 'string'
                },
                updatedAt: {
                    type: 'string'
                }
            }
        }
    }

    static get jsonAttributes() {
        return ['value']
    }

    $beforeUpdate() {
        this.updatedAt = new Date().toISOString()
    }
    $beforeInsert() {
        this.updatedAt = new Date().toISOString()
    }

    static async getSettings() {
        const settings = APPS.models.settings.query();
        APPS.logger.info(JSON.stringify(settings))

        if (settings.length > 0) {
            return _.reduce(settings, (res, val, key) => {
                _.set(res, val.key, (_.has(val.value, 'v')) ? val.value.v : val.value)
                return res
            }, {})
        } else {
            return false
        }
    }
}

module.exports = Settings;