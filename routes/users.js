// Imports
const express = require("express"); // Create router
const bcrypt = require("bcryptjs"); // Encrypt password
const jwt = require("jsonwebtoken"); // Authorization
const config = require("config"); // Global variables
const { check, validationResult } = require("express-validator"); // Check and validate the inputs
const promisePool = require("../config/db"); // Import instance of mysql pool

// Init router
const router = express.Router();

// Endpoints
/**
 * 注册管理员
 * 注册咨询师
 * 注册督导
 */

// @route   POST /users/admin
// @desc    注册管理员
// @access  Public, hidden
router.post(
    "/admin", [
      check("user_name", "请填写正确的用户名").isLength({max:32, min:2}), // Check the user_name
      check(
          "user_password",
          "密码需要至少6位"
      ).isLength({ min: 6 }), // Check the password
      check("role", "Role is required").notEmpty(), // Check the role
      check("admin_name", "请填写姓名").notEmpty(), // Check the admin_name
      check("admin_gender", "请填写性别").notEmpty(), // Check the gender
      check("admin_phone", "手机号不正确").isLength(11), // Check the phone
    ],
    async(req, res) => {
      // Check for errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Return the errors
        return res.status(400).json({ errors: errors.array() });
      }

      // Extract info from the body
      let {
        user_name,
        user_password,
        role,
        admin_name,
        admin_gender,
        admin_phone,
      } = req.body;

      // Check role
      if (role !== "admin") {
        return res.status(400).json({ msg: "Role is not valid" });
      }

      // Check gender
      if (
          admin_gender !== "Male" &&
          admin_gender !== "Female" &&
          admin_gender !== "Other"
      ) {
        return res.status(400).json({ msg: "Gender is not valid" });
      }

      // Check admin_name
      var reg_name = /^[^\\;!@#$%\^&\*\(\)￥……（）]{2,32}$/;
      if(!reg_name.test(admin_name)){
        return res.status(400).json({ msg: "姓名不合法"});
      }
      // Check user_name
      var reg_userN = /^[a-zA-Z_]+$/;
      if(!reg_userN.test(user_name)){
        return res.status(400).json({ msg: "用户名不合法"});
      }

      // Check phone
      var reg_ph = /^1[0-9]{10}/;
      if(!reg_ph.test(admin_phone)){
        return res.status(400).json({ msg: "手机号不合法" });
      }

      try {
        // Check if user exists
        const [rows] = await promisePool.query(
            `SELECT EXISTS(SELECT * from login WHERE user_name = "${user_name}" ) "EXISTS" FROM dual`
        );
        const result = rows[0].EXISTS;

        if (result) {
          // User already exists
          return res.status(400).json({ msg: "User already exists" });
        } else {
          // Encrypt Password
          const salt = await bcrypt.genSalt(10);
          user_password = await bcrypt.hash(user_password, salt);

          // Add user details in the DB
          await promisePool.query(
              `INSERT INTO login (user_name, user_password, role) VALUES ("${user_name}", "${user_password}", "${role}")`
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

          // Add admin details in the DB
          await promisePool.query(
              `INSERT INTO admin (admin_id, admin_name, admin_gender, admin_phone) VALUES (${user_id},"${admin_name}", "${admin_gender}", "${admin_phone}")`
          );

          // Create a token
          const token = jwt.sign(payload, config.get("jwtSecret"), { expiresIn: 21600, });

          // Create an httpOnly cookie
          res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV !== "development", maxAge: 6 * 60 * 60 * 1000 });

          // Send success message to the client
          res.send("Logged in");
        }
      } catch (err) {
        // Catch errors
        throw err;
      }
    }
);

