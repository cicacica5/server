// Imports
const express = require("express"); // Create router
const bcrypt = require("bcryptjs"); // Encrypt password
const jwt = require("jsonwebtoken"); // Authorization
const config = require("config"); // Global variables
const auth = require("../middleware/auth"); // Middleware
const { check, validationResult } = require("express-validator"); // Check and validate the inputs
const promisePool = require("../config/db"); // Import instance of mysql pool
const genTestUserSig = require('../SDK/GenUserSig')

// Init router
const router = express.Router();

// Endpoints
/**
 * 注册访客
 * 获取当前访客信息
 * 授权用户登录
 * 修改访客信息
 * 获取访客咨询记录列表
 * 获取咨询师列表
 * 修改咨询师状态
 * 获取某咨询师状态
 * 添加评分和评价
 */

// @route   POST /wx-users/register
// @desc    注册访客
// @access  Public
router.post(
  "/register", [
  check("user_name", "Username length is 2-32").isLength({max:32, min:2}), // Check the username
  check(
    "user_password",
    "Please enter a password with 6 or more characters"
  ).isLength({ min: 6 }), // Check the password
  check("visitor_phone",
    "Please enter phone number with 11 nums.").isLength(11), // Check the phone
],
  async (req, res) => {
    // Check for errorsy
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return the errors
      return res.status(400).json({ errors: errors.array() });
    }

    // Extract info from the body
    let {
      user_name,
      user_password,
      visitor_phone,
    } = req.body;

    // Check user_name
    var reg_userN = /^[a-zA-Z_]+$/;
    if(!reg_userN.test(user_name)){
      return res.status(200).json(
        {
          "errCode": 10,
          "errMessage": "用户名非法（只允许包含字母及下划线）"
      });
    }

    // Check phone
    var reg_ph = /^1[0-9]{10}/;
    if(!reg_ph.test(visitor_phone)){
      return res.status(200).json(
        {
          "errCode": 11,
          "errMessage": "手机号非法"
      });
    }

    try {
      // Check if user exists
      const [rows] = await promisePool.query(
        `SELECT EXISTS(SELECT * from login WHERE user_name = "${user_name}" ) "EXISTS" FROM dual`
      );
      const result = rows[0].EXISTS;

      if (result) {
        // User already exists
        return res.status(200).json(
          {
            "errCode": 2,
            "errMessage": "用户名已存在！"
          });
      } else {
        // Encrypt Password
        const salt = await bcrypt.genSalt(10);
        user_password = await bcrypt.hash(user_password, salt);



        // Add user details in the DB
        await promisePool.query(
          `INSERT INTO login (user_name, user_password, role) VALUES ("${user_name}", "${user_password}", "visitor")`
        );

        // Create payload for token
        const payload = {
          id: 0,
        };

        // Get user id
        const [rows] = await promisePool.query(
          `SELECT user_id from login WHERE user_name='${user_name}'`
        );

        // Store user id in payload for token
        const user_id = rows[0].user_id;
        payload.id = user_id;

        // Add student details in the DB
        await promisePool.query(
          `INSERT INTO visitor (visitor_id, visitor_phone, visitor_status) VALUES (${user_id},"${visitor_phone}", "normal")`
        );

        // Create a token
        const token = jwt.sign(payload, config.get("jwtSecret"), { expiresIn: 21600, });

        // Create an httpOnly cookie
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV !== "development", maxAge: 6 * 60 * 60 * 1000 });

        // Send success message to the client
        return res.status(200).json(
          {
            "errCode": 0,
            "errMessage": "成功"
          });
      }
    } catch (err) {
      // Catch errors
      throw err;
    }
  }
);

