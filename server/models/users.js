const { Model } = require('objection');

class Users extends Model {

    static get tableName() {
        return 'users';
    }

    static async getUser() {
        const user = APPS.models.user.query();
        return user
    }
}

module.exports = Users;