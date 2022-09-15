const { validationResult } = require("express-validator")

exports.reg = async (req, res) => {
  const { username } = req.body

  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    console.log(errors)
    return res.send(errors)
  } else {
    console.log("no errors found")
  }
  return
}
