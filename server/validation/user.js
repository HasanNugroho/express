const Joi = require("joi");

const registerUserValidation = Joi.object({
    name:Joi.string().max(100).required(),
    username:Joi.string().max(100).required(),
    email:Joi.email().required(),
    password:Joi.string().max(100).required(),
})

module.exports = { registerUserValidation }