const { check } = require("express-validator")
const dbConnect = require("../config/dbConnect.js")

// exports.validateUsername = () => {
//   check("username").trim().notEmpty().withMessage("Username cannot be empty").isString().isLength({ min: 3 }).withMessage("minimum 3 charaters")
// }
// exports.validatePassword = () => {
//   check("password").trim().notEmpty()
// }
module.exports = {
  validateUsername: check("username").trim().notEmpty().withMessage("Username cannot be empty").isString().isLength({ min: 3 }).withMessage("minimum 3 charaters"),
  validatePassword: check("password")
    .trim()
    .notEmpty()
    .withMessage("password cannot be empty")
    .isLength({ min: 8, max: 10 })
    .withMessage("Password must be between 8 to 10 charaters")
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/)
    .withMessage("must contain atleast one alphabet,one special character and one number"),
  validateEmail: check("email").trim().isEmail().withMessage("Please enter a valid email").optional(),
  validatespace: check("taskname").trim().notEmpty().withMessage("pls enter a valid task name"),
  validateappname: check("appname").trim().notEmpty().withMessage("pls enter a valid app name"),
  validateplan: check("planname").trim().notEmpty().withMessage("pls enter a valid plan name")
}