// @route   POST /users/counsellor
// @desc    注册咨询师
// @access  Public
router.post(
    "/counsellor", [
      check("user_name", "请填写正确的用户名").isLength({max:32, min:2}), // Check the username
      check("user_password","密码需要至少6位").isLength({ min: 6 }), // Check the password
      check("role", "Role is required.").notEmpty(), // Check the role
      check("coun_name", "请填写姓名").notEmpty(), // Check the coun_name
      check("coun_gender", "请填写性别").notEmpty(), // Check the gender
      check("coun_phone", "手机号不正确").isLength(11), // Check the phone
      check("coun_age", "请填写正确的年龄").isInt(), // Check the age
      check("coun_email", "请填写正确的邮箱地址").isEmail(), // Check the email
      check("coun_company", "请填写工作单位").notEmpty(), // check the company
      check("coun_title", "请填写职称").notEmpty(), // Check the title
      check("coun_identity", "身份证号不正确").isLength(18) // Check the identity
    ],
    async(req, res) => {
      // Check for errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Return the errors
        return res.status(400).json({ errors: errors.array() });
      }

      // Extract info from the body
      let {
        user_name,
        user_password,
        role,
        coun_name,
        coun_gender,
        coun_phone,
        coun_age,
        coun_identity,
        coun_email,
        coun_company,
        coun_title,
      } = req.body;

      // Check role
      if (role !== "counsellor") {
        return res.status(400).json({ msg: "Role is not valid" });
      }

      // Check gender
      if (
          coun_gender !== "Male" &&
          coun_gender !== "Female" &&
          coun_gender !== "Other"
      ) {
        return res.status(400).json({ msg: "性别不合法" });
      }

      // Check identity
      var reg_id = /^[1-9]\d{5}(18|19|20|(3\d))\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
      if(!reg_id.test(coun_identity)){
        return res.status(400).json({ msg: "身份证不合法" });
      }

      // Check phone
      var reg_ph = /^1[0-9]{10}/;
      if(!reg_ph.test(coun_phone)){
          return res.status(400).json({ msg: "手机号不合法" });
      }

      // Check counsellor_name
      var reg_name = /^[^\\;!@#$%\^&\*\(\)￥……（）]{2,32}$/;
      if(!reg_name.test(coun_name)){
        return res.status(400).json({ msg: "姓名不合法"});
      }
      
      // Check user_name
      var reg_userN = /^[a-zA-Z_]+$/;
      if(!reg_userN.test(user_name)){
        return res.status(400).json({ msg: "用户名不合法"});
      }

      try {
        // Check if user exists
        const [rows] = await promisePool.query(
            `SELECT EXISTS(SELECT * from login WHERE user_name = "${user_name}" ) "EXISTS" FROM dual`
        );
        const result = rows[0].EXISTS;

        if (result) {
          // User already exists
          return res.status(400).json({ msg: "User already exists" });
        } else {
          // Encrypt Password
          const salt = await bcrypt.genSalt(10);
          user_password = await bcrypt.hash(user_password, salt);

          // Add user details in the DB
          await promisePool.query(
              `INSERT INTO login (user_name, user_password, role) VALUES ("${user_name}", "${user_password}", "${role}")`
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

          // Add counsellor details in the DB
          await promisePool.query(
              `INSERT INTO counsellor (coun_id, coun_name, coun_gender, coun_phone, coun_status, coun_age, coun_identity, coun_email, coun_company, coun_title, conversation_num) VALUES (${user_id},"${coun_name}", "${coun_gender}", "${coun_phone}", "offline", "${coun_age}", "${coun_identity}", "${coun_email}", "${coun_company}", "${coun_title}", "0")`
          );

          // Create a token
          const token = jwt.sign(payload, config.get("jwtSecret"), { expiresIn: 21600, });

          // Create an httpOnly cookie
          res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV !== "development", maxAge: 6 * 60 * 60 * 1000 });

          // Send success message to the client
          res.send("Logged in");
        }
      } catch (err) {
        // Catch errors
        throw err;
      }
    }
);

