// Imports
const express = require("express"); // Create router
const { check, validationResult } = require("express-validator"); // Check and validate the inputs
const promisePool = require("../config/db"); // Import instance of mysql pool
const genTestUserSig = require('../SDK/GenUserSig')

// Init router
const router = express.Router();

// Endpoints
/**
 * 修改绑定督导
 * 增加绑定督导
 * 修改咨询师状态
 * 获取某个咨询师状态
 * 获取绑定的督导列表
 * 获取咨询师当前会话数
 */

// @route   PUT /counsellor/bind
// @desc    修改绑定督导
// @access  Public

router.put(
    "/bind", [
        check("coun_id", "coun_id is required").notEmpty(), // Check the coun_id
    ],
    async(req, res) => {
        // Check for errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return the errors
            return res.status(400).json({ errors: errors.array() });
        }

        let coun_id = req.body.coun_id;
        let sups = req.body.sup_id;

        try {

            // Check if bind exists
            let [rows] = await promisePool.query(
                `SELECT EXISTS(SELECT * from bind WHERE coun_id = "${coun_id}") "EXISTS" FROM dual`
            );

            let result = rows[0].EXISTS;

            if (result) {
                //Delete bind in the DB
                await promisePool.query(
                    `DELETE FROM bind WHERE coun_id=${coun_id}`
                );
            }

            for (let i = 0; i < sups.length; i++) {
                let sup_id = sups[i];

                // Add bind in the DB
                await promisePool.query(
                    `INSERT INTO bind (coun_id, sup_id) VALUES ("${coun_id}", "${sup_id}")`
                );
            }
            // Send success message to the client
            res.send("Bind created");
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route   POST /counsellor/bind
// @desc    增加绑定督导
// @access  Public

router.post(
    "/bind", [
        check("coun_id", "coun_id is required").notEmpty(), // Check the coun_id
    ],
    async(req, res) => {
        // Check for errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return the errors
            return res.status(400).json({ errors: errors.array() });
        }

        let coun_id = req.body.coun_id;
        let sups = req.body.sup_id;

        try {
            for (let i = 0; i < sups.length; i++) {
                let sup_id = sups[i];
                // Check if bind exists
                let [rows] = await promisePool.query(
                    `SELECT EXISTS(SELECT * from bind WHERE coun_id = "${coun_id}" and sup_id = "${sup_id}") "EXISTS" FROM dual`
                );
                let result = rows[0].EXISTS;

                if (result) {
                    // Bind already exists
                    return res.status(400).json({ msg: "Bind already exists" });
                } else {

                    // Add bind in the DB
                    await promisePool.query(
                        `INSERT INTO bind (coun_id, sup_id) VALUES ("${coun_id}", "${sup_id}")`
                    );
                }
            }
            // Send success message to the client
            res.send("Bind created");
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

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
        let coun_id = req.query.coun_id;

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

// @route   GET /counsellor/bindSupervisorList
// @desc    获取绑定的督导列表
// @access  Private
router.get("/bindSupervisorList", [
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

            if (role == "counsellor") { // Check if the user is supervisor
                // Get all students from the DB
                const [supervisors] = await promisePool.query(
                    `SELECT user_name, sup_name, supervisor.sup_id
                     FROM supervisor INNER JOIN bind ON supervisor.sup_id = bind.sup_id
                                     LEFT JOIN login ON supervisor.sup_id = user_id
                     WHERE coun_id = "${user_id}"
                    `);

                // Send data to the client
                res.json(supervisors);

            } else {
                // Unauthorized
                res.status(401).json({ msg: "仅限咨询师访问！！" });
            }

        } catch (err) {
            // Catch errors
            throw err;
        }
    });

// @route GET /counsellor/getConversationNum
// @desc  获取咨询师当前会话数
// @access  Public
router.get(
    "/getConversationNum",[
        check("coun_id", "coun_id is required").notEmpty(), // Check the coun_id
    ],
    async (req, res) => {
        let coun_id = req.query.coun_id;

        try {
            const [rows] = await promisePool.query(
                `SELECT conversation_num FROM counsellor WHERE coun_id = '${coun_id}'`
            );
            const row = rows[0];

            if (row == undefined) {
                return res.status(400).json({msg : "Counsellor Not Exist."});
            } else {
                const conversation_num = row.conversation_num;
                return res.status(200).json({
                    "conversation_num": conversation_num
                });
            }
        } catch (err) {
            throw err;
        }
    }
);

module.exports = router;
