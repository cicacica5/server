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
      check("user_name", "user_name is required").notEmpty(), // Check the user_name
      check(
          "user_password",
          "Please enter a password with 6 or more characters"
      ).isLength({ min: 6 }), // Check the password
      check("role", "Role is required").notEmpty(), // Check the role
      check("admin_name", "admin_name is required").notEmpty(), // Check the admin_name
      check("admin_gender", "Gender is required").notEmpty(), // Check the gender
      check("admin_phone", "Phone is required").notEmpty(), // Check the phone
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
      check("user_name", "username is required").notEmpty(), // Check the username
      check(
          "user_password",
          "Please enter a password with 6 or more characters"
      ).isLength({ min: 6 }), // Check the password
      check("role", "Role is required").notEmpty(), // Check the role
      check("coun_name", "coun_name is required").notEmpty(), // Check the coun_name
      check("coun_gender", "Gender is required").notEmpty(), // Check the gender
      check("coun_phone", "Phone is required").notEmpty(), // Check the phone
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
        return res.status(400).json({ msg: "Gender is not valid" });
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
              `INSERT INTO counsellor (coun_id, coun_name, coun_gender, coun_phone, coun_status) VALUES (${user_id},"${coun_name}", "${coun_gender}", "${coun_phone}", "offline")`
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
      check("user_name", "username is required").notEmpty(), // Check the username
      check(
          "user_password",
          "Please enter a password with 6 or more characters"
      ).isLength({ min: 6 }), // Check the password
      check("role", "Role is required").notEmpty(), // Check the role
      check("sup_name", "sup_name is required").notEmpty(), // Check the sup_name
      check("sup_gender", "Gender is required").notEmpty(), // Check the gender
      check("sup_phone", "Phone is required").notEmpty(), // Check the phone
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
        return res.status(400).json({ msg: "Gender is not valid" });
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
              `INSERT INTO supervisor (sup_id, sup_name, sup_gender, sup_phone, sup_status) VALUES (${user_id},"${sup_name}", "${sup_gender}", "${sup_phone}", "offline")`
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
