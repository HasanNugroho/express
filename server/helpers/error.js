const CustomError = require('custom-error-instance')

module.exports = {
    LoginFailed: CustomError('LoginFailed', {
        message: "email / password invalid!",
        code: 401
    })
}