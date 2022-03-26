// Imports
const express = require("express"); // Create router
const { check, validationResult } = require("express-validator"); // Check and validate the inputs
const promisePool = require("../config/db"); // Import instance of mysql pool

// Init router
const router = express.Router();

// Endpoints
/**
 * 创建咨询记录
 * 获取咨询记录列表
 */

// @route   POST /record
// @desc    创建咨询记录
// @access  Public

router.post(
    "/", [
        check("visitor_id", "visitor_id is required").notEmpty(), // Check the visitor_id
        check("coun_id", "coun_id is required").notEmpty(), // Check the coun_id
        check("help_or_not", "Tell if the counsellor asked for help or not").notEmpty(),
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
            visitor_id,
            coun_id,
            help_or_not,
            sup_id,
            begin_time,
            end_time,
        } = req.body;

        try {

            if(!help_or_not) {
                // Add record in the DB
                await promisePool.query(
                    `INSERT INTO record (visitor_id, coun_id, help_or_not, sup_id, begin_time, end_time) VALUES ("${visitor_id}", "${coun_id}", "${help_or_not}", NULL, "${begin_time}", "${end_time}")`
                );

                // Send success message to the client
                res.send("Record created");
            } else {
                // Add record in the DB
                await promisePool.query(
                    `INSERT INTO record (visitor_id, coun_id, help_or_not, sup_id, begin_time, end_time) VALUES ("${visitor_id}", "${coun_id}", "${help_or_not}", "${sup_id}", "${begin_time}", "${end_time}")`
                );

                // Send success message to the client
                res.send("Record created");

            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route   GET /record/list
// @desc    获取咨询记录列表
// @access  Public

router.get(
    "/list", [
        check("user_id", "userID is required").notEmpty(), // Check the userID
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
            // Check if record exists
            const [rows] = await promisePool.query(
                `SELECT * FROM record WHERE user_id = "${user_id}"`
            );
            const result = rows[0];

            if (!result) {
                // Schedule already exists
                return res.status(400).json({ msg: "该用户暂无咨询记录" });
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
