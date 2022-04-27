// Imports
const express = require("express"); // Create router
const { check, validationResult } = require("express-validator"); // Check and validate the inputs
const promisePool = require("../config/db"); // Import instance of mysql pool

// Init router
const router = express.Router();

// Endpoints
/**
 * 访客创建咨询记录
 * 咨询师补全咨询记录
 * 开启求助督导会话
 * 获取record_id
 * 获取某个咨询师的咨询记录列表
 * 获取督导及其绑定的咨询师的咨询记录列表
 * 获取所有人的咨询记录列表
 * 获取咨询师或督导的今日咨询数
 * 获取咨询师或督导的今日咨询时长
 * 获取咨询师或督导的累计咨询数
 * 获取最近n个咨询/求助记录
 * 查看/导出咨询记录
 * 同步聊天记录
 * 获取会话进行状态
 */

// @route   POST /record
// @desc    访客创建咨询记录
// @access  Public

router.post(
    "/", [
        check("visitor_id", "visitor_id is required").notEmpty(), // Check the visitor_id
        check("coun_id", "coun_id is required").notEmpty(), // Check the coun_id
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
                begin_time,
            } = req.body;

            let tmp = new Date(begin_time);

            function checkTime(i) {
                if (i < 10) {
                    i = "0" + i
                }
                return i;
            }
            let begin_timestamp = tmp.getFullYear() + '-' +
                                checkTime(tmp.getMonth() + 1) + '-' +
                                checkTime(tmp.getDate()) + ' ' +
                                checkTime(tmp.getHours()) + ':' +
                                checkTime(tmp.getMinutes()) + ':' +
                                checkTime(tmp.getSeconds());

            try {
                // Add record in the DB
                await promisePool.query(
                    `INSERT INTO record (visitor_id, coun_id, begin_time) VALUES ("${visitor_id}", "${coun_id}", "${begin_timestamp}")`
                );

                const [rows] = await promisePool.query(
                    `SELECT conversation_num from counsellor WHERE coun_id = '${coun_id}'`
                );

                // Extract role from rows
                let num = rows[0].conversation_num;

                num = num + 1;

                await promisePool.query(
                    `UPDATE counsellor SET conversation_num = '${num}' where coun_id = '${coun_id}'`
                );

                const [id] = await promisePool.query(
                    `SELECT record_id from record where visitor_id = '${visitor_id}' and coun_id = '${coun_id}' order by begin_time desc limit 1`
                );

                let record_id = id[0].record_id;

                res.json( {record_id : record_id});

            } catch (err) {
                // Catch errors
                throw err;
            }
    }
);

