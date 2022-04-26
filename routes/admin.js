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
 * 修改访客状态
 * 获取在线咨询师列表
 * 获取在线督导列表
 * 本月咨询师的咨询数排行
 * 所有咨询师评价排行
 * 最近7天的咨询数量
 * 当天排班咨询师人数
 * 当天排班督导人数
 * 当天咨询次数
 * 当天咨询总时长
 * 当日咨询数量变化（每4小时）
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
                const [visitors] = await promisePool.query(`SELECT * FROM visitor`);

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

// @route   POST /admin/changeVisitorStatus
// @desc    修改访客状态
// @access  Private
router.post(
    "/changeVisitorStatus", [
    check("user_id", "user_id is required").notEmpty(), // Check the user_id
  ],
    async (req, res) => {
      // Check for errorsy
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Return the errors
        return res.status(400).json({ errors: errors.array() });
      }
  
      // Extract info from the body
      let {
        user_id,
        status,
      } = req.body;
  
        // Check status
        if (status !== "normal" && status !== "banned"){
                return res.status(401).json({ msg : "Error status."});
        }

      try {
        // Check if user exists
        const [rows] = await promisePool.query(
          `SELECT EXISTS(SELECT * from login WHERE user_id = "${user_id}" ) "EXISTS" FROM dual`
        );
        const result = rows[0];
  
        if (!result) {
          // User already exists
          return res.status(400).json({ msg : "User doesn't exist."});
        } 


        await promisePool.query(
            `UPDATE visitor SET visitor_status='${status}'
                      WHERE visitor_id=${user_id}`
          );
  
          return res.status(200).json({ msg :"status change success"});

      } catch (err) {
        // Catch errors
        throw err;
      }
    }
  );

