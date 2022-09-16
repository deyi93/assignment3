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

exports.findAll = (req, res) => {
  dbConnect.query("SELECT * FROM accounts", (err, data) => {
    if (err) {
      console.log(err)
    }
    res.send(data)
  })
}
exports.userNotInGroup = (req, res) => {
  const usergroup = req.body.usergroup
  dbConnect.query("SELECT * FROM accounts WHERE `username` NOT IN (SELECT `username` FROM  usergroups WHERE `usergroup`=?)", [usergroup], (err, data) => {
    if (err) {
      console.log(err)
    }
    res.send(data)
  })
}
exports.auth = (req, res) => {
  const token = req.body.accessToken
  if (token != null) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
      if (err) {
        res.json({ message: "session timeout" })
      } else {
        res.json({ message: "ok" })
      }
    })
  }
}

exports.login = (req, res) => {
  const username = req.params.username
  const password = req.params.password
  console.log(username)

  dbConnect.getConnection(async (err, connection) => {
    if (err) console.log(err)
    const sqlSearch = "SELECT * FROM accounts WHERE username = ?"
    const search_query = mysql.format(sqlSearch, [username])

    await connection.query(search_query, async (err, result) => {
      if (err) console.log(err)
      if (result.length == 0) {
        res.json({
          login: false,
          error: "incorrect",
          status: 401
        })
      } else {
        const hashedPassword = result[0].password
        if (await bcrypt.compare(password, hashedPassword)) {
          if (result[0].status == 1) {
            const accessToken = jwt.sign({ username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15d" })

            res.json({ login: true, username: username, accessToken: accessToken })
          } else {
            res.json({
              login: false,
              error: "incorrect",
              status: 401
            })
            connection.release()
          }
        } else {
          //res.status(401).send("Password Incorrect!")
          res.json({
            login: false,
            error: "incorrect",
            status: 401
          })
          connection.release()
          // res.send("Password incorrect!")
        } //end of bcrypt.compare()
      } //end of User exists i.e. results.length==0
    }) //end of connection.query()
  }) //end of db.connection()
}

exports.createUser = async (req, res) => {
  const username = req.body.username
  const password = req.body.password
  const email = req.body.email
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    console.log(errors)
    res.status(500).send(errors)
  } else {
    const hashedPassword = await bcrypt.hash(password, 10)
    dbConnect.getConnection(async (err, connection) => {
      if (err) console.log(err)
      const sqlSearch = "SELECT * FROM accounts WHERE username = ?"
      const search_query = mysql.format(sqlSearch, [username])
      const sqlInsert = "INSERT INTO accounts VALUES (?,?,?,'1')"
      const insert_query = mysql.format(sqlInsert, [username, hashedPassword, email])
      await connection.query(search_query, [username, hashedPassword, email], async (err1, result) => {
        if (err1) console.log(err1)

        if (result.length != 0) {
          //connection.release()

          res.status(200).send("user Exist")
        } else {
          await connection.query(insert_query, (err2, result1) => {
            //
            if (err2) console.log(err2)

            res.status(200).send("Success")
            connection.release()
          })
        }
      }) //end of connection.query()
    })
  } //end of db.getConnection()
}
exports.updatePassword = (req, res) => {
  const password = req.body.password
  console.log(req.body.username)
  const username = req.body.username
  const errors = validationResult(req)
  //const token = req.session.JWT
  dbConnect.getConnection(async (err, connection) => {
    if (err) console.log(err)
    if (!errors.isEmpty()) {
      res.status(401).send(errors)
    } else {
      const hashedPassword = await bcrypt.hash(password, 10)
      const updateSql = "UPDATE accounts SET password = ? WHERE username = ?"
      // const newEmailSql = "SELECT email FROM accounts WHERE username = ?"
      await connection.query(updateSql, [hashedPassword, username], (error, results) => {
        if (err) console.log(err)
        else {
          res.status(200).send("updated")
        }
      })
      // await connection.query(newEmailSql, [username], (error, results) => {
      //   //res.render("details", { email: results[0].email, username: username })
      //   res.json({ username, email })
      // })
    }
  })
}
exports.updateEmail = (req, res) => {
  const email = req.body.email
  console.log(req.body.username)
  const username = req.body.username
  const errors = validationResult(req)
  //const token = req.session.JWT
  dbConnect.getConnection(async (err, connection) => {
    if (err) console.log(err)
    if (!errors.isEmpty()) {
      res.status(401).send(errors)
    } else {
      const updateSql = "UPDATE accounts SET email = ? WHERE username = ?"
      // const newEmailSql = "SELECT email FROM accounts WHERE username = ?"
      await connection.query(updateSql, [email, username], (error, results) => {
        if (err) console.log(err)
        else {
          //res.json({ username })
          // const accessToken = jwt.sign({ username }, process.env.ACCESS_TOKEN_SECRET)
          res.status(200).send("updated")
          // res.json({ accessToken })
          // res.send(results)
        }
      })
      // await connection.query(newEmailSql, [username], (error, results) => {
      //   //res.render("details", { email: results[0].email, username: username })
      //   res.json({ username, email })
      // })
    }
  })
}
exports.activationStatus = (req, res) => {
  console.log(req.body.username)
  const username = req.body.username
  const status = req.body.status
  const errors = validationResult(req)
  //const token = req.session.JWT
  dbConnect.getConnection(async (err, connection) => {
    if (err) console.log(err)
    if (!errors.isEmpty()) {
      return res.send(errors)
    } else {
      const updateSql = "UPDATE accounts SET status = ? WHERE username = ?"
      // const newEmailSql = "SELECT email FROM accounts WHERE username = ?"
      await connection.query(updateSql, [status, username], (error, results) => {
        if (err) console.log(err)
        else {
          console.log(status)
          console.log(username)
          //res.json({ username })
          // const accessToken = jwt.sign({ username }, process.env.ACCESS_TOKEN_SECRET)

          // res.json({ accessToken })
          // res.send(results)
          if (status == 1) {
            res.status(200).send("activate")
          }
          if (status == 0) {
            res.status(401).send("Disable")
          }
        }
      })
      // await connection.query(newEmailSql, [username], (error, results) => {
      //   //res.render("details", { email: results[0].email, username: username })
      //   res.json({ username, email })
      // })
    }
  })
}
exports.appPermission = (req, res) => {
  const appname = req.body.appname
  console.log(1)
  dbConnect.query("SELECT * FROM application WHERE App_Acronym=?", [appname], (err, data) => {
    if (err) {
      console.log(err)
    }

    res.send(data)
  })
}
exports.checkGroup = (req, res) => {
  console.log(2)
  const username = req.body.username
  const usergroup = req.body.usergroup
  const errors = validationResult(req)

  dbConnect.getConnection(async (err, connection) => {
    if (err) console.log(err)
    const sqlSearch_grp = " SELECT * FROM usergroups WHERE username=? AND usergroup=? "
    connection.query(sqlSearch_grp, [username, usergroup], (err1, result) => {
      if (err1) console.log(err1)

      if (result.length > 0) {
        res.status(200).send(result[0].usergroup)
        connection.release()

        // return res.json({ inGroup: true })
      } else {
        res.status(200).send("none")
        connection.release()
      }
    })
  })
}

exports.createGroup = (req, res) => {
  const usergroup = req.body.groupname
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors)
    return res.send(errors)
  } else {
    dbConnect.getConnection(async (err, connection) => {
      if (err) console.log(err)
      const sqlSearch = "SELECT * FROM  usergroups WHERE usergroup=?"
      const search_query = mysql.format(sqlSearch, [usergroup])
      const sqlInsert = "INSERT INTO usergroups VALUES (?,'-')"
      await connection.query(search_query, [usergroup], async (err, result) => {
        if (err) console.log(err)
        if (result.length != 0) {
          res.status(401).send("group exists")
        } else {
          await connection.query(sqlInsert, [usergroup], (err, result) => {
            if (err) console.log(err)

            res.status(200).send("Created new group")
            connection.release()
          })
        }
      })
    })
  }
}
exports.allGroup = (req, res) => {
  dbConnect.query("SELECT DISTINCT usergroup FROM usergroups", (err, data) => {
    if (err) {
      console.log(err)
    }
    // rows fetch

    res.send(data)
    // res.json(data)
  })
}
exports.addToGroup = (req, res) => {
  const usergroup = req.body.usergroup
  let users = req.body.username
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors)
    return res.send(errors)
  } else {
    dbConnect.getConnection(async (err, connection) => {
      if (err) console.log(err)
      let sqlAdd = "INSERT INTO nodelogin.usergroups (`usergroup`,`username`) VALUES"
      for (let i = 0; i < users.length; i++) {
        sqlAdd = sqlAdd + `("${usergroup}","${users[i]}"),`
      }
      sqlAdd = sqlAdd.substring(0, sqlAdd.length - 1)
      await connection.query(sqlAdd, (err, result) => {
        if (err) {
          console.log(err)
        } else {
          res.send("done")
        }
      })
    })
  }
}
exports.loadTask = (req, res) => {
  let taskname = req.body.taskname
  let appname = req.body.appname

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors)
    return res.send(errors)
  } else {
    dbConnect.getConnection(async (err, connection) => {
      if (err) console.log(err)
      let sqlTask = "SELECT * FROM task WHERE Task_name=? AND Task_app_Acronym=?"
      await connection.query(sqlTask, [taskname, appname], (err, result) => {
        if (err) {
          console.log(err)
        } else {
          res.status(200).send(result)
          connection.release()
        }
      })
    })
  }
}

