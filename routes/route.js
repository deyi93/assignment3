// import { findAll } from "../controller/controller.js"
// const { reg } = require("../controller/testcontroller")
const controller = require("../controller/controller.js")
const Router = require("express").Router()
const { validateUsername, validatePassword, validateEmail, validatespace, validateappname, validateplan, validloginpassowrd, validloginusername } = require("../controller/validate")

Router.route("/createtask").post([validloginusername, validloginpassowrd], controller.CreateTask)
Router.route("/gettaskbystate").post([validloginusername, validloginpassowrd], controller.GetTaskbyState)
Router.route("/promotetask2done").post([validloginusername, validloginpassowrd], controller.PromoteTask2Done)

module.exports = Router