// @route   GET /admin/onlineCounsellorList
// @desc    获取在线咨询师列表
// @access  Private
router.get("/onlineCounsellorList", [
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
            // Get all online Counsellor List
            const [counsellors] = await promisePool.query(`SELECT counsellor.coun_id,
                                                                  counsellor.coun_name,
                                                                  counsellor.coun_gender,
                                                                  counsellor.coun_phone,
                                                                  counsellor.coun_status,
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
                                                           WHERE counsellor.coun_status = "free" OR counsellor.coun_status = "busy" 
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

// @route   GET /admin/onlineSupervisorList
// @desc    获取在线督导列表
// @access  Private
router.get("/onlineSupervisorList", [
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
            // Get all online Counsellor List
            const [supervisors] = await promisePool.query(`SELECT supervisor.sup_id,
                                                                  supervisor.sup_name,
                                                                  supervisor.sup_gender,
                                                                  supervisor.sup_phone,
                                                                  supervisor.sup_status,
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
                                                           WHERE (supervisor.sup_status = "free" OR supervisor.sup_status = "busy") AND supervisor.sup_id != -1
                                                           GROUP BY supervisor.sup_id
            `);

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

// @route   GET /admin/numThisMonthRank
// @desc    本月咨询师的咨询数排行
// @access  Private
router.get("/numThisMonthRank", [
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
            const [counsellors] = await promisePool.query(
                `SELECT counsellor.coun_id,
                        counsellor.coun_name,
                        counsellor.coun_gender,
                        counsellor.coun_phone,
                        counsellor.coun_age,
                        counsellor.coun_company,
                        counsellor.coun_title,
                        COUNT(IF(DATE_FORMAT(record.end_time,'%Y%m')=DATE_FORMAT(CURDATE(),'%Y%m'), record.record_id, null)) as total_num_thisMonth
                 FROM counsellor LEFT JOIN record ON counsellor.coun_id = record.coun_id
                 GROUP BY counsellor.coun_id
                 ORDER BY total_num_thisMonth DESC
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

// @route   GET /admin/counsellorScoreRank
// @desc    所有咨询师评价排行
// @access  Private
router.get("/counsellorScoreRank", [
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
            const [counsellors] = await promisePool.query(
                `SELECT counsellor.coun_id,
                        counsellor.coun_name,
                        counsellor.coun_gender,
                        counsellor.coun_phone,
                        counsellor.coun_age,
                        counsellor.coun_company,
                        counsellor.coun_title,
                        ROUND(avg(feedback.score),2) as avg_score
                 FROM counsellor LEFT JOIN feedback ON counsellor.coun_id = feedback.target_id
                 GROUP BY counsellor.coun_id
                 ORDER BY avg_score DESC
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

// @route   GET /admin/recordNumRecent
// @desc    最近7天的咨询数量
// @access  Private
router.get(
    "/recordNumRecent", [
    check("user_id", "user_id is required").notEmpty(), // Check the user_i
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
            const [recentRank] = await promisePool.query(
                `SELECT DATE_FORMAT(recent_7days.end_time, '%Y-%m-%d' ) days,
                        COUNT(*) record_num 
                 FROM (
                    SELECT * FROM record
                    WHERE DATE_SUB( CURDATE(), INTERVAL 6 DAY ) <= record.end_time) AS recent_7days
                 GROUP BY days
                `);

            // Send data to the client
            res.json(recentRank);

        } else {
            // Unauthorized
            res.status(401).json({ msg: "仅限管理员访问！！" });
        }

} catch (err) {
    // Catch errors
    throw err;
}
});

// @route   GET /admin/TodayCounOnDuty
// @desc    当天排班咨询师人数
// @access  Private

router.get("/TodayCounOnDuty", [
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
            const [rows] = await promisePool.query(
                `SELECT role FROM login WHERE user_id = ${user_id}`
            )
            const role = rows[0].role;
            if(role == "admin"){
                const [result] = await promisePool.query(
                    `SELECT schedule.date, COUNT(schedule.user_id) AS coun_num
                     FROM schedule LEFT JOIN login ON schedule.user_id = login.user_id
                     WHERE login.role = "counsellor" AND (DATE_FORMAT(schedule.date,'%Y%m') = DATE_FORMAT(CURDATE(),'%Y%m'))
                     GROUP BY schedule.date`
                );
                    // Send success message to the client
                    res.json(result);
            } else {
                return res.status(401).json({ msg: "仅限管理员访问！！" });
            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route   GET /admin/TodaySupOnDuty
// @desc    当天排班督导人数
// @access  Private

router.get("/TodaySupOnDuty", [
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
            const [rows] = await promisePool.query(
                `SELECT role FROM login WHERE user_id = ${user_id}`
            )
            const role = rows[0].role;
            if(role == "admin"){
                const [result] = await promisePool.query(
                    `SELECT schedule.date, COUNT(schedule.user_id) AS sup_num
                     FROM schedule LEFT JOIN login ON schedule.user_id = login.user_id
                     WHERE login.role = "supervisor" AND (DATE_FORMAT(schedule.date,'%Y%m') = DATE_FORMAT(CURDATE(),'%Y%m'))
                     GROUP BY schedule.date`
                );
                    // Send success message to the client
                    res.json(result);
            } else {
                return res.status(401).json({ msg: "仅限管理员访问！！" });
            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route   GET /admin/todayNum
// @desc    当天咨询次数
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

        // Check user_id
        let user_id = req.query.user_id;
        const [rows] = await promisePool.query(
            `SELECT EXISTS(SELECT * from login WHERE user_id = "${user_id}" ) "EXISTS" FROM dual`
        );
        const result = rows[0].EXISTS;
        if (result) {
            const [user_role] = await promisePool.query(
                `SELECT role FROM login WHERE user_id = ${user_id}`
            )
            const role = user_role[0].role;
            if(role != "admin"){
                return res.status(401).json({ msg: "role is invaild." });
            }
        } else {
            return res.status(401).json({ msg: "User not exists." });
        }

        try {
            const [result] = await promisePool.query(
                `SELECT CURRENT_DATE() AS today, COUNT(DateDiff(record.begin_time,CURRENT_DATE())=0 or null) AS today_num
                 FROM record
                 `
                );
            // Send success message to the client
            res.send(result);

        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route   GET /admin/todayTime
// @desc    当天咨询时长
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

        // Check user_id
        let user_id = req.query.user_id;
        const [rows] = await promisePool.query(
            `SELECT EXISTS(SELECT * from login WHERE user_id = "${user_id}" ) "EXISTS" FROM dual`
        );
        const result = rows[0].EXISTS;
        if (result) {
            const [user_role] = await promisePool.query(
                `SELECT role FROM login WHERE user_id = ${user_id}`
            )
            const role = user_role[0].role;
            if(role != "admin"){
                return res.status(401).json({ msg: "role is invaild." });
            }
        } else {
            return res.status(401).json({ msg: "User not exists." });
        }
        
        try {


            const [result] = await promisePool.query(
                `SELECT CURRENT_DATE() AS today,
                        ROUND(SUM(IF(DateDiff(record.begin_time,CURRENT_DATE())=0, record.period, 0))/60) AS today_time
                 FROM record
                `
                );
            // Send success message to the client
            res.send(result);

        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route   GET /admin/recordNumToday
// @desc    当日咨询数量变化（每4小时）
// @access  Private
router.get(
    "/recordNumToday", [
    check("user_id", "user_id is required").notEmpty(), // Check the user_id
    ],
    async(req, res) => {
        // Check for errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        // Return the errors
        return res.status(400).json({ errors: errors.array() });
        }

        // Check user_id
        let user_id = req.query.user_id;
        const [rows] = await promisePool.query(
            `SELECT EXISTS(SELECT * from login WHERE user_id = "${user_id}" ) "EXISTS" FROM dual`
        );
        const result = rows[0].EXISTS;
        if (result) {
            const [user_role] = await promisePool.query(
                `SELECT role FROM login WHERE user_id = ${user_id}`
            )
            const role = user_role[0].role;
            if(role != "admin"){
                return res.status(401).json({ msg: "role is invaild." });
            }
        } else {
            return res.status(401).json({ msg: "User not exists." });
        }

        try {
            var results = new Array();
            for(let hourGroup = 0; hourGroup < 6; hourGroup++){
                const [recentRank] = await promisePool.query(
                    `SELECT CURRENT_DATE AS today,
                            COUNT(HOUR(todayRecord.begin_time) >= ${hourGroup}*4 AND 
                                  HOUR(todayRecord.begin_time) < (${hourGroup}+1)*4 OR NULL) AS Num
                     FROM ( SELECT * FROM record
                            WHERE DateDiff(record.begin_time,CURRENT_DATE())=0) AS todayRecord
                    `);
                const count = recentRank[0].Num;

                // Create user object
                let result = {
                    hourGroup,
                    count,
                };

                results[hourGroup] = result;
                console.log(results);
            }

            // Send success message to the client
            res.send(results);
        
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route GET /admin/getOnlineCounConversationNum
// @desc  获取当前在线的咨询师总会话数
// @access  Public
router.get(
    "/getOnlineCounConversationNum",[
        check("user_id", "user_id is required").notEmpty(), // Check the user_id
    ],
    async (req, res) => {

        // Check user_id
        let user_id = req.query.user_id;
        const [rows] = await promisePool.query(
            `SELECT EXISTS(SELECT * from login WHERE user_id = "${user_id}" ) "EXISTS" FROM dual`
        );
        const result = rows[0].EXISTS;
        if (result) {
            const [user_role] = await promisePool.query(
                `SELECT role FROM login WHERE user_id = ${user_id}`
            )
            const role = user_role[0].role;
            if(role != "admin"){
                return res.status(401).json({ msg: "role is invaild." });
            }
        } else {
            return res.status(401).json({ msg: "User not exists." });
        }

        try {
            const [rows] = await promisePool.query(
                `SELECT SUM(conversation_num) AS onlineCoun_conversation_num
                 FROM counsellor WHERE coun_status = "busy" OR coun_status = "free"
                 `
            );
            const row = rows[0];

            if (row == undefined) {
                return res.status(401).json({msg : "No counsellor."});
            } else {
                return res.status(200).json({
                    "onlineCoun_conversation_num": row.onlineCoun_conversation_num
                });
            }
        } catch (err) {
            throw err;
        }
    }
);

// @route GET /admin/getOnlineSupConversationNum
// @desc  获取当前在线的督导总会话数
// @access  Public
router.get(
    "/getOnlineSupConversationNum",[
        check("user_id", "user_id is required").notEmpty(), // Check the user_id
    ],
    async (req, res) => {

        // Check user_id
        let user_id = req.query.user_id;
        const [rows] = await promisePool.query(
            `SELECT EXISTS(SELECT * from login WHERE user_id = "${user_id}" ) "EXISTS" FROM dual`
        );
        const result = rows[0].EXISTS;
        if (result) {
            const [user_role] = await promisePool.query(
                `SELECT role FROM login WHERE user_id = ${user_id}`
            )
            const role = user_role[0].role;
            if(role != "admin"){
                return res.status(401).json({ msg: "role is invaild." });
            }
        } else {
            return res.status(401).json({ msg: "User not exists." });
        }

        try {
            const [rows] = await promisePool.query(
                `SELECT SUM(conversation_num) AS onlineSup_conversation_num
                 FROM supervisor WHERE sup_status = "busy" OR sup_status = "free"
                 `
            );
            const row = rows[0];

            if (row == undefined) {
                return res.status(401).json({msg : "No supervisor."});
            } else {
                return res.status(200).json({
                    "onlineSup_conversation_num": row.onlineSup_conversation_num
                });
            }
        } catch (err) {
            throw err;
        }
    }
);

module.exports = router;
