// Imports
const express = require("express"); // Create router
const { check, validationResult } = require("express-validator"); // Check and validate the inputs
const promisePool = require("../config/db"); // Import instance of mysql pool
const genTestUserSig = require('../SDK/GenUserSig')

// Init router
const router = express.Router();

// Endpoints
/**
 * 修改督导状态
 * 获取某个督导状态
 */

// @route   PUT /supervisor/changeStatus
// @desc    修改督导状态
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
                sup_id,
                sup_status
            } = req.body;

            // Check status
            if (
                sup_status !== "offline" &&
                sup_status !== "free" &&
                sup_status !== "busy"
            ) {
                return res.status(200).json({
                    "Code": 6,
                    "Message": "sup_status非法，请从offline/free/busy中选择"
                });
            }

            try {
                // Update coun_status in counsellor table
                await promisePool.query(
                    `UPDATE supervisor SET sup_status='${sup_status}'
                    WHERE sup_id=${sup_id}`
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

// @route GET /supervisor/getStatus
// @desc  获取某个督导状态
// @access  Public
router.get(
    "/getStatus",
    async (req, res) => {
        const sup_id = req.query.sup_id;

        try {
            const [rows] = await promisePool.query(
                `SELECT sup_status FROM supervisor WHERE sup_id = ${sup_id}`
            );
            const row = rows[0];

            if (row == undefined) {
                return res.status(200).json({
                    "errCode": 9,
                    "errMessage": "该督导不存在"
                });
            } else {
                return res.status(200).json({
                    "code": 0,
                    "sup_status": row.sup_status
                });
            }
        } catch (err) {
            throw err;
        }
    }
);

module.exports = router;
