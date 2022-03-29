// Imports
const express = require("express"); // Create router
const bcrypt = require("bcryptjs"); // Encrypt password
const jwt = require("jsonwebtoken"); // Authorization
const config = require("config"); // Global variables
const auth = require("../middleware/auth"); // Middleware
const { check, validationResult } = require("express-validator"); // Check and validate the inputs
const promisePool = require("../config/db"); // Import instance of mysql pool

// Init router
const router = express.Router();

// Endpoints
/**
 * 注册访客
 */

// @route   POST /wx-users/register
// @desc    注册访客
// @access  Public
router.post(
    "/register", [
      check("user_name", "username is required").notEmpty(), // Check the username
      check(
          "user_password",
          "Please enter a password with 6 or more characters"
      ).isLength({ min: 6 }), // Check the password
      check("visitor_phone", "Phone is required").notEmpty(), // Check the phone
      check("visitor_phone", 
            "Please enter phone number with 11 nums.").isLength(11), // Check the phone
    ],
    async(req, res) => {
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
              "errCode":2,
              "errMessage":"用户名已存在！"
            });
        }else {
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
              `INSERT INTO visitor (visitor_id, visitor_phone, visitor_status) VALUES (${user_id},"${visitor_phone}", "offline")`
          );

          // Create a token
          const token = jwt.sign(payload, config.get("jwtSecret"), { expiresIn: 21600, });

          // Create an httpOnly cookie
          res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV !== "development", maxAge: 6 * 60 * 60 * 1000 });

          // Send success message to the client
          return res.status(200).json(
            {
              "errCode":0,
              "errMessage":"成功"
            });
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
        //auth,
        check("user_name", "user_name is required").notEmpty(), // Check the user_name
        check("visitor_name", "visitor_name is required").notEmpty(), // Check the visitor_name
        check("visitor_phone", "Phone is required").notEmpty(), // Check the phone
        check("visitor_phone", 
        "Please enter phone number with 11 nums.").isLength(11), // Check the phone

    ],
    async(req, res) => {

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
            const [rows] = await  promisePool.query(
                `SELECT user_id from login WHERE user_name = "${user_name}"`
            );
            const user_id = rows[0].user_id;
            console.log(user_id);


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
            if(!visitor_gender){
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

module.exports = router;