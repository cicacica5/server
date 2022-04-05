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
                                                                                                                                                      INNER JOIN supervisor ON record.sup_id = supervisor.sup_id
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
        check("coun_id", "coun_id is required.").notEmpty(), // Check coun_id
    ],
    async(req, res) => {
        // Check for errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return the errors
            return res.status(400).json({ errors: errors.array() });
        }

        const sid = req.query.sup_id;
        const cid = req.query.coun_id;
        try {
            // Check if record exists
            const [rows] = await promisePool.query(
                `SELECT * FROM record WHERE record.sup_id = ${sid} AND record.coun_id = ${cid}
                `
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
                `SELECT * FROM record`
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

module.exports = router;
