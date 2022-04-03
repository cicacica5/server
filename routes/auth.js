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
 * 获取当前用户信息
 * 授权用户登录
 * 用户登出
 * 验证用户
 */

// @route   GET /auth/getInfo
// @desc    获取当前用户信息
// @access  Private
router.get("/getInfo", //auth,
    async(req, res) => {
    // Extract user id from req
        let user_name = req.query.user_name;

    try {
        // Get user_id from DB
        const [rows] = await promisePool.query(
            `SELECT user_id, role from login WHERE user_name='${user_name}'`
        );

        // Extract user_id and role from rows
        const { user_id, role } = rows[0];

        // Create user object
        let user = {
            user_id,
            user_name,
            role,
        };

        // Check the role
        if (role === "counsellor") {
            // Get counsellor details from the DB
            const [rows] = await promisePool.query(
                `SELECT coun_name, coun_gender, coun_phone, coun_status, coun_avatar, bind_sup from counsellor WHERE coun_id='${user_id}'`
            );

            // Extract the details in variables
            const { coun_name, coun_gender, coun_phone, coun_status, coun_avatar, bind_sup } = rows[0];

            // Store the details in the user object
            user = {
                ...user,
                coun_name,
                coun_gender,
                coun_phone,
                coun_status,
                coun_avatar,
                bind_sup
            };
            // Send user object to the client
            res.json(user);
        } else if (role === "supervisor") {
            // Get supervisor details from the DB
            const [rows] = await promisePool.query(
                `SELECT sup_name, sup_gender, sup_phone, sup_status, sup_avatar from supervisor WHERE sup_id='${user_id}'`
            );

            // Extract the details in variables
            const {
                sup_name,
                sup_gender,
                sup_phone,
                sup_status,
                sup_avatar
            } = rows[0];

            // Store the details in the user object
            user = {
                ...user,
                sup_name,
                sup_gender,
                sup_phone,
                sup_status,
                sup_avatar
            };

            res.json(user);
        } else if (role === "admin") {
            // Get admin details from the DB
            const [rows] = await promisePool.query(
                `SELECT admin_name, admin_gender, admin_phone from admin WHERE admin_id='${user_id}'`
            );

            // Extract the details in variables
            const {
                admin_name,
                admin_gender,
                admin_phone
            } = rows[0];

            // Store the details in the user object
            user = {
                ...user,
                admin_name,
                admin_gender,
                admin_phone
            };
            // Send user object to the client
            res.json(user);
        } else if (role === "visitor") {
            // Get visitor details from the DB
            const [rows] = await promisePool.query(
                `SELECT visitor_name, visitor_gender, visitor_phone, visitor_status, visitor_avatar, emergency_name, emergency_phone from visitor WHERE visitor_id='${user_id}'`
            );

            // Extract the details in variables
            const {
                visitor_name,
                visitor_gender,
                visitor_phone,
                visitor_status,
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
                visitor_status,
                visitor_avatar,
                emergency_name,
                emergency_phone
            };
            // Send user object to the client
            res.json(user);
        }
    } catch (err) {
        // Catch errors
        throw err;
    }
});

// @route   POST /auth
// @desc    授权用户登录
// @access  Public
router.post(
    "/", [
        check("user_name", "user_name is required").notEmpty(), // Check user_name
        check("user_password", "user_password is required").exists(), // Check user_password
    ],
    async(req, res) => {
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
                return res.status(400).json({ msg: "Invalid Credentials" });
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
                    return res.status(400).json({ msg: "Invalid Credentials" });
                } else {
                    // Store user_id in payload for token
                    const payload = {
                        id: user_id,
                    };

                    // Create a token
                    const token = jwt.sign(payload, config.get("jwtSecret"), { expiresIn: 21600, });

                    // Store the token in an httpOnly cookie
                    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV !== "development", maxAge: 6 * 60 * 60 * 1000 });

                    // Send success message to client
                    res.send("Logged in");
                }
            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route   DELETE /auth
// @desc    用户登出
// @access  Private
router.delete(
    "/", auth,
    async(req, res) => {
        // Delete the cookie
        res.clearCookie('token');

        // Send success message to client
        res.send("Logged out");
    }
);

// @route   GET api/auth/check
// @desc    验证用户
// @access  Private
router.get("/check", async(req, res) => {
    // Get token from cookies
    const token = req.cookies.token;

    // Check if token exists
    if (!token) {
        res.clearCookie("token");
        res.send("No token");
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, config.get("jwtSecret"));

        res.send("Valid");
    } catch (err) {
        console.log("Invalid");
    }
});

module.exports = router;
