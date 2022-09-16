const dbConnect = require("../config/dbConnect.js")
const mysql = require("mysql")
const bcrypt = require("bcrypt")
const path = require("path")
const { validationResult } = require("express-validator")
require("dotenv").config({
  path: path.resolve(__dirname, "../config.env")
})

const jwt = require("jsonwebtoken")
const nodemailer = require("nodemailer")
const { connect } = require("http2")
const { resolveAny } = require("dns/promises")

exports.CreateTask = (req, res) => {
  const username = req.body.username
  const password = req.body.password
  //const usergroup = req.body.usergroup

  let date_ob = new Date()
  let date = ("0" + date_ob.getDate()).slice(-2)
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2)
  let year = date_ob.getFullYear()
  let hours = date_ob.getHours()
  let minutes = date_ob.getMinutes()
  let seconds = date_ob.getSeconds()
  let currentDate = year + "/" + month + "/" + date + " " + hours + ":" + minutes + ":" + seconds
  let group = []
  const appname = req.body.appname
  let taskdescription = req.body.taskdescription
  const taskname = req.body.taskname
  //const username = req.body.username
  let tasknotes = req.body.tasknotes

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors)
    //send code
    return res.send(errors)
  } else {
    if (taskdescription === null || taskdescription === "undefined") {
      taskdescription = " "
    }
    dbConnect.getConnection(async (err, connection) => {
      if (err) {
        console.log(err)
      }
      const sqlSearch = "SELECT * FROM accounts WHERE username = ?"
      const search_query = mysql.format(sqlSearch, [username])
      let sqlSearch_app = "SELECT * FROM application WHERE App_Acronym=?"
      let sqlCount = "SELECT COUNT(*) as count FROM nodelogin.task WHERE "
      sqlCount += `(Task_app_Acronym = "${appname}")`
      let sqlExist = "SELECT * FROM task WHERE Task_app_Acronym=? AND Task_name=?"
      const sqlSearch_grp = " SELECT * FROM usergroups WHERE username=? AND usergroup=? "
      await connection.query(search_query, async (err, result) => {
        if (err) console.log(err)
        if (result.length == 0) {
          res.status(401).send("code:" + 401)
          connection.release()
        } else {
          const hashedPassword = result[0].password
          if (await bcrypt.compare(password, hashedPassword)) {
            if (result[0].status == 1) {
              const accessToken = jwt.sign({ username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15d" })
              // res.status(200).send("login")
              connection.query("SELECT * FROM application WHERE App_Acronym=?", [appname], (err, data) => {
                if (data.length === 0) {
                  res.status(400).send("bad request, App does not exist")
                } else {
                  // for(let i=0; i<data[0].App_permit_Create.split(",").length; i++){
                  //   permit[i]=
                  // }
                  connection.query(sqlSearch_grp, [username, data[0].App_permit_Create], (err1, result) => {
                    if (err1) console.log(err1)

                    if (result.length > 0) {
                      connection.query(sqlSearch_app, [appname], async (err1, result1) => {
                        if (err1) console.log(err1)
                        else {
                          let rnumber = result1[0].App_Rnumber
                          connection.query(sqlExist, [appname, taskname], (err3, result3) => {
                            if (err3) console.log(err3)

                            if (result3.length === 0) {
                              connection.query(sqlCount, (err, result) => {
                                if (err) {
                                  console.log(err)
                                } else {
                                  let count = result[0].count
                                  console.log(count)
                                  let sqlCreate = "INSERT INTO task (`Task_id`, `Task_name`, `Task_description`, `Task_notes`, `Task_plan`, `Task_app_Acronym`, `Task_state`, `Task_creator`, `Task_owner`, `Task_createDate`) VALUES "
                                  let id = rnumber + count
                                  console.log(id)
                                  sqlCreate += `("${appname + "_" + id}","${taskname}","${taskdescription.replace(/["']/g, "")}","${"user:" + username + " notes:" + tasknotes + " " + currentDate + " state:open\n"}","-","${appname}","open","${username}","${username}","${currentDate}")`
                                  connection.query(sqlCreate, (err2, result2) => {
                                    if (err2) console.log(err2)
                                    else {
                                      res.status(201).send("Task Created")
                                    }
                                  })
                                }
                              })
                            } else {
                              res.status(400).send("Bad request, task exist")
                            }
                          })
                        }
                      })
                    } else {
                      res.status(403).send("user has no permit")
                    }
                  })

                  // res.status(200).send(data[0].App_permit_Create.split(","))
                }
              })
            } else {
              res.status(401).send("code:" + "code:" + 401)
              connection.release()
            }
          } else {
            res.status(401).send("code:" + "code:" + 401)
            connection.release()
          }
        }
      })
    })
  }
}
exports.PromoteTask2Done = (req, res) => {
  const username = req.body.username
  const password = req.body.password
  //const usergroup = req.body.usergroup

  let date_ob = new Date()
  let date = ("0" + date_ob.getDate()).slice(-2)
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2)
  let year = date_ob.getFullYear()
  let hours = date_ob.getHours()
  let minutes = date_ob.getMinutes()
  let seconds = date_ob.getSeconds()
  let currentDate = year + "/" + month + "/" + date + " " + hours + ":" + minutes + ":" + seconds
  let group = []
  const appname = req.body.appname
  let taskdescription = req.body.taskdescription
  const taskname = req.body.taskname

  let tasknotes = req.body.tasknotes

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors)
    //send code
    return res.send(errors)
  } else {
    if (taskdescription === null || taskdescription === undefined) {
      taskdescription = " "
    }
    if (tasknotes === null || tasknotes === undefined) {
      tasknotes = " "
    }
    dbConnect.getConnection(async (err, connection) => {
      if (err) {
        console.log(err)
        res.status(500).send(code)
      }
      const sqlSearch = "SELECT * FROM accounts WHERE username = ?"
      const search_query = mysql.format(sqlSearch, [username])
      let sqlSearch_app = "SELECT * FROM application WHERE App_Acronym=?"
      let sqlSearch_task = `SELECT * FROM task WHERE Task_app_Acronym="${appname}" AND Task_name="${taskname}"`
      let sqlCount = "SELECT COUNT(*) as count FROM nodelogin.task WHERE "
      sqlCount += `(Task_app_Acronym = "${appname}")`
      let sqlExist = "SELECT * FROM task WHERE Task_app_Acronym=? AND Task_name=?"
      const sqlSearch_grp = " SELECT * FROM usergroups WHERE username=? AND usergroup=? "
      //check for username else return 401
      await connection.query(search_query, async (err, result) => {
        if (err) console.log(err)
        if (result.length == 0) {
          res.status(401).send("code:" + 401)
          connection.release()
        } else {
          //check for password,esle return 401
          const hashedPassword = result[0].password
          if (await bcrypt.compare(password, hashedPassword)) {
            if (result[0].status == 1) {
              const accessToken = jwt.sign({ username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15d" })
              //check appname, else return 404 bad request
              connection.query("SELECT * FROM application WHERE App_Acronym=?", [appname], (err, data) => {
                if (data.length === 0) {
                  res.status(404).send("code:" + 404)
                } else {
                  //serach for the group for permit doing,else return 403 forbidden, do not have rights
                  connection.query(sqlSearch_grp, [username, data[0].App_permit_Doing], (err1, result) => {
                    if (err1) console.log(err1)

                    if (result.length > 0) {
                      //check for task exist or not,else return 400 bad request
                      connection.query(sqlExist, [appname, taskname], async (err3, result3) => {
                        if (err3) console.log(err3)

                        if (result3.length === 0) {
                          res.status(404).send("task nopt exist")
                        } else {
                          await connection.query(sqlSearch_task, async (err2, result2) => {
                            if (err2) console.log(err2)

                            let sqlUpdate = `UPDATE task SET Task_owner="${username}", Task_notes="${"user:" + username + " notes:" + tasknotes + " " + currentDate + " state:" + "done" + "\n\n" + result2[0].Task_notes + "\n"}",Task_state="done" WHERE Task_name="${taskname}" AND Task_app_Acronym="${appname}" `
                            //if the current task state is in doing then update,else code 406 not acceptable
                            if (result2[0].Task_state === "doing") {
                              await connection.query(sqlUpdate, async (updateerr, updateresult) => {
                                if (updateerr) console.log(updateerr)
                                else {
                                  //if it is able to update then sent email,return 200
                                  if (updateresult) {
                                    let sqlPermit = "SELECT * FROM application WHERE App_Acronym=?"
                                    await connection.query(sqlPermit, [appname], async (perr, presult) => {
                                      if (perr) throw perr
                                      let permitgrp = presult[0].App_permit_Done
                                      let sqluser = "SELECT * FROM usergroups WHERE usergroup=?"
                                      await connection.query(sqluser, [permitgrp], async (uerr, uresult) => {
                                        if (uerr) throw uerr
                                        else {
                                          let sqlemail = "SELECT email FROM accounts WHERE username=?"
                                          let totalemail = ""
                                          for (let e = 1; e < uresult.length; e++) {
                                            connection.query(sqlemail, [uresult[e].username], async (emailerr, emailresult) => {
                                              if (emailerr) console.log(emailerr)
                                              else {
                                                console.log(uresult[e].username)
                                                console.log(emailresult[0].email)
                                                totalemail += emailresult[0].email + ","
                                                console.log(totalemail)
                                              }
                                            })
                                          }

                                          let taskowner = result2[0].Task_owner
                                          let taskdone = result2[0].Task_name

                                          let testAccount = await nodemailer.createTestAccount()
                                          let transporter = nodemailer.createTransport({
                                            service: process.env.emailservice,
                                            auth: {
                                              user: process.env.emailaddress, // generated ethereal user
                                              pass: process.env.pass // generated ethereal password
                                            }
                                          })

                                          let info = await transporter.sendMail({
                                            from: process.env.from, // sender address
                                            to: totalemail, // list of receivers
                                            subject: "Done", // Subject line
                                            text: `${taskowner} sent ${taskdone} to done` // plain text body
                                          })
                                        }
                                      })
                                    })
                                  }
                                  res.status(200).send("updated")
                                }
                              })
                            } else {
                              res.status(406).send("task not in doing state")
                            }
                          })
                        }
                      })
                    } else {
                      res.status(403).send("user has no permit")
                    }
                  })
                }
              })
            } else {
              res.status(401).send("code:" + 401)
              connection.release()
            }
          } else {
            res.status(401).send("code:" + 401)
            connection.release()
          }
        }
      })
    })
  }
}
exports.GetTaskbyState = (req, res) => {
  let username = req.body.username
  let password = req.body.password
  let appname = req.body.appname
  let state = req.body.state
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors)
    return res.send(errors)
  } else {
    dbConnect.getConnection(async (err, connection) => {
      if (err) {
        console.log(err)
      }
      const sqlSearch = "SELECT * FROM accounts WHERE username = ?"
      const search_query = mysql.format(sqlSearch, [username])
      let sqlSearch_task = "SELECT * FROM task WHERE Task_app_Acronym=? AND Task_state=?"

      await connection.query(search_query, async (err, result) => {
        if (err) console.log(err)
        if (result.length == 0) {
          res.status(401).send("username and password is incorrect")
          connection.release()
        } else {
          const hashedPassword = result[0].password
          if (await bcrypt.compare(password, hashedPassword)) {
            if (result[0].status == 1) {
              const accessToken = jwt.sign({ username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15d" })
              connection.query(sqlSearch_task, [appname, state], (err1, result1) => {
                if (err1) {
                  res.status(404).send("not found")
                } else {
                  if (result1.length === 0) {
                    res.status(404).send("not found")
                  } else {
                    res.status(200).send(result1)
                  }
                }
              })
            } else {
              res.status(401).send("username and password is incorrect")
              connection.release()
            }
          } else {
            res.status(401).send("username and password is incorrect")
            connection.release()
          }
        }
      })
    })
  }
}