// @route   POST /record/complete
// @desc    咨询师补全咨询记录
// @access  Public
router.post(
    "/complete",
    async(req, res) => {
        // Check for errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return the errors
            return res.status(400).json({ errors: errors.array() });
        }

        // Extract info from the body
        let {
            visitor,
            coun,
            help_or_not,
            sup,
            end_time,
        } = req.body;

        let visitor_id = 0;
        let coun_id = 0;
        let sup_id = 0;
        let sup_num = 0;
        let coun_num = 0;

        try {
            const [v_id] = await promisePool.query(
                `SELECT user_id, role from login where user_name = '${visitor}'`
            );

            let v_role = v_id[0].role;

            if(v_role == "visitor")  {
                visitor_id = v_id[0].user_id;
            } else {
                return res.status(401).json({ msg: "visitor不是访客的user_name！！" });
            }

            const [c_id] = await promisePool.query(
                `SELECT user_id, role from login where user_name = '${coun}'`
            );

            let c_role = c_id[0].role;

            if(c_role == "counsellor")  {
                coun_id = c_id[0].user_id;
            } else {
                return res.status(401).json({ msg: "coun不是咨询师的user_name！！" });
            }

            if (sup == "无"){
                sup_id = -1;
            } else {
                const [s_id] = await promisePool.query(
                    `SELECT user_id, role from login where user_name = '${sup}'`
                );

                let s_role = s_id[0].role;

                if (s_role == "supervisor") {
                    sup_id = s_id[0].user_id;
                } else {
                    return res.status(401).json({msg: "sup不是督导的user_name！！"});
                }
            }

            const [id] = await promisePool.query(
                `SELECT record_id from record where visitor_id = '${visitor_id}' and coun_id = '${coun_id}' order by begin_time desc limit 1`
            );

            let record_id = id[0].record_id;

            // Add record in the DB
            await promisePool.query(
                `UPDATE record SET help_or_not = '${help_or_not}', sup_id = '${sup_id}', end_time = '${end_time}' where record_id = '${record_id}'`
            );

            const [row] = await promisePool.query(
                `SELECT begin_time from record where record_id = '${record_id}'`
            );

            let begin_time = row[0].begin_time;


            /**
             * 时间处理
             * 如果时间小于10 ，则再前面加一个'0'
             * */
             function checkTime(i) {
                if (i < 10) {
                    i = "0" + i
                }
                return i;
            }
            let newBegin_time = begin_time.getFullYear() + '-' +
                        checkTime(begin_time.getMonth() + 1) + '-' +
                        checkTime(begin_time.getDate()) + ' ' +
                        checkTime(begin_time.getHours()) + ':' +
                        checkTime(begin_time.getMinutes()) + ':' +
                        checkTime(begin_time.getSeconds());

            // Add record in the DB
            await promisePool.query(
                `UPDATE record SET period = timestampdiff(second, "${newBegin_time}", "${end_time}") where record_id = '${record_id}'`
            );

            const [rows] = await promisePool.query(
                `SELECT conversation_num from counsellor WHERE coun_id = '${coun_id}'`
            );

            // Extract role from rows
            coun_num = rows[0].conversation_num;

            coun_num = coun_num - 1;

            await promisePool.query(
                `UPDATE counsellor SET conversation_num = '${coun_num}' where coun_id = '${coun_id}'`
            );

            if(help_or_not = 1) {
                const [rows] = await promisePool.query(
                    `SELECT conversation_num from supervisor WHERE sup_id = '${sup_id}'`
                );

                // Extract role from rows
                sup_num = rows[0].conversation_num;

                sup_num = sup_num - 1;

                await promisePool.query(
                    `UPDATE supervisor SET conversation_num = '${sup_num}' where sup_id = '${sup_id}'`
                );
            } else {
                const [rows] = await promisePool.query(
                    `SELECT conversation_num from supervisor WHERE sup_id = '${sup_id}'`
                );

                // Extract role from rows
                sup_num = rows[0].conversation_num;

                await promisePool.query(
                    `UPDATE supervisor SET conversation_num = '${sup_num}' where sup_id = '${sup_id}'`
                );
            }


            // Send success message to the client
            res.json({msg:"Record created"});

        } catch (err) {
            // Catch errors
            throw err;
        }

    }
);

// @route   POST /record/help
// @desc    开启求助督导会话
// @access  Public
router.post(
    "/help",
    async(req, res) => {
        // Check for errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return the errors
            return res.status(400).json({ errors: errors.array() });
        }

        // Extract info from the body
        let {
            visitor,
            coun,
            sup,
        } = req.body;

        let help_or_not = 1;
        let visitor_id = 0;
        let coun_id = 0;
        let sup_id = 0;

        try {
            const [v_id] = await promisePool.query(
                `SELECT user_id, role from login where user_name = '${visitor}'`
            );

            let v_role = v_id[0].role;

            if(v_role == "visitor")  {
                visitor_id = v_id[0].user_id;
            } else {
                return res.status(401).json({ msg: "visitor不是访客的user_name！！" });
            }

            const [c_id] = await promisePool.query(
                `SELECT user_id, role from login where user_name = '${coun}'`
            );

            let c_role = c_id[0].role;

            if(c_role == "counsellor")  {
                coun_id = c_id[0].user_id;
            } else {
                return res.status(401).json({ msg: "coun不是咨询师的user_name！！" });
            }

            const [s_id] = await promisePool.query(
                `SELECT user_id, role from login where user_name = '${sup}'`
            );

            let s_role = s_id[0].role;

            if(s_role == "supervisor")  {
                sup_id = s_id[0].user_id;
            } else {
                return res.status(401).json({ msg: "sup不是督导的user_name！！" });
            }

            const [id] = await promisePool.query(
                `SELECT record_id from record where visitor_id = '${visitor_id}' and coun_id = '${coun_id}' order by begin_time desc limit 1`
            );

            let record_id = id[0].record_id;

            // Add record in the DB
            await promisePool.query(
                `UPDATE record SET help_or_not = '${help_or_not}', sup_id = '${sup_id}' where record_id = '${record_id}'`
            );

            const [rows] = await promisePool.query(
                `SELECT conversation_num from supervisor WHERE sup_id = '${sup_id}'`
            );

            // Extract role from rows
            let num = rows[0].conversation_num;

            num = num + 1;

            await promisePool.query(
                `UPDATE supervisor SET conversation_num = '${num}' where sup_id = '${sup_id}'`
            );

            // Send success message to the client
            res.json({msg:"Record created"});

        } catch (err) {
            // Catch errors
            throw err;
        }

    }
);

