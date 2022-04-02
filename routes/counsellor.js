// Imports
const express = require("express"); // Create router
const { check, validationResult } = require("express-validator"); // Check and validate the inputs
const promisePool = require("../config/db"); // Import instance of mysql pool
const genTestUserSig = require('../SDK/GenUserSig')

// Init router
const router = express.Router();

// Endpoints
/**
 * 修改咨询师状态
 * 获取某个咨询师状态
 */

// @route   PUT /counsellor/changeStatus
// @desc    修改咨询师状态
// @access  Private
router.put(
    "/changeStatus",
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
                coun_status
            } = req.body;

            // Check status
            if (
                coun_status !== "offline" &&
                coun_status !== "free" &&
                coun_status !== "busy"
            ) {
                return res.status(200).json({
                    "Code": 6,
                    "Message": "coun_status非法，请从offline/free/busy中选择"
                });
            }

            try {
                // Update coun_status in counsellor table
                await promisePool.query(
                    `UPDATE counsellor SET coun_status='${coun_status}'
                    WHERE coun_id= '${coun_id}'`
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

// @route GET /counsellor/getStatus
// @desc  获取某个咨询师状态
// @access  Public
router.get(
    "/getStatus",
    async (req, res) => {
        let {
            coun_id,
        } = req.body;

        try {
            const [rows] = await promisePool.query(
                `SELECT coun_status FROM counsellor WHERE coun_id = '${coun_id}'`
            );
            const row = rows[0];

            if (row == undefined) {
                return res.status(200).json({
                    "errCode": 9,
                    "errMessage": "该咨询师不存在"
                });
            } else {
                return res.status(200).json({
                    "coun_status": row.coun_status
                });
            }
        } catch (err) {
            throw err;
        }
    }
);

module.exports = router;