// @route   GET /wx-users/getVisitorInfo
// @desc    获取当前访客信息
// @access  Private
router.get(
  "/getVisitorInfo",
  async (req, res) => {
    // Extract user id from req
    const user_name = req.query.user_name;

    try {
      // Get user_name and role from DB
      const [rows] = await promisePool.query(
        `SELECT user_id, role from login WHERE user_name='${user_name}'`
      );

      // Extract user_email and role from rows
      const { user_id, role } = rows[0];

      // Create user object
      let user = {
        user_id,
        user_name,
        role,
      };

      // Check the role
      if (role === "visitor") {
        // Get visitor details from the DB
        const [rows] = await promisePool.query(
          `SELECT visitor_name, visitor_gender, visitor_phone, visitor_avatar, emergency_name, emergency_phone from visitor WHERE visitor_id='${user_id}'`
        );

        // Extract the details in variables
        const {
          visitor_name,
          visitor_gender,
          visitor_phone,
          visitor_avatar,
          emergency_name,
          emergency_phone
        } = rows[0];

        // Store the details in the user object
        user = {
          ...user,
          visitor_name,
          visitor_gender,
          visitor_phone,
          visitor_avatar,
          emergency_name,
          emergency_phone
        };
        // Send user object to the client
        return res.status(200).json({
          code: 0,
          visitorInfo: user
        });
      } else {
        return res.status(200).json({
          errCode: 11,
          errMessage: "未查询到相关信息。"
        });
      }
    } catch (err) {
      // Catch errors
      throw err;
    }
  }
);

// @route   POST /wx-users/login
// @desc    授权用户登录
// @access  Public
router.post(
  "/login", [
  check("user_name", "user_name is required").notEmpty(), // Check user_name
  check("user_password", "user_password is required").exists(), // Check user_password
],
  async (req, res) => {
    // Check if there are errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return the errors
      return res.status(400).json({ errors: errors.array() });
    }

    // Extract userEmail and password from the body
    const userName = req.body.user_name;
    const password = req.body.user_password;

    try {
      // Check if the user exists
      const [existence] = await promisePool.query(
        `SELECT EXISTS(SELECT * from login WHERE user_name= "${userName}" ) 'EXISTS' FROM dual`
      );
      // Extract the bool
      const result = existence[0].EXISTS;

      // Check if result is false
      if (!result) {
        // User doesn't exist
        return res.status(200).json({ errCode: 8, errMessage: "用户名或密码错误。" });
      } else {
        // Get user details from DB
        const [rows] = await promisePool.query(
          `SELECT * from login WHERE user_name='${userName}'`
        );

        // Extract the user_id and user_password from the rows
        const { user_id, user_password } = rows[0];

        // Check the password
        const isMatch = await bcrypt.compare(password, user_password);

        if (!isMatch) {
          // Password doesn't match
          return res.status(200).json({ errCode: 8, errMessage: "用户名或密码错误。" });
        } else {
          // Check if visitor is banned.
          const [row] = await promisePool.query(
            `SELECT visitor_status from visitor WHERE visitor_id='${user_id}'`
          );
          const status = row[0].visitor_status;
          console.log(status);
          if(status == "banned"){
            console.log("用户已被禁用");
            return res.status(200).json({ errCode: 15, errMessage: "用户已被禁用。" });
          }

          // Store user_id in payload for token
          const payload = {
            id: user_id,
          };

          // Create a token
          const token = jwt.sign(payload, config.get("jwtSecret"), { expiresIn: 21600, });

          // Store the token in an httpOnly cookie
          res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV !== "development", maxAge: 6 * 60 * 60 * 1000 });

          // Send success message to client
          return res.status(200).json({ errCode: 0, errMessage: "登录成功。" });
          // res.send("Logged in");
        }
      }
    } catch (err) {
      // Catch errors
      throw err;
    }
  }
);