// @route   GET /recordID
// @desc    获取record_id
// @access  Public
router.get(
    "/recordID", [
        check("from_user", "发送方的user_name is required").notEmpty(),
        check("to_user", "接收方的user_name is required").notEmpty(),
    ],
    async(req, res) => {
        // Check for errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return the errors
            return res.status(400).json({ errors: errors.array() });
        }

        // Extract info from the body
        let from_user = req.query.from_user;
        let to_user = req.query.to_user;
        let from_role = "default";
        let to_role = "default";
        let from_id = 0;
        let to_id = 0;
        let record_id = 0;

        try {

            let [from_rows] = await promisePool.query(
                `SELECT role, user_id from login where user_name = '${from_user}'`
            );
            from_role = from_rows[0].role;
            from_id = from_rows[0].user_id;

            let [to_rows] = await promisePool.query(
                `SELECT role, user_id from login where user_name = '${to_user}'`
            );
            to_role = to_rows[0].role;
            to_id = from_rows[0].user_id;

            if (from_role == "visitor") {
                return res.status(401).json({msg: "发送方不能为访客！！"});
            } else if (from_role == "counsellor") {
                if(to_role == "visitor"){
                    let [rows] = await promisePool.query(
                        `SELECT record_id from record where visitor_id = '${to_id}' and coun_id = '${from_id}'
                 ORDER BY begin_time desc LIMIT 1`
                    );
                    record_id = rows[0].record_id;
                } else if(to_role == "supervisor") {
                    let [rows] = await promisePool.query(
                        `SELECT record_id from record where coun_id = '${from_id}' and sup_id = '${to_id}'
                 ORDER BY begin_time desc LIMIT 1`
                    );
                    record_id = rows[0].record_id;
                } else {
                    return res.status(401).json({msg: "发送方为咨询师时接收方不能为咨询师！！"});
                }
            } else if (from_role == "supervisor") {
                if(to_role == "counsellor"){
                    let [rows] = await promisePool.query(
                        `SELECT record_id from record where coun_id = '${to_id}' and sup_id = '${from_id}'
                 ORDER BY begin_time desc LIMIT 1`
                    );
                    record_id = rows[0].record_id;
                } else {
                    return res.status(401).json({msg: "发送方为督导时接收方只能为咨询师！！"});
                }
            }

            res.json({record_id : record_id});

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
                ` SELECT record_id, visitor.visitor_name, counsellor.coun_name, help_or_not, supervisor.sup_name, begin_time, end_time,
                         period, score, vis_to_coun_comment, coun_to_vis_comment
                  FROM record JOIN feed ON record.record_id = feed.feed_id
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
                `SELECT record.record_id, visitor.visitor_id, visitor.visitor_name,
                        counsellor.coun_id, counsellor.coun_name,
                        record.help_or_not, supervisor.sup_id, supervisor.sup_name,
                        record.begin_time, record.end_time, record.period,
                        score, vis_to_coun_comment, coun_to_vis_comment
                 FROM record JOIN bind ON record.sup_id = bind.sup_id AND record.coun_id = bind.coun_id
                             LEFT JOIN supervisor ON record.sup_id = supervisor.sup_id
                             LEFT JOIN counsellor ON record.coun_id = counsellor.coun_id
                             LEFT JOIN visitor ON record.visitor_id = visitor.visitor_id
                             JOIN feed ON record.record_id = feed.feed_id
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
                `SELECT record_id, visitor.visitor_name, counsellor.coun_name, help_or_not, supervisor.sup_name, begin_time, end_time, period,
                        score, vis_to_coun_comment, coun_to_vis_comment
                 FROM record INNER JOIN visitor ON record.visitor_id = visitor.visitor_id
                             INNER JOIN supervisor ON record.sup_id = supervisor.sup_id
                             INNER JOIN counsellor ON record.coun_id = counsellor.coun_id
                             JOIN feed ON record.record_id = feed.feed_id
                 ORDER BY record_id DESC
                `
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
                            ROUND(SUM(IF(DateDiff(record.begin_time,CURRENT_DATE())=0, record.period, 0))) AS today_time
                     FROM counsellor JOIN login ON login.user_id = counsellor.coun_id
                                     LEFT JOIN record ON counsellor.coun_id = record.coun_id
                     WHERE counsellor.coun_id = ${user_id}`
                );
                    // Send success message to the client
                    res.send(result);
            } else if(ur == "supervisor"){
                const [result] = await promisePool.query(
                    `SELECT supervisor.sup_id, supervisor.sup_name, login.role, 
                            ROUND(SUM(IF(DateDiff(record.begin_time,CURRENT_DATE())=0, record.period, 0))) AS today_time
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

// @route   GET /record/allNumandTime
// @desc    获取咨询师或督导的累计咨询次数+时长
// @access  Public

router.get(
    "/allNumandTime", [
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
                            COUNT(record.record_id OR NULL) AS all_num, ROUND(SUM(record.period)) AS all_seconds
                     FROM counsellor JOIN login ON login.user_id = counsellor.coun_id
                                     LEFT JOIN record ON counsellor.coun_id = record.coun_id
                     WHERE counsellor.coun_id = ${user_id}`
                );
                    // Send success message to the client
                    res.send(result);
            } else if(ur == "supervisor"){
                const [result] = await promisePool.query(
                    `SELECT supervisor.sup_id, supervisor.sup_name, login.role, 
                            COUNT(record.record_id OR NULL) AS all_num, ROUND(SUM(record.period)) AS all_seconds
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
                    `SELECT record.record_id, visitor.visitor_id, visitor.visitor_name,
                                              counsellor.coun_id, counsellor.coun_name,
                            record.help_or_not,supervisor.sup_id, supervisor.sup_name,
                            record.begin_time, record.end_time, record.period,
                            score, vis_to_coun_comment, coun_to_vis_comment
                     FROM record LEFT JOIN visitor ON record.visitor_id = visitor.visitor_id
                                 LEFT JOIN counsellor ON record.coun_id = counsellor.coun_id
                                 LEFT JOIN supervisor ON record.sup_id = supervisor.sup_id
                                 JOIN feed ON record.record_id = feed.feed_id
                     WHERE record.coun_id = ${user_id}
                     ORDER BY record.begin_time DESC
                     LIMIT ${n}`
                );
                    // Send success message to the client
                    res.send(result);
            } else if(ur == "supervisor"){
                const [result] = await promisePool.query(
                    `SELECT record.record_id, visitor.visitor_id, visitor.visitor_name,
                                              counsellor.coun_id, counsellor.coun_name,
                            record.help_or_not,supervisor.sup_id, supervisor.sup_name,
                            record.begin_time, record.end_time, record.period
                     FROM record LEFT JOIN visitor ON record.visitor_id = visitor.visitor_id
                                 LEFT JOIN counsellor ON record.coun_id = counsellor.coun_id
                                 LEFT JOIN supervisor ON record.sup_id = supervisor.sup_id
                                 JOIN feed ON record.record_id = feed.feed_id
                     WHERE record.sup_id = ${user_id}
                     ORDER BY record.begin_time DESC
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

// @route   GET /record/content
// @desc    查看/导出咨询记录
// @access  Public

router.get(
    "/content", [
        check("record_id", "record_id is required.").notEmpty(), // check record_id
    ],
    async(req, res) => {
        // Check for errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return the errors
            return res.status(400).json({errors: errors.array()});
        }

        const record_id = req.query.record_id;
        let from_role = "default";
        let to_role = "default";
        let from_name = "default";
        let to_name = "default";
        let from_user = "default";
        let to_user = "default";
        let from_theName = "from_name";
        let to_theName = "to_name";

        try {
            const [message] = await promisePool.query(
                `SELECT from_user, to_user, msg_time, text, msg_key from message where record_id = '${record_id}' ORDER BY msg_time`
            );

            for (let i = 0; i < message.length; i++) {
                from_user = message[i].from_user;
                to_user = message[i].to_user;

                // 时间格式转换
                function getDate(n) {
                    let msg_ts = new Date(n),
                    y = msg_ts.getFullYear(),
                    m = msg_ts.getMonth() + 1,
                    d = msg_ts.getDate();
                    return y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d) + " " + msg_ts.toTimeString().substr(0, 8);
                }
                let time = getDate(message[i].msg_time);
                message[i].msg_time = time;


                let [from_rows] = await promisePool.query(
                    `SELECT role from login where user_name = '${from_user}'`
                );
                from_role = from_rows[0].role;

                if (from_role == "visitor") {
                    let [vnames] = await promisePool.query(
                        `SELECT visitor_name from login INNER JOIN visitor ON login.user_id = visitor.visitor_id where user_name = '${from_user}'`
                    );
                    from_name = vnames[0].visitor_name;
                } else if (from_role == "counsellor") {
                    let [cnames] = await promisePool.query(
                        `SELECT coun_name from login INNER JOIN counsellor ON login.user_id = counsellor.coun_id where user_name = '${from_user}'`
                    );
                    from_name = cnames[0].coun_name;
                } else if (from_role == "supervisor") {
                    let [snames] = await promisePool.query(
                        `SELECT sup_name from login INNER JOIN supervisor ON login.user_id = supervisor.sup_id where user_name = '${from_user}'`
                    );
                    from_name = snames[0].sup_name;
                } else {
                    return res.status(401).json({msg: "参与会话的角色异常！！"});
                }

                let [to_rows] = await promisePool.query(
                    `SELECT role from login where user_name = '${to_user}'`
                );
                to_role = to_rows[0].role;

                if (to_role == "visitor") {
                    let [vnames] = await promisePool.query(
                        `SELECT visitor_name from login INNER JOIN visitor ON login.user_id = visitor.visitor_id where user_name = '${to_user}'`
                    );
                    to_name = vnames[0].visitor_name;
                } else if (to_role == "counsellor") {
                    let [cnames] = await promisePool.query(
                        `SELECT coun_name from login INNER JOIN counsellor ON login.user_id = counsellor.coun_id where user_name = '${to_user}'`
                    );
                    to_name = cnames[0].coun_name;
                } else if (to_role == "supervisor") {
                    let [snames] = await promisePool.query(
                        `SELECT sup_name from login INNER JOIN supervisor ON login.user_id = supervisor.sup_id where user_name = '${to_user}'`
                    );
                    to_name = snames[0].sup_name;
                } else {
                    return res.status(401).json({msg: "参与会话的角色异常！！"});
                }

                message[i][from_theName] = from_name;
                message[i][to_theName] = to_name;

            }

            res.send(message);

        } catch (err) {
            // Catch errors
            throw err;
        }

    }
);

// @route   GET /record/sync
// @desc    同步聊天记录
// @access  Public

router.get(
    "/sync", [
        check("coun", "咨询师的user_name is required.").notEmpty(),
        check("sup", "督导的user_name is required.").notEmpty(),
    ],
    async(req, res) => {
        // Check for errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return the errors
            return res.status(400).json({errors: errors.array()});
        }

        let coun = req.query.coun;
        let sup = req.query.sup;
        let coun_id = 0;
        let sup_id = 0;
        let record_id = 0;
        let from_role = "default";
        let to_role = "default";
        let from_name = "default";
        let to_name = "default";
        let from_user = "default";
        let to_user = "default";
        let from_theName = "from_name";
        let to_theName = "to_name";

        try {

            const [c_id] = await promisePool.query(
                `SELECT user_id, role from login where user_name = '${coun}'`
            );

            let c_role = c_id[0].role;

            if(c_role == "counsellor")  {
                coun_id = c_id[0].user_id;
            } else {
                return res.status(401).json({ msg: "coun不是咨询师的user_name！！" });
            }

            const [s_id] = await promisePool.query(
                `SELECT user_id, role from login where user_name = '${sup}'`
            );

            let s_role = s_id[0].role;

            if(s_role == "supervisor")  {
                sup_id = s_id[0].user_id;
            } else {
                return res.status(401).json({ msg: "sup不是督导的user_name！！" });
            }

            const [id] = await promisePool.query(
                `SELECT record_id from record where coun_id = '${coun_id}' and sup_id = '${sup_id}' order by begin_time desc limit 1`
            );

            record_id = id[0].record_id;

            const [message] = await promisePool.query(
                `SELECT from_user, to_user, msg_time, text, msg_key from message where record_id = '${record_id}'`
            );

            for (let i = 0; i < message.length; i++) {
                from_user = message[i].from_user;
                to_user = message[i].to_user;

                // 时间格式转换
                function getDate(n) {
                    let msg_ts = new Date(n),
                    y = msg_ts.getFullYear(),
                    m = msg_ts.getMonth() + 1,
                    d = msg_ts.getDate();
                    return y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d) + " " + msg_ts.toTimeString().substr(0, 8);
                }
                let time = getDate(message[i].msg_time);
                message[i].msg_time = time;
                console.log(time);

                let [from_rows] = await promisePool.query(
                    `SELECT role from login where user_name = '${from_user}'`
                );
                from_role = from_rows[0].role;

                if (from_role == "visitor") {
                    let [vnames] = await promisePool.query(
                        `SELECT visitor_name from login INNER JOIN visitor ON login.user_id = visitor.visitor_id where user_name = '${from_user}'`
                    );
                    from_name = vnames[0].visitor_name;
                    message[i][from_theName] = from_name;
                } else if (from_role == "counsellor") {
                    let [cnames] = await promisePool.query(
                        `SELECT coun_name from login INNER JOIN counsellor ON login.user_id = counsellor.coun_id where user_name = '${from_user}'`
                    );
                    from_name = cnames[0].coun_name;
                    message[i][from_theName] = from_name;
                } else if (from_role == "supervisor") {
                    message.splice(i,1);
                    i = i - 1;
                    continue;
                } else {
                    return res.status(401).json({msg: "参与会话的角色异常！！"});
                }

                let [to_rows] = await promisePool.query(
                    `SELECT role from login where user_name = '${to_user}'`
                );
                to_role = to_rows[0].role;

                if (to_role == "visitor") {
                    let [vnames] = await promisePool.query(
                        `SELECT visitor_name from login INNER JOIN visitor ON login.user_id = visitor.visitor_id where user_name = '${to_user}'`
                    );
                    to_name = vnames[0].visitor_name;
                    message[i][to_theName] = to_name;
                } else if (to_role == "counsellor") {
                    let [cnames] = await promisePool.query(
                        `SELECT coun_name from login INNER JOIN counsellor ON login.user_id = counsellor.coun_id where user_name = '${to_user}'`
                    );
                    to_name = cnames[0].coun_name;
                    message[i][to_theName] = to_name;
                } else if (to_role == "supervisor") {
                    message.splice(i,1);
                    i = i - 1;

                } else {
                    return res.status(401).json({msg: "参与会话的角色异常！！"});
                }
            }

            res.send(message);

        } catch (err) {
            // Catch errors
            throw err;
        }

    }
);

// @route   GET /record/endOrNot
// @desc    获取会话进行状态
// @access  Public

router.get(
    "/endOrNot", [
        check("coun", "咨询师的user_name is required.").notEmpty(),
        check("sup", "督导的user_name is required.").notEmpty(),
    ],
    async(req, res) => {
        // Check for errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return the errors
            return res.status(400).json({errors: errors.array()});
        }

        let coun = req.query.coun;
        let sup = req.query.sup;
        let coun_id = 0;
        let sup_id = 0;
        let record_id = 0;
        let period = 0;

        try {

            const [c_id] = await promisePool.query(
                `SELECT user_id, role from login where user_name = '${coun}'`
            );

            let c_role = c_id[0].role;

            if(c_role == "counsellor")  {
                coun_id = c_id[0].user_id;
            } else {
                return res.status(401).json({ msg: "coun不是咨询师的user_name！！" });
            }

            const [s_id] = await promisePool.query(
                `SELECT user_id, role from login where user_name = '${sup}'`
            );

            let s_role = s_id[0].role;

            if(s_role == "supervisor")  {
                sup_id = s_id[0].user_id;
            } else {
                return res.status(401).json({ msg: "sup不是督导的user_name！！" });
            }

            const [id] = await promisePool.query(
                `SELECT record_id from record where coun_id = '${coun_id}' and sup_id = '${sup_id}' order by begin_time desc limit 1`
            );

            record_id = id[0].record_id;

            const [row] = await promisePool.query(
                `SELECT * from record where record_id = '${record_id}'`
            );

            period = row[0].period

            if (period > 0) {
                res.json({isEnd:"true", record_id:record_id});
            } else {
                res.json({isEnd:"false", record_id:record_id});
            }


        } catch (err) {
            // Catch errors
            throw err;
        }

    }
);

module.exports = router;
