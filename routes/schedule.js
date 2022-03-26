// Imports
const express = require("express"); // Create router
const { check, validationResult } = require("express-validator"); // Check and validate the inputs
const promisePool = require("../config/db"); // Import instance of mysql pool

// Init router
const router = express.Router();

// Endpoints
/**
 * 创建某天排班
 * 获取某天值班的咨询师列表
 * 获取某天值班的督导列表
 * 获取排班表
 */

// @route   POST /schedule/daily
// @desc    创建某天排班
// @access  Public

router.post(
    "/daily", [
        check("user_id", "user_id is required").notEmpty(), // Check the user_id
        check(
            "date",
            "Please enter a valid date"
        ).isDate(), // Check the date
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
            user_id,
            date,
        } = req.body;

        try {
            // Check if schedule exists
            const [rows] = await promisePool.query(
                `SELECT EXISTS(SELECT * from schedule WHERE user_id = "${user_id}" and date = "${date}") "EXISTS" FROM dual`
            );
            const result = rows[0].EXISTS;

            if (result) {
                // Schedule already exists
                return res.status(400).json({ msg: "Schedule already exists" });
            } else {

                // Add schedule in the DB
                await promisePool.query(
                    `INSERT INTO schedule (user_id, date) VALUES ("${user_id}", "${date}")`
                );

                // Send success message to the client
                res.send("Schedule created");
            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route   GET /schedule/counsellorList
// @desc    获取某天值班的咨询师列表
// @access  Public

router.get(
    "/counsellorList", [
        check(
            "date",
            "Please enter a valid date"
        ).isDate(), // Check the date
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
            date,
        } = req.body;

        try {
            // Check if date exists
            const [rows] = await promisePool.query(
                `SELECT coun_id, coun_name, coun_gender, coun_phone, coun_status FROM schedule INNER JOIN login ON schedule.user_id = login.user_id INNER JOIN counsellor ON schedule.user_id = coun_id WHERE date = "${date}"`
            );
            const result = rows[0];

            if (!result) {
                // Schedule already exists
                return res.status(400).json({ msg: "该日期暂无排班" });
            } else {

                // Send success message to the client
                res.send(rows);
            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route   GET /schedule/supervisorList
// @desc    获取某天值班的督导列表
// @access  Public

router.get(
    "/supervisorList", [
        check(
            "date",
            "Please enter a valid date"
        ).isDate(), // Check the date
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
            date,
        } = req.body;

        try {
            // Check if date exists
            const [rows] = await promisePool.query(
                `SELECT sup_id, sup_name, sup_gender, sup_phone, sup_status FROM schedule INNER JOIN login ON schedule.user_id = login.user_id INNER JOIN supervisor ON schedule.user_id = sup_id WHERE date = "${date}"`
            );
            const result = rows[0];

            if (!result) {
                // Schedule already exists
                return res.status(400).json({ msg: "该日期暂无排班" });
            } else {

                // Send success message to the client
                res.send(rows);
            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route   GET /schedule/list
// @desc    获取排班表
// @access  Public

router.get(
    "/list", [
        check("user_id", "user_id is required").notEmpty(), // Check the user_id
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
            user_id,
        } = req.body;

        try {
            // Check if date exists
            const [rows] = await promisePool.query(
                `SELECT date FROM schedule WHERE user_id = "${user_id}"`
            );
            const result = rows[0];

            if (!result) {
                // Schedule already exists
                return res.status(400).json({ msg: "该用户暂无排班" });
            } else {

                // Send success message to the client
                res.send(rows);
            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

module.exports = router;
