const { Model } = require('objection');

class User extends Model {

    static get tableName() {
        return 'users';
    }

    static async getUser() {
        const user = APPS.models.user.query();
        return user
    }
}

module.exports = User;