// Imports
const express = require("express"); // Create router
const auth = require("../middleware/auth"); // Middleware
const promisePool = require("../config/db"); // Import instance of mysql pool
const { check, validationResult } = require("express-validator"); // Check and validate the inputs

// Init router
const router = express.Router();

// Endpoints
/**
 * 获取咨询师列表
 * 获取督导列表
 * 获取访客列表
 */

// @route   GET /admin/counsellorList
// @desc    获取咨询师列表
// @access  Private
router.get("/counsellorList", [
        //auth,
        check("user_id", "user_id is required").notEmpty(), // Check the user_id
    ],
    async(req, res) => {

    try {
        // Check for errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return the errors
            return res.status(400).json({ errors: errors.array() });
        }

        let user_id = req.query.user_id;

        // Check if user exists
        const [rows] = await promisePool.query(
            `SELECT role from login WHERE user_id = '${user_id}'`
        );

            // Extract role from rows
            const role = rows[0].role;

            if (role == "admin") { // Check if the user is admin
                // Get all students from the DB
                const [counsellors] = await promisePool.query(`SELECT * from counsellor`);

                // Send data to the client
                res.json(counsellors);

            } else {
                // Unauthorized
                res.status(401).json({ msg: "仅限管理员访问！！" });
            }

    } catch (err) {
        // Catch errors
        throw err;
    }
});

// @route   GET /admin/supervisorList
// @desc    获取督导列表
// @access  Private
router.get("/supervisorList", [
        //auth,
        check("user_id", "user_id is required").notEmpty(), // Check the user_id
    ],
    async(req, res) => {

        try {
            // Check for errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // Return the errors
                return res.status(400).json({ errors: errors.array() });
            }

            let user_id = req.query.user_id;

            // Check if user exists
            const [rows] = await promisePool.query(
                `SELECT role from login WHERE user_id = '${user_id}'`
            );

            // Extract role from rows
            const role = rows[0].role;

            if (role == "admin") { // Check if the user is admin
                // Get all students from the DB
                const [supervisors] = await promisePool.query(`SELECT * from supervisor`);

                // Send data to the client
                res.json(supervisors);

            } else {
                // Unauthorized
                res.status(401).json({ msg: "仅限管理员访问！！" });
            }

        } catch (err) {
            // Catch errors
            throw err;
        }
    });

// @route   GET /admin/visitorList
// @desc    获取访客列表
// @access  Private
router.get("/visitorList", [
        //auth,
        check("user_id", "user_id is required").notEmpty(), // Check the user_id
    ],
    async(req, res) => {

        try {
            // Check for errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // Return the errors
                return res.status(400).json({ errors: errors.array() });
            }

            let user_id = req.query.user_id;

            // Check if user exists
            const [rows] = await promisePool.query(
                `SELECT role from login WHERE user_id = '${user_id}'`
            );

            // Extract role from rows
            const role = rows[0].role;

            if (role == "admin") { // Check if the user is admin
                // Get all students from the DB
                const [visitors] = await promisePool.query(`SELECT * from visitor`);

                // Send data to the client
                res.json(visitors);

            } else {
                // Unauthorized
                res.status(401).json({ msg: "仅限管理员访问！！" });
            }

        } catch (err) {
            // Catch errors
            throw err;
        }
    });

module.exports = router;