exports.pushToDo = (req, res) => {
  let date_ob = new Date()
  let date = ("0" + date_ob.getDate()).slice(-2)
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2)
  let year = date_ob.getFullYear()
  console.log(year + "/" + month + "/" + date)
  let hours = date_ob.getHours()
  let minutes = date_ob.getMinutes()
  let seconds = date_ob.getSeconds()
  let currentDate = year + "/" + month + "/" + date + " " + hours + ":" + minutes + ":" + seconds

  const appname = req.body.appname
  const taskname = req.body.taskname
  const username = req.body.username
  let tasknotes = req.body.tasknotes
  let status = req.body.status
  let planname = req.body.planname

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors)
    return res.send(errors)
  } else {
    dbConnect.getConnection(async (err, connection) => {
      if (err) console.log(err)
      let sqlSearch = `SELECT * FROM task WHERE Task_app_Acronym="${appname}" AND Task_name="${taskname}"`
      await connection.query(sqlSearch, async (err1, result1) => {
        if (err1) console.log(err1)

        let sqlUpdate = `UPDATE task SET Task_plan="${planname}" ,Task_owner="${username}", Task_notes="${"user:" + username + " notes:" + tasknotes + " " + currentDate + " state:" + status + "\n\n" + result1[0].Task_notes + "\n"}",Task_state="${status}" WHERE Task_name="${taskname}" AND Task_app_Acronym="${appname}" `

        if (result1[0].Task_state != status) {
          await connection.query(sqlUpdate, async (err2, result2) => {
            if (err2) console.log(err2)
            else {
              if (status === "done") {
                let creator = result1[0].Task_creator
                let taskowner = result1[0].Task_owner
                let taskdone = result1[0].Task_name
                console.log(creator)
                sqlEmail = "SELECT * FROM accounts WHERE username=?"
                await connection.query(sqlEmail, [creator], async (err3, result3) => {
                  if (err3) console.log(err3)
                  else {
                    let creatorEmail = result3[0].email
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
                      to: creatorEmail, // list of receivers
                      subject: "Done", // Subject line
                      text: `${taskowner} sent ${taskdone} to done` // plain text body
                    })
                  }
                })
              }
              res.status(200).send("updated")
            }
          })
        } else {
          res.status(200).send("No!")
        }
      })
    })
  }
}
exports.updateTask = (req, res) => {
  let date_ob = new Date()
  // current date
  // adjust 0 before single digit date
  let date = ("0" + date_ob.getDate()).slice(-2)
  // current month
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2)
  // current year
  let year = date_ob.getFullYear()
  // prints date in YYYY-MM-DD format
  console.log(year + "/" + month + "/" + date)
  // current hours
  let hours = date_ob.getHours()
  // current minutes
  let minutes = date_ob.getMinutes()
  // current seconds
  let seconds = date_ob.getSeconds()
  let currentDate = year + "/" + month + "/" + date + " " + hours + ":" + minutes + ":" + seconds
  console.log(currentDate)
  const appname = req.body.appname
  const taskdescription = req.body.currentDescription
  const taskname = req.body.currentTask
  const username = req.body.username
  let tasknotes = req.body.tasknotes
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    console.log(errors)
    return res.send(errors)
  } else {
    dbConnect.getConnection(async (err, connection) => {
      if (err) console.log(err)
      let sqlSearch = `SELECT * FROM task WHERE Task_app_Acronym="${appname}" AND Task_name="${taskname}"`
      await connection.query(sqlSearch, async (err1, result1) => {
        if (err1) console.log(err1)

        let sqlUpdate = `UPDATE task SET Task_description="${taskdescription.replace(/["']/g, "")}", Task_owner="${username}",Task_notes="${"user:" + username + " notes:" + tasknotes + " " + currentDate + " state:open\n" + result1[0].Task_notes + "\n"}"  WHERE Task_name="${taskname}" AND Task_app_Acronym="${appname}" `
        await connection.query(sqlUpdate, async (err2, result2) => {
          if (err2) console.log(err2)
          res.status(200).send("updated")
        })
      })
    })
  }
}
exports.taskStatus = (req, res) => {
  let appname = req.body.appname
  let id = req.body.id
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors)
    return res.send(errors)
  } else {
    dbConnect.getConnection(async (err, connection) => {
      let sqlStatus = "SELECT Task_state FROM task WHERE id=? "
      await connection.query(sqlStatus, [id], async (err1, result1) => {
        if (err1) console.log(err1)
        res.status(200).send(result1)
      })
    })
  }
}
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
exports.loadPlan = (req, res) => {
  const appname = req.body.appname
  console.log(4)
  dbConnect.query("SELECT * FROM plan WHERE App_Acronym=?", [appname], (err, data) => {
    if (err) {
      console.log(err)
    }
    // rows fetch

    res.status(200).send(data)
  })
}