// @route   PUT /wx-users/editInfo
// @desc    修改访客信息
// @access  Private
router.put(
  "/editInfo", [
  check("user_name", "user_name is required").notEmpty(), // Check the user_name
  check("visitor_name", "visitor_name is required").notEmpty(), // Check the visitor_name
  check("visitor_phone",
    "Please enter phone number with 11 nums.").isLength(11), // Check the phone

],
  async (req, res) => {

    try {
      // Check for errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Return the errors
        return res.status(400).json({ errors: errors.array() });
      }

      // Extract info from the body
      let {
        user_name,
        visitor_name,
        visitor_phone,
        visitor_gender,
        visitor_avatar, // 头像url
        emergency_name, // 紧急联系人
        emergency_phone,// 紧急联系人电话
      } = req.body;

      // Use user_name select id
      const [rows] = await promisePool.query(
        `SELECT user_id from login WHERE user_name = "${user_name}"`
      );
      const user_id = rows[0].user_id;

      // Create user object
      let user = {
        user_id,
        user_name,
        visitor_name,
        visitor_gender,
        visitor_phone,
        visitor_avatar, // 头像url
        emergency_name, // 紧急联系人
        emergency_phone,// 紧急联系人电话
      };

      // Check gender
      // gender == null
      if (!visitor_gender) {
        visitor_gender = "Other";
      } else if (
        visitor_gender !== "Male" &&
        visitor_gender !== "Female" &&
        visitor_gender !== "Other"
      ) {
        return res.status(200).json({
          "errCode": 3,
          "errMessage": "性别非法（请填写Male/Female/Other）"
        });
      }

      // Check phone
      var reg_ph1 = /^1[0-9]{10}/;
      if(!reg_ph1.test(visitor_phone)){
        return res.status(200).json(
          {
            "errCode": 11,
            "errMessage": "手机号非法"
        });
      }

      // Check visitor_name
      var reg_name1 = /^[^\\;!@#$%\^&\*\(\)￥……（）]{2,32}$/;
      if(!reg_name1.test(visitor_name)){
            return res.status(200).json({
              "errCode": 12,
              "errMessage": "visitor_name非法"
            });
      }

      // Check emergency_phone
      var reg_ph2 = /^1[0-9]{10}/;
      if(!reg_ph2.test(emergency_phone)){
        return res.status(200).json(
          {
            "errCode": 11,
            "errMessage": "手机号非法"
        });
      }

      // Check emergency_name
      var reg_name2 = /^[^\\;!@#$%\^&\*\(\)￥……（）]{2,32}$/;
      if(!reg_name2.test(emergency_name)){
            return res.status(200).json({
              "errCode": 12,
              "errMessage": "紧急联系人名字非法"
            });
      }

      try {
        // Update details in students table
        await promisePool.query(
          `UPDATE visitor SET visitor_name='${visitor_name}',
                    visitor_phone='${visitor_phone}',
                    visitor_gender='${visitor_gender}',
                    visitor_avatar='${visitor_avatar}',
                    emergency_name='${emergency_name}',
                    emergency_phone='${emergency_phone}'
                    WHERE visitor_id=${user_id}`
        );

        return res.status(200).json({
          "errCode": 0,
          "errMessage": "成功"
        });
      } catch (err) {
        // Catch errors
        throw err;
      }
    } catch (err) {
      // Catch errors
      throw err;
    }
  }
);

// @route   GET /wx-users/record/getConsultList
// @desc    获取访客咨询记录列表
// @access  Public
router.get(
  "/record/getConsultList",
  async (req, res) => {
    // Extract userEmail and password from the body
    const user_name = req.query.user_name;

    const [rows] = await promisePool.query(
      // `SELECT record.record_id, record.coun_id, counsellor.coun_name, counsellor.coun_status, record.begin_time, record.end_time, record.period, feedback.score FROM record JOIN login JOIN counsellor JOIN feedback WHERE login.user_name = "${user_name}" AND record.visitor_id = login.user_id AND record.coun_id = counsellor.coun_id AND record.record_id = feedback.record_id AND record.visitor_id = feedback.user_id`
      `SELECT record_id, record.visitor_id, visitor.visitor_name, record.coun_id, counsellor.coun_name, login.user_name AS uname,
              begin_time, end_time, period, score, vis_to_coun_comment, coun_to_vis_comment,
              coun_gender, coun_phone, coun_status, coun_avatar
       FROM record JOIN feed ON record.record_id = feed.feed_id
                   INNER JOIN visitor ON record.visitor_id = visitor.visitor_id
                   LEFT JOIN supervisor ON record.sup_id = supervisor.sup_id
                   INNER JOIN counsellor ON record.coun_id = counsellor.coun_id
                   LEFT JOIN login ON login.user_id = record.coun_id
       WHERE record.visitor_id = (SELECT user_id FROM login WHERE user_name = "${user_name}")
       ORDER BY record_id DESC
      `);

    try {
      // Check if record exists
      const result = rows[0];
      if (result == undefined) {
        // Schedule already exists
        return res.status(200).json({
          "errCode": 4,
          "errMessage": "该用户暂无咨询记录"
        });
      } else {
    //     // Send success message to the client
        return res.status(200).json({
            "code": 0,
            "consultList": rows
        });
      }
    } catch (err) {
      // Catch errors
      throw err;
    }
  }
);

// @route   GET /wx-users/getCounsellorList
// @desc    获取咨询师列表
// @access  Public
router.get(
  "/getCounsellorList",
  async (req, res) => {

    const [rows] = await promisePool.query(
      `SELECT counsellor.coun_id, counsellor.coun_name, login.user_name AS uname, counsellor.coun_avatar,
              counsellor.coun_status, round(avg(score),2) as coun_avg_score
       FROM counsellor LEFT JOIN feed ON counsellor.coun_id = feed.coun_id
                       LEFT JOIN login ON counsellor.coun_id = login.user_id
       WHERE counsellor.coun_status = "free" OR counsellor.coun_status = "busy"
       GROUP BY counsellor.coun_id`
    );

    try {
      // Check if record exists
      const result = rows[0];
      if (result == undefined) {
        // Schedule already exists
        return res.status(200).json({
          "errCode": 5,
          "errMessage": "当前无咨询师"
        });
      } else {
    //     // Send success message to the client
        return res.status(200).json({
            "code": 0,
            "counsellorList": rows
        });
      }
    } catch (err) {
      // Catch errors
      throw err;
    }
  }
);

// @route   PUT /wx-users/changeCounsellorStauts
// @desc    修改咨询师状态
// @access  Private
router.put(
  "/changeCounsellorStauts",
  async (req, res) => {

    try {
      // Check for errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Return the errors
        return res.status(400).json({ errors: errors.array() });
      }

      // Extract info from the body
      let {
        coun_id,
        coun_status
       } = req.body;

      // Check status
      if (
        coun_status !== "offline" &&
        coun_status !== "free" &&
        coun_status !== "busy"
      ) {
        return res.status(200).json({
          "Code": 6,
          "Message": "coun_status非法，请从offline/free/busy中选择"
        });
      }

      try {
        // Update coun_status in counsellor table
        await promisePool.query(
          `UPDATE counsellor SET coun_status='${coun_status}'
                    WHERE coun_id=${coun_id}`
        );

        return res.status(200).json({
          "Code": 0,
          "Message": "成功"
        });
      } catch (err) {
        // Catch errors
        throw err;
      }
    } catch (err) {
      // Catch errors
      throw err;
    }
  }
);

