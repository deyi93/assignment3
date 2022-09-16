// import { findAll } from "../controller/controller.js"
// const { reg } = require("../controller/testcontroller")
const controller = require("../controller/controller.js")
const Router = require("express").Router()
const { validateUsername, validatePassword, validateEmail, validatespace, validateappname, validateplan, validloginpassowrd, validloginusername } = require("../controller/validate")

Router.route("/details").get(controller.findAll)
Router.route("/auth").post(controller.auth)
Router.route("/login").post(controller.login)
Router.route("/checkGroup").post(controller.checkGroup)
Router.route("/register").post([validateUsername, validateEmail, validatePassword], controller.createUser)
Router.route("/updateEmail").post([validateEmail], controller.updateEmail)
Router.route("/updatePassword").post([validatePassword], controller.updatePassword)
Router.route("/activation").post(controller.activationStatus)
Router.route("/createGroup").post(controller.createGroup)
Router.route("/allGroup").get(controller.allGroup)
Router.route("/addusertogroup").post(controller.addToGroup)
Router.route("/notInGroup").post(controller.userNotInGroup)
Router.route("/userInGroup").post(controller.userInGroup)
Router.route("/deletefromgrp").post(controller.deleteFromGroup)

Router.route("/apppermission").post(controller.appPermission)
Router.route("/createapp").post([validateappname], controller.createApp)
Router.route("/findallapp").get(controller.findAllApp)
Router.route("/editgroup").post(controller.editGroup)
Router.route("/getoneapp").post(controller.getOneApp)
Router.route("/createtask").post([validatespace, validloginusername, validloginpassowrd], controller.CreateTask)
Router.route("/findalltask").post(controller.findAllTask)
Router.route("/loadtask").post(controller.loadTask)
Router.route("/updatetask").post(controller.updateTask)
Router.route("/createplan").post([validateplan], controller.createPlan)
Router.route("/loadplan").post(controller.loadPlan)
Router.route("/loadtaskopen").post(controller.loadTaskOpen)
Router.route("/assignplan").post(controller.assignPlan)
Router.route("/pushtodolist").post(controller.pushToDo)
Router.route("/viewplan").post(controller.findOnePlan)
Router.route("/gettest").get(controller.getreQuest)

Router.route("/gettaskbystate").post([validloginusername, validloginpassowrd], controller.GetTaskbyState)
Router.route("/promotetask2done").post([validloginusername, validloginpassowrd], controller.PromoteTask2Done)
module.exports = Router
