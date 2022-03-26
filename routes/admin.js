// Imports
const express = require("express"); // Create router
const auth = require("../middleware/auth"); // Middleware
const promisePool = require("../config/db"); // Import instance of mysql pool

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
router.get("/counsellorList", auth, async(req, res) => {
    // Extract user id from req
    const user_id = req.user_id;

    try {
        // Get role of the user from DB
        const [rows] = await promisePool.query(
            `SELECT role from login WHERE user_id='${user_id}'`
        );

        // Extract role from rows
        const { role } = rows[0];

        // Check if the user is admin
        if (role === "admin") {
            // Get all students from the DB
            const [rows] = await promisePool.query(`SELECT * from counsellor`);

            // Init counsellors array
            let counsellors = [];

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
router.get("/supervisorList", auth, async(req, res) => {
    // Extract user id from req
    const user_id = req.user_id;

    try {
        // Get role of the user from DB
        const [rows] = await promisePool.query(
            `SELECT role from login WHERE user_id='${user_id}'`
        );

        // Extract role from rows
        const { role } = rows[0];

        // Check if the user is admin
        if (role === "admin") {
            // Get all students from the DB
            const [rows] = await promisePool.query(`SELECT * from supervisor`);

            // Init supervisors array
            let supervisors = [];

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
router.get("/visitorList", auth, async(req, res) => {
    // Extract user id from req
    const user_id = req.user_id;

    try {
        // Get role of the user from DB
        const [rows] = await promisePool.query(
            `SELECT role from login WHERE user_id='${user_id}'`
        );

        // Extract role from rows
        const { role } = rows[0];

        // Check if the user is admin
        if (role === "admin") {
            // Get all students from the DB
            const [rows] = await promisePool.query(`SELECT * from visitor`);

            // Init visitors array
            let visitors = [];

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
