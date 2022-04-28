// Imports
const express = require("express"); // Create router
const bcrypt = require("bcryptjs"); // Encrypt password
const auth = require("../middleware/auth"); // Middleware
const { check, validationResult } = require("express-validator"); // Check and validate the inputs
const promisePool = require("../config/db"); // Import instance of mysql pool
const { ResultWithContext } = require("express-validator/src/chain");

// Init router
const router = express.Router();

// Endpoints
/**
 * 修改管理员信息
 * 修改咨询师信息
 * 修改督导信息
 * 删除管理员
 * 删除咨询师
 * 删除督导
 */

// @route   PUT /editUsers/admin
// @desc    修改管理员信息
// @access  Private
router.put(
    "/admin", [
        //auth,
        check("user_name", "请填写正确的用户名").isLength({max:32, min:2}), // Check the user_name
        check(
            "user_password",
            "密码需要至少6位"
        ).isLength({ min: 6 }), // Check the password
        check("admin_name", "请填写姓名").notEmpty(), // Check the admin_name
        check("admin_gender", "请填写性别").notEmpty(), // Check the gender
        check("admin_phone", "手机号不正确").isLength(11), // Check the phone
    ],
    async(req, res) => {
        // Extract user id from req
        try {
            // Check for errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // Return the errors
                return res.status(400).json({ errors: errors.array() });
            }

            // Extract info from the body
            let {
                user_id,
                user_name,
                user_password,
                admin_name,
                admin_gender,
                admin_phone,
            } = req.body;

            // Create user object
            const user = {
                user_id,
                user_name,
                user_password,
                admin_name,
                admin_gender,
                admin_phone,
            };

            // Check gender
            if (
                admin_gender !== "Male" &&
                admin_gender !== "Female" &&
                admin_gender !== "Other"
            ) {
                return res.status(400).json({ msg: "性别不合法" });
            }

            // Check admin_name
            var reg_name = /^[^\\;!@#$%\^&\*\(\)￥……（）]{2,32}$/;
            if(!reg_name.test(admin_name)){
                return res.status(400).json({ msg: "姓名不合法"});
            }

            // Check user_name
            var reg_userN = /^[a-zA-Z_]+$/;
            if(!reg_userN.test(user_name)){
                return res.status(400).json({ msg: "用户名不合法"});
            }

            // Check phone
            var reg_ph = /^1[0-9]{10}/;
            if(!reg_ph.test(admin_phone)){
                return res.status(400).json({ msg: "手机号不合法" });
            }

            // Check if user exists
            const [rows] = await promisePool.query(
                `SELECT EXISTS(SELECT * from login WHERE user_id = '${user_id}') "EXISTS" FROM DUAL`
            );
            const result = rows[0].EXISTS;

            if (!result) {
                // User doesn't exist
                return res.status(400).json({ msg: "User doesn't exist" });
            } else {
                // Encrypt Password
                const salt = await bcrypt.genSalt(10);
                user_password = await bcrypt.hash(user_password, salt);

                // Update details in logins table
                await promisePool.query(
                    `UPDATE login SET user_name='${user_name}', user_password='${user_password}' WHERE user_id=${user_id}`
                );

                // Update details in admins table
                await promisePool.query(
                    `UPDATE admin SET admin_name='${admin_name}', admin_gender='${admin_gender}', admin_phone='${admin_phone}' WHERE admin_id=${user_id}`
                );

                // Send updated details to the client
                res.send(user);
            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route   PUT /editUsers/counsellor
// @desc    修改咨询师信息
// @access  Private
router.put(
    "/counsellor", [
        check("user_id", "请填写用户id").notEmpty(),
        check("user_name", "请填写正确的用户名").isLength({max:32, min:2}), // Check the user_name
        //check("user_password","密码需要至少6位").isLength({ min:  6}), // Check the password
        check("coun_name", "请填写姓名").notEmpty(), // Check the coun_name
        check("coun_gender", "请填写性别").notEmpty(), // Check the gender
        check("coun_phone", "手机号不正确").isLength(11), // Check the phone
        check("coun_age", "请填写正确的年龄").isInt(), // Check the age
        check("coun_email", "请填写正确的邮箱地址").isEmail(), // Check the email
        check("coun_company", "请填写工作单位").notEmpty(), // check the company
        check("coun_title", "请填写职称").notEmpty(), // Check the title
        check("coun_identity", "身份证号不正确").isLength(18) // Check the identity
    ],
    async(req, res) => {
        try {
            // Check for errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // Return the errors
                return res.status(400).json({ errors: errors.array() });
            }

                // Extract info from the body
            let {
                user_id,
                user_name,
                //user_password,
                coun_name,
                coun_gender,
                coun_phone,
                coun_avatar,
                coun_age,
                coun_identity,
                coun_email,
                coun_company,
                coun_title,
            } = req.body;

            // Create user object
            const user = {
                user_id,
                user_name,
                //user_password,
                coun_name,
                coun_gender,
                coun_phone,
                coun_avatar,
                coun_age,
                coun_identity,
                coun_email,
                coun_company,
                coun_title,
            };

            // Check gender
            if (
                coun_gender !== "Male" &&
                coun_gender !== "Female" &&
                coun_gender !== "Other"
            ) {
                return res.status(400).json({ msg: "性别不合法" });
            }

                  // Check identity
            var reg_id = /^[1-9]\d{5}(18|19|20|(3\d))\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
            if(!reg_id.test(coun_identity)){
                return res.status(400).json({ msg: "身份证不合法" });
            }

            // Check phone
            var reg_ph = /^1[0-9]{10}/;
            if(!reg_ph.test(coun_phone)){
                return res.status(400).json({ msg: "手机号不合法" });
            }

            // Check coun_name
            var reg_name = /^[^\\;!@#$%\^&\*\(\)￥……（）]{2,32}$/;
            if(!reg_name.test(coun_name)){
                return res.status(400).json({ msg: "姓名不合法"});
            }

            // Check user_name
            var reg_userN = /^[a-zA-Z_]+$/;
            if(!reg_userN.test(user_name)){
                return res.status(400).json({ msg: "用户名不合法"});
            }

            // Check if user exists
            const [rows] = await promisePool.query(
                `SELECT EXISTS(SELECT * from login WHERE user_id=${user_id}) "EXISTS" FROM dual`
            );
            const result = rows[0].EXISTS;

            if (!result) {
                // User doesn't exists
                return res.status(400).json({ msg: "User doesn't exists" });
            } else {

                // Encrypt Password
                // const salt = await bcrypt.genSalt(10);
                // user_password = await bcrypt.hash(user_password, salt);

                // Update details in logins table
                await promisePool.query(
                    `UPDATE login SET user_name='${user_name}' WHERE user_id=${user_id}`
                );

                // Update details in counsellors table
                await promisePool.query(
                    `UPDATE counsellor SET coun_name='${coun_name}',
                                           coun_gender='${coun_gender}',
                                           coun_phone='${coun_phone}',
                                           coun_avatar='${coun_avatar}',
                                           coun_age=${coun_age},
                                           coun_identity='${coun_identity}',
                                           coun_email='${coun_email}',
                                           coun_company='${coun_company}',
                                           coun_title='${coun_title}'
                     WHERE coun_id=${user_id}`
                );

                // Send updated details to the client
                res.send(user);
            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route   PUT /editUsers/supervisor
// @desc    修改督导信息
// @access  Private
router.put(
    "/supervisor", [
        check("user_name", "请填写正确的用户名").notEmpty(), // Check the user_name
        //check("user_password","密码需要至少6位").isLength({ min: 6 }), // Check the password
        check("sup_name", "请填写姓名").notEmpty(), // Check the sup_name
        check("sup_gender", "请填写性别").notEmpty(), // Check the gender
        check("sup_phone", "手机号不正确").isLength(11), // Check the phone
        check("sup_age", "请填写正确的年龄").isInt(), // Check the age
        check("sup_email", "请填写正确的邮箱地址").isEmail(), // Check the email
        check("sup_company", "请填写工作单位").notEmpty(), // check the company
        check("sup_title", "请填写职称").notEmpty(), // Check the title
        check("sup_identity", "身份证号不正确").isLength(18), // Check the identity
        check("sup_qualification", "请填写资格证书").notEmpty(), // Check the title
        check("sup_quaNumber", "请填写资格编号").notEmpty() // Check the title
    ],
    async(req, res) => {

        try {
            // Check for errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // Return the errors
                return res.status(400).json({ errors: errors.array() });
            }

            // Extract info from the body
            let {
                user_id,
                user_name,
                //user_password,
                sup_name,
                sup_gender,
                sup_phone,
                sup_avatar,
                sup_age,
                sup_identity,
                sup_email,
                sup_company,
                sup_title,
                sup_qualification,
                sup_quaNumber,
            } = req.body;

            // Create user object
            const user = {
                user_id,
                user_name,
                //user_password,
                sup_name,
                sup_gender,
                sup_phone,
                sup_avatar,
                sup_age,
                sup_identity,
                sup_email,
                sup_company,
                sup_title,
                sup_qualification,
                sup_quaNumber,
            };

            // Check gender
            if (
                sup_gender !== "Male" &&
                sup_gender !== "Female" &&
                sup_gender !== "Other"
            ) {
                return res.status(400).json({ msg: "性别不合法" });
            }

            // Check identity
            var reg_id = /^[1-9]\d{5}(18|19|20|(3\d))\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
            if(!reg_id.test(sup_identity)){
                return res.status(400).json({ msg: "身份证不合法" });
            }

            // Check phone
            var reg_ph = /^1[0-9]{10}/;
            if(!reg_ph.test(sup_phone)){
                return res.status(400).json({ msg: "手机号不合法" });
            }

            // Check sup_name
            var reg_name = /^[^\\;!@#$%\^&\*\(\)￥……（）]{2,32}$/;
            if(!reg_name.test(sup_name)){
                return res.status(400).json({ msg: "姓名不合法"});
            }
            
            // Check user_name
            var reg_userN = /^[a-zA-Z_]+$/;
            if(!reg_userN.test(user_name)){
            return res.status(400).json({ msg: "用户名不合法"});
            }

            // Check if user exists
            const [rows] = await promisePool.query(
                `SELECT EXISTS(SELECT * from login WHERE user_id=${user_id} ) "EXISTS" FROM DUAL`
            );
            const result = rows[0].EXISTS;

            if (!result) {
                // User doesn't exists
                return res.status(400).json({ msg: "User doesn't exists" });
            } else {
                // Encrypt Password
                const salt = await bcrypt.genSalt(10);
                user_password = await bcrypt.hash(user_password, salt);

                try {
                    // Update details in logins table
                    await promisePool.query(
                        `UPDATE login SET user_name='${user_name}' WHERE user_id=${user_id}`
                    );

                    // Update details in students table
                    await promisePool.query(
                        `UPDATE supervisor SET sup_name='${sup_name}', 
                                               sup_gender='${sup_gender}',
                                               sup_phone='${sup_phone}',
                                               sup_avatar='${sup_avatar}',
                                               sup_age=${sup_age},
                                               sup_identity='${sup_identity}',
                                               sup_email='${sup_email}',
                                               sup_company='${sup_company}',
                                               sup_title='${sup_title}',
                                               sup_qualification='${sup_qualification}',
                                               sup_quaNumber='${sup_quaNumber}'
                        WHERE sup_id=${user_id}`
                    );

                    // Send updated details to the client
                    res.send(user);

                } catch (err) {
                    // Catch errors
                    throw err;
                }
            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route   DELETE /editUsers/admin
// @desc    删除管理员
// @access  Private
router.delete(
    "/admin", 
    async(req, res) => {
        try {
            // Check for errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // Return the errors
                return res.status(400).json({ errors: errors.array() });
            }

            // Extract info from the body
            let {
                user_id,
                role,
            } = req.body;

            // Check if user exists
            const [rows] = await promisePool.query(
                `SELECT EXISTS(SELECT * from login WHERE user_id=${user_id} ) "EXISTS" FROM DUAL`
            );
            const result = rows[0].EXISTS;

            if (!result) {
                // User doesn't exists
                return res.status(400).json({ msg: "User doesn't exists" });
            } else {
                // Check role
                if ( role !== "admin") {
                    return res.status(401).json({ msg: "No authority! Only admin can delete users." });
                }

                try {
                    // Delete user in logins table
                    await promisePool.query(
                        `DELETE FROM login WHERE user_id=${user_id}`
                    );
                    
                    return res.status(200).json({ msg: "成功"});
                } catch (err) {
                    // Catch errors
                    throw err;
                }
            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route   DELETE /editUsers/counsellor
// @desc    删除咨询师
// @access  Private
router.delete(
    "/counsellor", 
    async(req, res) => {
        try {
            // Check for errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // Return the errors
                return res.status(400).json({ errors: errors.array() });
            }

            // Extract info from the body
            let {
                user_id,
                role,
            } = req.body;

            // Check if user exists
            const [rows] = await promisePool.query(
                `SELECT EXISTS(SELECT * from counsellor WHERE coun_id=${user_id} ) "EXISTS" FROM DUAL`
            );
            const result = rows[0].EXISTS;

            if (!result) {
                // User doesn't exists
                return res.status(400).json({ msg: "Counsellor doesn't exists" });
            } else {
                // Check role
                if ( role !== "admin") {
                    return res.status(401).json({ msg: "No authority! Only admin can delete users." });
                }

                try {
                    // Delete user in logins table
                    await promisePool.query(
                        `UPDATE counsellor SET coun_status='banned'
                         WHERE coun_id=${user_id}`
                    );

                    return res.status(200).json({ msg: "成功"});
                } catch (err) {
                    // Catch errors
                    throw err;
                }
            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);

// @route   DELETE /editUsers/supervisor
// @desc    删除督导
// @access  Private
router.delete(
    "/supervisor", 
    async(req, res) => {
        try {
            // Check for errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // Return the errors
                return res.status(400).json({ errors: errors.array() });
            }

            // Extract info from the body
            let {
                user_id,
                role,
            } = req.body;

            // Check if user exists
            const [rows] = await promisePool.query(
                `SELECT EXISTS(SELECT * from supervisor WHERE sup_id=${user_id} ) "EXISTS" FROM DUAL`
            );
            const result = rows[0].EXISTS;

            if (!result) {
                // User doesn't exists
                return res.status(400).json({ msg: "Supervisor doesn't exists" });
            } else {
                // Check role
                if ( role !== "admin") {
                    return res.status(401).json({ msg: "No authority! Only admin can delete users." });
                }

                try {
                    // Delete user in logins table
                    await promisePool.query(
                        `UPDATE supervisor SET sup_status='banned'
                        WHERE sup_id=${user_id}`
                    );

                    return res.status(200).json({ msg: "成功"});
                } catch (err) {
                    // Catch errors
                    throw err;
                }
            }
        } catch (err) {
            // Catch errors
            throw err;
        }
    }
);


module.exports = router;