// @route GET /wx-users/schedule/getCounsellorStatus
// @desc  获取某咨询师状态
// @access  Public
router.get(
  "/schedule/getCounsellorStatus",
  async (req, res) => {
    const coun_id = req.query.coun_id;

    try {
      const [rows] = await promisePool.query(
        `SELECT coun_status FROM counsellor WHERE coun_id = ${coun_id}`
      );
      const row = rows[0];

      if (row == undefined) {
        return res.status(200).json({
          "errCode": 9,
          "errMessage": "该咨询师不存在"
        });
      } else {
        return res.status(200).json({
          "code": 0,
          "coun_status": row.coun_status
        });
      }
    } catch (err) {
      throw err;
    }
  }
  );

// @route   PUT /wx-users/addFeedbackScore
// @desc    添加评分和评价
// @access  Public
router.put(
  "/addFeedbackScore",[
    check("record_id", "record_id is required").notEmpty(), // Check the record_id
    check("visitor_id", "visitor_id is required").notEmpty(), // Check the visitor_id
    check("coun_id", "coun_id is required").notEmpty(), // Check the coun_id
    check("score", "score is required").notEmpty(), // Check the score
  ],
  async (req, res) => {

    try {
      // Check for errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Return the errors
        return res.status(400).json({ errors: errors.array() });
      }

      // Extract info from the body
      let {
        record_id,
        visitor_id,
        coun_id,
        score,
        vis_to_coun_comment,
       } = req.body;

      try {
        // Check if record exists
        const [rows] = await promisePool.query(
          `SELECT * FROM feed WHERE feed_id = "${record_id}"`
      );
      const result = rows[0];

      if (!result) {
        // Insert
        await promisePool.query(
          `INSERT INTO feed(feed_id, visitor_id, coun_id, score, vis_to_coun_comment)
                  VALUES (${record_id}, ${visitor_id}, ${coun_id}, ${score}, "${vis_to_coun_comment}")
          `);
      } else {
          // Update
          await promisePool.query(
            `UPDATE feed SET visitor_id = ${visitor_id}, coun_id = ${coun_id}, score = ${score}, vis_to_coun_comment = "${vis_to_coun_comment}"
             WHERE feed_id = ${record_id}
            `);
      }

        return res.status(200).json({
          "Code": 0,
          "Message": "成功"
        });
      } catch (err) {
        // Catch errors
        throw err;
      }
    } catch (err) {
      // Catch errors
      throw err;
    }
  }
);

module.exports = router;
