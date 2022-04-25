// Imports
const express = require("express"); // Create router
const bcrypt = require("bcryptjs"); // Encrypt password
const jwt = require("jsonwebtoken"); // Authorization
const config = require("config"); // Global variables
const { check, validationResult } = require("express-validator"); // Check and validate the inputs
const promisePool = require("../config/db"); // Import instance of mysql pool

// Init router
const router = express.Router();

// Endpoints
/**
 * 消息回调
 */

// @route   POST /imcallback
// @desc    注册管理员
// @access  Public, hidden
router.post(
    "/",
    async(req, res) => {

        //let SdkAppid = req.query.SdkAppid;

        // Extract info from the body
        let from_user = req.body.From_Account;
        let to_user = req.body.To_Account;
        let msg_time = req.body.MsgTime;
        let msg_key = req.body.MsgKey;
        let msg_body = req.body.MsgBody;
        let text = "消息";

        let msg_type = msg_body[0].MsgType;
        if (msg_type == "TIMTextElem"){
            text = msg_body[0].Text;
        } else if (msg_type[0] == "TIMFaceElem") {
            text = "[表情]";
        } else if (msg_type == "TIMSoundElem") {
            text = "[语音]";
        } else if (msg_type == "TIMImageElem") {
            text = "[图片]";
        } else {

        }


        try {

            // Add bind in the DB
            await promisePool.query(
                `INSERT INTO message (msg_key, from_user, to_user, msg_time, msg_type, text) VALUES ("${msg_key}", "${from_user}", "${to_user}", "${msg_time}", "${msg_type}", "${text}")`
            );

            res.json({ActionStatus:"OK", ErrorInfo:"", ErrorCode:0});

        } catch (err) {
            res.json({ActionStatus:"FAIL", ErrorInfo:"", ErrorCode:1});
            // Catch errors
            throw err;
        }
    }
);


module.exports = router;
