// Imports
const express = require("express"); // Create router
const { check, validationResult } = require("express-validator"); // Check and validate the inputs
const promisePool = require("../config/db"); // Import instance of mysql pool

// Init router
const router = express.Router();

// Endpoints
/**
 * 创建咨询记录
 * 获取某个咨询师的咨询记录列表
 * 获取督导及其绑定的咨询师的咨询记录列表
 * 获取所有人的咨询记录列表
 * 获取咨询师或督导的今日咨询数
 * 获取咨询师或督导的今日咨询时长
 * 获取咨询师或督导的累计咨询数
 * 获取最近n个咨询/求助记录
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
                sup_id,
                help_or_not,
                begin_time,
                end_time,
            } = req.body;

            try {

                if (!help_or_not) {
                    // Add record in the DB
                    await promisePool.query(
                        `INSERT INTO record (visitor_id, coun_id, help_or_not, sup_id, begin_time, end_time, period) VALUES ("${visitor_id}", "${coun_id}", "${help_or_not}", "${sup_id}", "${begin_time}", "${end_time}", timestampdiff(second, "${begin_time}", "${end_time}"))`
                    );

                    // Send success message to the client
                    res.send("Record created");
                } else {
                    // Add record in the DB
                    await promisePool.query(
                        `INSERT INTO record (visitor_id, coun_id, help_or_not, sup_id, begin_time, end_time, period) VALUES ("${visitor_id}", "${coun_id}", "${help_or_not}", "${sup_id}", "${begin_time}", "${end_time}", timestampdiff(second, "${begin_time}", "${end_time}"))`
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
// @desc    获取某个咨询师的咨询记录列表
// @access  Public

router.get(
    "/list", [
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
                ` SELECT visitor.visitor_name, counsellor.coun_name, help_or_not, supervisor.sup_name, begin_time, end_time, content, period FROM record
                                                                                                                                                      INNER JOIN visitor ON record.visitor_id = visitor.visitor_id
                                                                                                                                                      LEFT JOIN supervisor ON record.sup_id = supervisor.sup_id
                                                                                                                                                      INNER JOIN counsellor ON record.coun_id = counsellor.coun_id
                  WHERE record.coun_id = "${coun_id}"`
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

// @route   GET /record/supAndBind
// @desc    获取督导及其绑定的咨询师的咨询记录列表
// @access  Public

router.get(
    "/supAndBind", [
        check("sup_id", "sup_id is required.").notEmpty(), // Check sup_id
    ],
    async(req, res) => {
        // Check for errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return the errors
            return res.status(400).json({ errors: errors.array() });
        }

        const sid = req.query.sup_id;
        try {
            // Check if record exists
            const [rows] = await promisePool.query(
                `SELECT * FROM record JOIN bind 
                 ON record.sup_id = bind.sup_id AND record.coun_id = bind.coun_id
                 WHERE record.sup_id = ${sid} AND bind.sup_id = ${sid}`
            );
            const row = rows[0];

            if (!row) {
                // Schedule already exists
                return res.status(400).json({ msg: "暂无咨询记录" });
            } else {
                // Send success message to the client
                return res.status(200).json({
                    "RecordList": rows
                });
            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route   GET /record/all
// @desc    获取所有人的咨询记录列表
// @access  Public

router.get(
    "/all",
    async(req, res) => {

        try {
            // Check if record exists
            const [rows] = await promisePool.query(
                ` SELECT visitor.visitor_name, counsellor.coun_name, help_or_not, supervisor.sup_name, begin_time, end_time, content, period FROM record
                                                                                                                                                      INNER JOIN visitor ON record.visitor_id = visitor.visitor_id
                                                                                                                                                      LEFT JOIN supervisor ON record.sup_id = supervisor.sup_id
                                                                                                                                                      INNER JOIN counsellor ON record.coun_id = counsellor.coun_id`
            );
            const result = rows[0];

            if (!result) {
                // Schedule already exists
                return res.status(400).json({ msg: "暂无咨询记录" });
            } else {
                // Send success message to the client
                return res.status(200).json({
                    "RecordList": rows
                });
            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route   GET /record/todayNum
// @desc    获取咨询师或督导的今日咨询数
// @access  Public

router.get(
    "/todayNum", [
        check("user_id", "user_id is required.").notEmpty(), // check user_id
    ],
    async(req, res) => {
        // Check for errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return the errors
            return res.status(400).json({ errors: errors.array() });
        }

        const user_id = req.query.user_id;
        try {
            const [user_role] = await promisePool.query(
                `SELECT role FROM login WHERE user_id = ${user_id}`
            )
            const ur = user_role[0].role;
            if(ur == "counsellor"){
                const [result] = await promisePool.query(
                    `SELECT counsellor.coun_id, counsellor.coun_name, login.role,
                            COUNT(DateDiff(record.begin_time,CURRENT_DATE())=0 or null) AS today_num
                     FROM counsellor JOIN login ON login.user_id = counsellor.coun_id
                                     LEFT JOIN record ON counsellor.coun_id = record.coun_id
                     WHERE counsellor.coun_id = ${user_id}`
                );
                    // Send success message to the client
                    res.send(result);
            } else if(ur == "supervisor"){
                const [result] = await promisePool.query(
                    `SELECT supervisor.sup_id, supervisor.sup_name, login.role,
                            COUNT(DateDiff(record.begin_time,CURRENT_DATE())=0 or null) AS today_num
                     FROM supervisor JOIN login ON login.user_id = supervisor.sup_id
                                     LEFT JOIN record ON supervisor.sup_id = record.sup_id
                     WHERE supervisor.sup_id = ${user_id}`
                );
                    // Send success message to the client
                    res.send(result);
            } else {
                return res.status(401).json({ msg: "role is invaild." });
            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route   GET /record/todayTime
// @desc    获取咨询师或督导的今日咨询时长
// @access  Public

router.get(
    "/todayTime", [
        check("user_id", "user_id is required.").notEmpty(), // check user_id
    ],
    async(req, res) => {
        // Check for errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return the errors
            return res.status(400).json({ errors: errors.array() });
        }

        const user_id = req.query.user_id;
        try {
            const [user_role] = await promisePool.query(
                `SELECT role FROM login WHERE user_id = ${user_id}`
            )
            const ur = user_role[0].role;
            if(ur == "counsellor"){
                const [result] = await promisePool.query(
                    `SELECT counsellor.coun_id, counsellor.coun_name, login.role,
                            SUM(IF(DateDiff(record.begin_time,CURRENT_DATE())=0, record.period, 0)) AS today_time
                     FROM counsellor JOIN login ON login.user_id = counsellor.coun_id
                                     LEFT JOIN record ON counsellor.coun_id = record.coun_id
                     WHERE counsellor.coun_id = ${user_id}`
                );
                    // Send success message to the client
                    res.send(result);
            } else if(ur == "supervisor"){
                const [result] = await promisePool.query(
                    `SELECT supervisor.sup_id, supervisor.sup_name, login.role, 
                            SUM(IF(DateDiff(record.begin_time,CURRENT_DATE())=0, record.period, 0)) AS today_time
                     FROM supervisor JOIN login ON login.user_id = supervisor.sup_id
                                     LEFT JOIN record ON supervisor.sup_id = record.sup_id
                     WHERE supervisor.sup_id = ${user_id}`
                );
                    // Send success message to the client
                    res.send(result);
            } else {
                return res.status(401).json({ msg: "role is invaild." });
            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route   GET /record/allNum
// @desc    获取咨询师或督导的累计咨询数
// @access  Public

router.get(
    "/allNum", [
        check("user_id", "user_id is required.").notEmpty(), // check user_id
    ],
    async(req, res) => {
        // Check for errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return the errors
            return res.status(400).json({ errors: errors.array() });
        }

        const user_id = req.query.user_id;
        try {
            const [user_role] = await promisePool.query(
                `SELECT role FROM login WHERE user_id = ${user_id}`
            )
            const ur = user_role[0].role;
            if(ur == "counsellor"){
                const [result] = await promisePool.query(
                    `SELECT counsellor.coun_id, counsellor.coun_name, login.role, COUNT(record.record_id OR NULL) AS all_num
                     FROM counsellor JOIN login ON login.user_id = counsellor.coun_id
                                     LEFT JOIN record ON counsellor.coun_id = record.coun_id
                     WHERE counsellor.coun_id = ${user_id}`
                );
                    // Send success message to the client
                    res.send(result);
            } else if(ur == "supervisor"){
                const [result] = await promisePool.query(
                    `SELECT supervisor.sup_id, supervisor.sup_name, login.role, COUNT(record.record_id OR NULL) AS all_num
                     FROM supervisor JOIN login ON login.user_id = supervisor.sup_id
                                     LEFT JOIN record ON supervisor.sup_id = record.sup_id
                     WHERE supervisor.sup_id = ${user_id}`
                );
                    // Send success message to the client
                    res.send(result);
            } else {
                return res.status(401).json({ msg: "role is invaild." });
            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route   GET /record/recent
// @desc    获取最近n个咨询/求助记录
// @access  Public

router.get(
    "/recent", [
        check("user_id", "user_id is required.").notEmpty(), // check user_id
        check("n", "n must be an Integer.").isInt(), // check n
    ],
    async(req, res) => {
        // Check for errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return the errors
            return res.status(400).json({ errors: errors.array() });
        }

        const user_id = req.query.user_id;
        const n = req.query.n;

        // check n
        if(n <= 0 ){
            return res.status(401).json({ msg: "n must be positive Int." });
        }
        try {
            const [user_role] = await promisePool.query(
                `SELECT role FROM login WHERE user_id = ${user_id}`
            )
            const ur = user_role[0].role;
            if(ur == "counsellor"){
                const [result] = await promisePool.query(
                    `SELECT * FROM record WHERE coun_id = ${user_id}
                     ORDER BY end_time DESC
                     LIMIT ${n}`
                );
                    // Send success message to the client
                    res.send(result);
            } else if(ur == "supervisor"){
                const [result] = await promisePool.query(
                    `SELECT * FROM record WHERE sup_id = ${user_id}
                     ORDER BY end_time DESC
                     LIMIT ${n}`
                );
                    // Send success message to the client
                    res.send(result);
            } else {
                return res.status(401).json({ msg: "role is invaild." });
            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);
module.exports = router;
