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
                const [counsellors] = await promisePool.query(`SELECT counsellor.coun_id,
                                                                      counsellor.coun_name,
                                                                      counsellor.coun_gender,
                                                                      counsellor.coun_phone,
                                                                      counsellor.coun_age,
                                                                      counsellor.coun_identity,
                                                                      counsellor.coun_email,
                                                                      counsellor.coun_company,
                                                                      counsellor.coun_title,
                                                                      avg(score) as score,
                                                                      SUM(period) as total_time,
                                                                      COUNT(record_id) as total_num,
                                                                      login.user_name
                                                               FROM counsellor
                                                                        LEFT JOIN feedback ON counsellor.coun_id = feedback.target_id
                                                                        LEFT JOIN record ON counsellor.coun_id = record.coun_id
                                                                        LEFT JOIN login ON counsellor.coun_id = login.user_id
                                                               GROUP BY counsellor.coun_id
                `);

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
                const [supervisors] = await promisePool.query(`SELECT supervisor.sup_id,
                                                                      supervisor.sup_name,
                                                                      supervisor.sup_gender,
                                                                      supervisor.sup_phone,
                                                                      supervisor.sup_age,
                                                                      supervisor.sup_identity,
                                                                      supervisor.sup_email,
                                                                      supervisor.sup_company,
                                                                      supervisor.sup_title,
                                                                      supervisor.sup_qualification,
                                                                      supervisor.sup_quaNumber,
                                                                      SUM(period) as total_time,
                                                                      COUNT(record_id) as total_num,
                                                                      login.user_name
                                                               FROM supervisor
                                                                        LEFT JOIN record ON supervisor.sup_id = record.sup_id
                                                                        LEFT JOIN login ON supervisor.sup_id = login.user_id
                                                               GROUP BY supervisor.sup_id`);

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
