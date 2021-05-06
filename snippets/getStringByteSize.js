module.exports.getStringByteSize = (normal_val) => {
  if(!normal_val) return false;
    normal_val = String(normal_val);
    var byteLen = 0;
    for (var i = 0; i < normal_val.length; i++) {
        var c = normal_val.charCodeAt(i);
        byteLen += (c & 0xf800) == 0xd800 ? 2 :  // Code point is half of a surrogate pair
                   c < (1 <<  7) ? 1 :
                   c < (1 << 11) ? 2 : 3;
    }
    return byteLen;
};
