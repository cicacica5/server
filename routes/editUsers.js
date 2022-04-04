// Imports
const express = require("express"); // Create router
const bcrypt = require("bcryptjs"); // Encrypt password
const auth = require("../middleware/auth"); // Middleware
const { check, validationResult } = require("express-validator"); // Check and validate the inputs
const promisePool = require("../config/db"); // Import instance of mysql pool

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
        check("user_name", "user_name is required").notEmpty(), // Check the user_name
        check(
            "user_password",
            "Please enter a password with 6 or more characters"
        ).isLength({ min: 6 }), // Check the password
        check("admin_name", "Name is required").notEmpty(), // Check the admin_name
        check("admin_gender", "Gender is required").notEmpty(), // Check the gender
        check("admin_phone", "Phone is required").notEmpty(), // Check the phone
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
                return res.status(400).json({ msg: "Gender is not valid" });
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
        //auth,
        check("user_name", "user_name is required").notEmpty(), // Check the user_name
        check(
            "user_password",
            "Please enter a password with 6 or more characters"
        ).isLength({ min:  6}), // Check the password
        check("coun_name", "coun_name is required").notEmpty(), // Check the coun_name
        check("coun_gender", "Gender is required").notEmpty(), // Check the gender
        check("coun_phone", "Phone is required").notEmpty(), // Check the phone
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
                user_password,
                coun_name,
                coun_gender,
                coun_phone,
            } = req.body;

            // Create user object
            const user = {
                user_id,
                user_name,
                user_password,
                coun_name,
                coun_gender,
                coun_phone,
            };

            // Check gender
            if (
                coun_gender !== "Male" &&
                coun_gender !== "Female" &&
                coun_gender !== "Other"
            ) {
                return res.status(400).json({ msg: "Gender is not valid" });
            }

            // Check if user exists
            const [rows] = await promisePool.query(
                `SELECT EXISTS(SELECT * from login WHERE user_name = "${user_name}" AND user_id=${user_id}) "EXISTS" FROM DUAL`
            );
            const result = rows[0].EXISTS;

            if (!result) {
                // User doesn't exists
                return res.status(400).json({ msg: "User doesn't exists" });
            } else {
                // Encrypt Password
                const salt = await bcrypt.genSalt(10);
                user_password = await bcrypt.hash(user_password, salt);

                // Update details in logins table
                await promisePool.query(
                    `UPDATE login SET user_name='${user_name}', user_password='${user_password}' WHERE user_id=${user_id}`
                );

                // Update details in counsellors table
                await promisePool.query(
                    `UPDATE counsellor SET coun_name='${coun_name}', coun_gender='${coun_gender}', coun_phone='${coun_phone}' WHERE coun_id=${user_id}`
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
        //auth,
        check("user_name", "user_name is required").notEmpty(), // Check the user_name
        check(
            "user_password",
            "Please enter a password with 6 or more characters"
        ).isLength({ min: 6 }), // Check the password
        check("sup_name", "sup_name is required").notEmpty(), // Check the sup_name
        check("sup_gender", "Gender is required").notEmpty(), // Check the gender
        check("sup_phone", "Phone is required").notEmpty(), // Check the phone
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
                user_password,
                sup_name,
                sup_gender,
                sup_phone,
            } = req.body;

            // Create user object
            const user = {
                user_id,
                user_name,
                user_password,
                sup_name,
                sup_gender,
                sup_phone,
            };

            // Check gender
            if (
                sup_gender !== "Male" &&
                sup_gender !== "Female" &&
                sup_gender !== "Other"
            ) {
                return res.status(400).json({ msg: "Gender is not valid" });
            }

            // Check if user exists
            const [rows] = await promisePool.query(
                `SELECT EXISTS(SELECT * from login WHERE user_name = "${user_name}" AND user_id=${user_id} ) "EXISTS" FROM DUAL`
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
                        `UPDATE login SET user_name='${user_name}', user_password='${user_password}' WHERE user_id=${user_id}`
                    );

                    // Update details in students table
                    await promisePool.query(
                        `UPDATE supervisor SET sup_name='${sup_name}', sup_gender='${sup_gender}', sup_phone='${sup_phone}' WHERE sup_id=${user_id}`
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
                `SELECT EXISTS(SELECT * from login WHERE user_id<>${user_id} ) "EXISTS" FROM DUAL`
            );
            const result = rows[0].EXISTS;

            if (!result) {
                // User doesn't exists
                return res.status(400).json({ msg: "User doesn't exists" });
            } else {
                // Check role
                if ( role !== "admin") {
                    return res.status(400).json({ msg: "No authority! Only admin can delete users." });
                }

                try {
                    // Delete user in logins table
                    await promisePool.query(
                        `DELETE FROM login WHERE user_id=${user_id}`
                    );

                    // Delete user in admin table
                    await promisePool.query(
                        `DELETE FROM admin WHERE admin_id=${user_id}`
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
                `SELECT EXISTS(SELECT * from login WHERE user_id<>${user_id} ) "EXISTS" FROM DUAL`
            );
            const result = rows[0].EXISTS;

            if (!result) {
                // User doesn't exists
                return res.status(400).json({ msg: "User doesn't exists" });
            } else {
                // Check role
                if ( role !== "admin") {
                    return res.status(400).json({ msg: "No authority! Only admin can delete users." });
                }

                try {
                    // Delete user in logins table
                    await promisePool.query(
                        `DELETE FROM login WHERE user_id=${user_id}`
                    );

                    // Delete user in admin table
                    await promisePool.query(
                        `DELETE FROM counsellor WHERE coun_id=${user_id}`
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
                `SELECT EXISTS(SELECT * from login WHERE user_id<>${user_id} ) "EXISTS" FROM DUAL`
            );
            const result = rows[0].EXISTS;

            if (!result) {
                // User doesn't exists
                return res.status(400).json({ msg: "User doesn't exists" });
            } else {
                // Check role
                if ( role !== "admin") {
                    return res.status(400).json({ msg: "No authority! Only admin can delete users." });
                }

                try {
                    // Delete user in logins table
                    await promisePool.query(
                        `DELETE FROM login WHERE user_id=${user_id}`
                    );

                    // Delete user in admin table
                    await promisePool.query(
                        `DELETE FROM supervisor WHERE sup_id=${user_id}`
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
