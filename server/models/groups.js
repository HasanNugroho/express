const { Model } = require('objection');

class Groups extends Model {

    static get tableName() {
        return 'groups';
    }

    static async getGroups() {
        const groups = APPS.models.groups.query();
        return groups
    }
}

module.exports = Groups;