exports.loadTaskOpen = (req, res) => {
  let appname = req.body.appname
  dbConnect.query("SELECT * FROM task WHERE Task_state='open' AND Task_app_Acronym=?", [appname], (err, result) => {
    if (err) {
      console.log(err)
    } else {
      res.status(200).send(result)
    }
  })
}
exports.assignPlan = (req, res) => {
  let date_ob = new Date()
  // current date
  // adjust 0 before single digit date
  let date = ("0" + date_ob.getDate()).slice(-2)
  // current month
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2)
  // current year
  let year = date_ob.getFullYear()
  // prints date in YYYY-MM-DD format
  console.log(year + "/" + month + "/" + date)
  // current hours
  let hours = date_ob.getHours()

  // current minutes
  let minutes = date_ob.getMinutes()

  // current seconds
  let seconds = date_ob.getSeconds()
  let currentDate = year + "/" + month + "/" + date + " " + hours + ":" + minutes + ":" + seconds
  console.log(currentDate)

  let planname = req.body.planname
  // let id = req.body.id
  let appname = req.body.appname
  let notes = []
  let state = []
  let tasknotes = req.body.tasknotes
  let username = req.body.username
  let taskname = req.body.taskname

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(500).send(errors)
  } else {
    dbConnect.getConnection(async (err, connection) => {
      if (err) console.log(err)
      sqlSearch = "SELECT * FROM task WHERE Task_name=? "
      //settle result
      connection.query(sqlSearch, [taskname], async (err, result) => {
        if (err) {
          console.log(err)
        } else {
          notes = result[0].Task_notes
          state = result[0].Task_state
          sqlAssign = `UPDATE task SET Task_plan = "${planname}", Task_notes= "${"user:" + username + " notes:" + tasknotes + " " + currentDate + " state:open\n\n" + result[0].Task_notes + "\n"}" WHERE Task_name = "${taskname}" AND Task_app_Acronym = "${appname}"`
          if (result[0].Task_state === "open") {
            connection.query(sqlAssign, async (err2, result2) => {
              if (err2) console.log(err2)
              else {
                console.log(result2)
                res.status(200).send("updated")
                connection.release()
              }
            })
          } else {
            res.status(200).send("No!")
            connection.release()
          }
        }
      })
    })
  }
}
exports.createPlan = (req, res) => {
  let planname = req.body.planname
  let planStartDate = req.body.planStartDate
  let planEndtDate = req.body.planEndDate
  let appname = req.body.appname
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors)
    return res.send(errors)
  } else {
    dbConnect.getConnection(async (err, connection) => {
      if (err) console.log(err)
      let sqlPlan = "INSERT INTO `nodelogin`.`plan` (`Plan_MVP_name`, `Plan_startDate`, `Plan_endDate`, `App_Acronym`) VALUES (?,?,?,?)"
      let sqlSearch = "SELECT Plan_MVP_name FROM plan WHERE App_Acronym=? AND Plan_MVP_name=? "
      await connection.query(sqlSearch, [appname, planname], async (err1, result1) => {
        if (err1) console.log(err1)
        if (result1.length != 0) {
          res.status(200).send("exist")
        } else {
          await connection.query(sqlPlan, [planname, planStartDate, planEndtDate, appname], (err2, result2) => {
            if (err) {
              console.log(err)
            } else {
              res.status(200).send("done")
            }
          })
        }
      })
    })
  }
}
exports.createApp = (req, res) => {
  const appname = req.body.appname
  let description = req.body.description
  let rnumber = req.body.rnumber
  let startDate = req.body.startDate
  let endDate = req.body.endDate
  let create = req.body.create
  let open = req.body.open
  let todo = req.body.todo
  let doing = req.body.doing
  let done = req.body.done

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors)
    res.send(errors)
  } else {
    dbConnect.getConnection((err, connection) => {
      if (err) console.log(err)
      let sqlSearch = "SELECT * FROM application WHERE App_Acronym=?"
      let sqlAdd = `INSERT INTO application (App_Acronym,App_Description,App_Rnumber, App_startDate,App_endDate,App_permit_Create,App_permit_Open,App_permit_toDoList,App_permit_Doing,App_permit_Done) VALUES("${appname}","${description.replace(/["']/g, "")}","${rnumber}","${startDate}","${endDate}","${create}","${open}","${todo}","${doing}","${done}")`
      // sqlAdd += `("${appname}","${description}","${rnumber}","${startDate}","${endDate}","${create}","${open}","${todo}","${doing}","${done}")`

      connection.query(sqlSearch, [appname], (err1, result1) => {
        if (err1) console.log(err1)
        if (result1.length != 0) {
          res.status(200).send("exist")
        } else {
          connection.query(sqlAdd, (err, result) => {
            if (err) {
              console.log(err)
            } else {
              res.status(200).send("done")
            }
          })
        }
      })
    })
  }
}
exports.editGroup = (req, res) => {
  const appname = req.body.appname
  const description = req.body.description
  let create = req.body.create
  let open = req.body.open
  let todo = req.body.todo
  let doing = req.body.doing
  let done = req.body.done
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors)
    return res.send(errors)
  } else {
    dbConnect.getConnection(async (err, connection) => {
      if (err) console.log(err)
      let sqlUpdate = "UPDATE application SET "
      sqlUpdate += `App_Description ="${description.replace(/["']/g, "")}", App_permit_Create ="${create}", App_permit_Open ="${open}", App_permit_toDoList ="${todo}", App_permit_Doing ="${doing}", App_permit_Done ="${done}" WHERE (App_Acronym = "${appname}")`
      console.log(sqlUpdate)
      await connection.query(sqlUpdate, async (err, result) => {
        if (err) console.log(err)
        else {
          res.status(200).send("updated")
        }
      })
    })
  }
}
exports.getOneApp = (req, res) => {
  const appname = req.body.appname
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors)
    return res.send(errors)
  } else {
    dbConnect.getConnection(async (err, connection) => {
      if (err) console.log(err)
      sqlLoad = "SELECT * FROM application WHERE App_Acronym=?"
      await connection.query(sqlLoad, [appname], async (err, result) => {
        if (err) console.log(err)
        else {
          res.status(200).send(result)
        }
      })
    })
  }
}
exports.findOnePlan = (req, res) => {
  let planname = req.body.planname
  let appname = req.body.appname
  dbConnect.query("SELECT * FROM plan WHERE Plan_MVP_name=?", [planname, appname], (err, data) => {
    if (err) console.log(err)

    res.status(200).send(data)
  })
}
exports.findAllApp = (req, res) => {
  console.log(5)
  dbConnect.query("SELECT * FROM application", (err, data) => {
    if (err) {
      console.log(err)
    }

    res.send(data)
    // res.json(data)
  })
}
exports.getreQuest = (req, res) => {
  res.send("okay")
}
exports.findAllTask = (req, res) => {
  console.log(3)
  const appname = req.body.appname
  dbConnect.query("SELECT * FROM task WHERE Task_app_Acronym=?", [appname], (err, data) => {
    if (err) {
      console.log(err)
    }
    // rows fetch

    res.status(200).send(data)
    // res.json(data)
  })
}
exports.userInGroup = (req, res) => {
  const usergroup = req.body.usergroup
  dbConnect.query("SELECT * FROM accounts WHERE `username` IN (SELECT `username` FROM  usergroups WHERE `usergroup`=?)", [usergroup], (err, data) => {
    if (err) {
      console.log(err)
    }
    res.send(data)
  })
}
exports.deleteFromGroup = (req, res) => {
  const usergroup = req.body.usergroup
  const username = req.body.username
  dbConnect.query("DELETE FROM `nodelogin`.`usergroups` WHERE (`usergroup` = ?) and (`username` = ?)", [usergroup, username], (err, data) => {
    if (err) {
      console.log(err)
    }
    res.send(data)
  })
}
