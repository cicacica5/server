var TLSSigAPIv2 = require('../TLSSigAPIv2');

function genTestUserSig(userID) {
    // 腾讯云 SDKAppId
    const SDKAPPID = 1400641355;
    // 计算签名用的加密密钥
    const SECRETKEY = 'b89fece8a5cdb5425ab2aeb48a424e71002d00618dd4ed656d6fabee9cec093f';
    // 默认时间：7 x 24 x 60 x 60 = 604800 = 7 天
    const EXPIRETIME = 604800;

    var api = new TLSSigAPIv2.Api(SDKAPPID, SECRETKEY);

    var sig = api.genSig(userID, EXPIRETIME);
    console.log(sig);
    return {
        userSig: sig
    };
}

module.exports = genTestUserSig
