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
        let msg_body = req.body.MsgBody[0];
        let text = "消息";

        let msg_type = msg_body.MsgType;
        if (msg_type == "TIMTextElem"){
            text = msg_body.MsgContent.Text;
        } else if (msg_type == "TIMFaceElem") {
            text = "[表情]";
        } else if (msg_type == "TIMSoundElem") {
            text = "[语音]";
        } else if (msg_type == "TIMImageElem") {
            text = "[图片]";
        } else if (msg_type == "TIMRelayElem") {
            text = "[合并聊天记录]";
        } else if (msg_type == "TIMCustomElem") {
            text = "[对咨询师进行评价]";
        }

        function checkTime(i) {
            if (i < 10) {
                i = "0" + i
            }
            return i;
        }
        // let msg_ts = new Date(msg_time * 1000);
        // let ts= msg_ts.toLocaleString();
        // let msg_timestamp =  ts.replace(/\//g,"-");

        function getData(n) {
            let msg_ts = new Date(n * 1000),
            y = msg_ts.getFullYear(),
            m = msg_ts.getMonth() + 1,
            d = msg_ts.getDate();
            return y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d) + " " + msg_ts.toTimeString().substr(0, 8);
        }
        let msg_timeStamp = getData(msg_time);

        try {

            // Add bind in the DB
            await promisePool.query(
                `INSERT INTO message (msg_key, from_user, to_user, msg_time, msg_type, text) VALUES ("${msg_key}", "${from_user}", "${to_user}", "${msg_timeStamp}", "${msg_type}", "${text}")`
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
