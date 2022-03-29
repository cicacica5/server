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
 * 注册访客
 */

// @route   POST /users/wx/visitor
// @desc    注册访客
// @access  Public
router.post(
    "/wx-users/register", [
      check("user_name", "username is required").notEmpty(), // Check the username
      check(
          "user_password",
          "Please enter a password with 6 or more characters"
      ).isLength({ min: 6 }), // Check the password
      check("visitor_phone_empty", "Phone is required").notEmpty(), // Check the phone
      check("visitor_phone_invaild", 
            "Please enter phone number with 11 nums.").isLength(11), // Check the phone
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
            "data":{
              "errCode":2,
              "errMessage":"用户名已存在！"
              }
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
            "data":{
              "errCode":0,
              "errMessage":"成功"
              }
            });
        }
      } catch (err) {
        // Catch errors
        throw err;
      }
    }
);

module.exports = router;