// @route   POST /users/supervisor
// @desc    注册督导
// @access  Public
router.post(
    "/supervisor", [
      check("user_name", "请填写正确的用户名").isLength({max:32, min:2}), // Check the username
      check("user_password","密码需要至少6位").isLength({ min: 6 }), // Check the password
      check("role", "Role is required").notEmpty(), // Check the role
      check("sup_name", "请填写姓名").notEmpty(), // Check the sup_name
      check("sup_gender", "请填写性别").notEmpty(), // Check the gender
      check("sup_phone", "手机号不正确").isLength(11), // Check the phone
      check("sup_age", "请填写正确的年龄").isInt(), // Check the age
      check("sup_email", "请填写正确的邮箱地址").isEmail(), // Check the email
      check("sup_company", "请填写工作单位").notEmpty(), // check the company
      check("sup_title", "请填写职称").notEmpty(), // Check the title
      check("sup_identity", "身份证号不正确").isLength(18), // Check the identity
      check("sup_qualification", "请填写资格证书").notEmpty(), // Check the title
      check("sup_quaNumber", "请填写资格编号").notEmpty() // Check the title
    ],
    async(req, res) => {
      // Check for errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Return the errors
        return res.status(400).json({ errors: errors.array() });
      }

      // Extract info from the body
      let {
        user_name,
        user_password,
        role,
        sup_name,
        sup_gender,
        sup_phone,
        sup_age,
        sup_identity,
        sup_email,
        sup_company,
        sup_title,
        sup_qualification,
        sup_quaNumber,
      } = req.body;

      // Check role
      if (role !== "supervisor") {
        return res.status(400).json({ msg: "Role is not valid" });
      }

      // Check gender
      if (
          sup_gender !== "Male" &&
          sup_gender !== "Female" &&
          sup_gender !== "Other"
      ) {
        return res.status(400).json({ msg: "性别不合法" });
      }

      // Check identity
      var reg = /^[1-9]\d{5}(18|19|20|(3\d))\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
      if(!reg.test(sup_identity)){
        return res.status(400).json({ msg: "身份证不合法" });
      }

      // Check phone
      var reg_ph = /^1[0-9]{10}/;
      if(!reg_ph.test(sup_phone)){
        return res.status(400).json({ msg: "手机号不合法" });
      }

      // Check sup_name
      var reg_name = /^[^\\;!@#$%\^&\*\(\)￥……（）]{2,32}$/;
      if(!reg_name.test(sup_name)){
        return res.status(400).json({ msg: "姓名不合法"});
      }
      // Check user_name
      var reg_userN = /^[a-zA-Z_]+$/;
      if(!reg_userN.test(user_name)){
        return res.status(400).json({ msg: "用户名不合法"});
      }

      try {
        // Check if user exists
        const [rows] = await promisePool.query(
            `SELECT EXISTS(SELECT * from login WHERE user_name = "${user_name}" ) "EXISTS" FROM dual`
        );
        const result = rows[0].EXISTS;

        if (result) {
          // User already exists
          return res.status(400).json({ msg: "User already exists" });
        } else {
          // Encrypt Password
          const salt = await bcrypt.genSalt(10);
          user_password = await bcrypt.hash(user_password, salt);

          // Add user details in the DB
          await promisePool.query(
              `INSERT INTO login (user_name, user_password, role) VALUES ("${user_name}", "${user_password}", "${role}")`
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
              `INSERT INTO supervisor (sup_id, sup_name, sup_gender, sup_phone, sup_status, sup_age, sup_identity, sup_email, sup_company, sup_title, sup_qualification, sup_quaNumber, conversation_num) VALUES (${user_id},"${sup_name}", "${sup_gender}", "${sup_phone}", "offline", "${sup_age}", "${sup_identity}", "${sup_email}", "${sup_company}", "${sup_title}", "${sup_qualification}", "${sup_quaNumber}", "0")`
          );

          // Create a token
          const token = jwt.sign(payload, config.get("jwtSecret"), { expiresIn: 21600, });

          // Create an httpOnly cookie
          res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV !== "development", maxAge: 6 * 60 * 60 * 1000 });

          // Send success message to the client
          res.send("Logged in");
        }
      } catch (err) {
        // Catch errors
        throw err;
      }
    }
);

module.exports = router;
