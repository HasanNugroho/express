const { registerUserValidation } = require("../validation/user")
const { validate } = require("../validation/validation")

const register = async (request) => {
    const user = validate(registerUserValidation, request);
}