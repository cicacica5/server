// Imports
const express = require("express"); // Create router
const auth = require("../middleware/auth"); // Middleware
const { check, validationResult } = require("express-validator"); // Check and validate the inputs
const promisePool = require("../config/db"); // Import instance of mysql pool


// Init router
const router = express.Router();

// Endpoints
/**
 * 咨询师评价访客
 * 访客评价咨询师
 * 获取咨询师的平均分
 */

// @route   POST /feedback/toVisitor
// @desc    咨询师评价访客
// @access  Private
router.post(
    "/toVisitor",
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
                visitor_id,
                score,
            } = req.body;

            try {
                // Update coun_status in counsellor table
                await promisePool.query(
                    `INSERT INTO feedback(user_id, target_id, score) VALUES (${coun_id}, ${visitor_id}, ${score})`
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

// @route   POST /feedback/wx/toCounsellor
// @desc    访客评价咨询师
// @access  Private
router.post("/wx/toCounsellor", auth, async(req, res) => {
    // Extract user id from req
    const user_id = req.user_id;

    try {
        // Get role of the user from DB
        const [rows] = await promisePool.query(
            `SELECT role from login WHERE user_id='${user_id}'`
        );

        // Extract role from rows
        const { role } = rows[0];

        // Check if the user is visitor
        if (role === "visitor") {
            // Insert feedback in DB
            await promisePool.query(
                `INSERT INTO feedback(user_id, target_id, score) VALUES (${visitor_id}, ${coun_id}, ${score})`
            );

            // Send success message to the client
            res.send("Submitted Successfully");
        } else {
            // Unauthorized
            res.status(401).json({ msg: "仅限访客访问！！" });
        }
    } catch (err) {
        // Catch errors
        throw err;
    }
});

// @route   GET /feedback/score
// @desc    获取咨询师的平均分
// @access  Public

router.get(
    "/score", [
        check("coun_id", "coun_id is required").notEmpty(), // Check the coun_id
    ],
    async(req, res) => {
        // Check for errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return the errors
            return res.status(400).json({ errors: errors.array() });
        }

        let coun_id = req.query.coun_id;

        try {
            // Check if record exists
            const [rows] = await promisePool.query(
                `SELECT avg(score) AS score FROM feedback WHERE target_id = "${coun_id}"`
            );
            const result = rows[0];

            if (!result) {
                // Schedule already exists
                return res.status(400).json({ msg: "该用户暂无评价信息" });
            } else {

                // Send success message to the client
                res.send(rows[0]);
            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

module.exports = router;
