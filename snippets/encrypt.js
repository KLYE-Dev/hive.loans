// AES implementation using cryptojs

var keySize = 256;
var ivSize = 128;
var iterations = 100;

// We add an md5 hash to check if decryption is successful later on.
function encryptJson(json, pwd) {
  json.hash = md5(json.list);
  var msg = encrypt(JSON.stringify(json), pwd);
  return msg;
}

// Decrypt and check the hash to confirm the decryption
function decryptToJson(msg, pwd) {
  try {
    var decrypted = decrypt(msg, pwd).toString(CryptoJS.enc.Utf8);
    decrypted = JSON.parse(decrypted);
    if (decrypted.hash != null && decrypted.hash == md5(decrypted.list))
      return decrypted;
    else {
      return null;
    }
  } catch (e) {
    return null;
  }
}

// AES encryption with master password
function encrypt(msg, pass) {
  var salt = CryptoJS.lib.WordArray.random(128 / 8);
  var key = CryptoJS.PBKDF2(pass, salt, {
    keySize: keySize / 32,
    iterations: iterations
  });

  var iv = CryptoJS.lib.WordArray.random(128 / 8);

  var encrypted = CryptoJS.AES.encrypt(msg, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC
  });
  // salt, iv will be hex 32 in length
  // append them to the ciphertext for use  in decryption
  var transitmessage = salt.toString() + iv.toString() + encrypted.toString();
  return transitmessage;
}

// AES decryption with master password
function decrypt(transitmessage, pass) {
  var salt = CryptoJS.enc.Hex.parse(transitmessage.substr(0, 32));
  var iv = CryptoJS.enc.Hex.parse(transitmessage.substr(32, 32));
  var encrypted = transitmessage.substring(64);

  var key = CryptoJS.PBKDF2(pass, salt, {
    keySize: keySize / 32,
    iterations: iterations
  });

  var decrypted = CryptoJS.AES.decrypt(encrypted, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC
  });
  return decrypted;
}



 function decryptKLYED(transitmessage, pass) {
  var salt = CryptoJS.enc.Hex.parse(transitmessage.substr(0, 32));
  var iv = CryptoJS.enc.Hex.parse(transitmessage.substr(32, 32));
  var encrypted = transitmessage.substring(64);

  var key = CryptoJS.PBKDF2(pass, salt, {
    keySize: keySize / 32,
    iterations: iterations
  });

  var decrypted = CryptoJS.AES.decrypt(encrypted, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}

decryptKLYED("542ee4f9d1a74bc9632d4b1bb95f4b7eb292e893afac72253fda725b45b2a8b9kC6r4duJTgmzvbi1AghHCvoHribeVa/0zxZl2Wg/nq9bZrwtKqwn7SF/X4s9gPI7Qof0PNg7Q1+4qheKcEyA7R94ahi1ZINxRuwlnHMa+TH86D2t2N/W8gjpM9LF9q0lZsiG9ms8kTv9p9kSNRP4Hx5MIWsWiTDFsLNwY/XQgFnUlk2h2bfEoRhPDJxtDCbtVxdAuiqpoBprrUiHn43jLlLppAvbZwydD2LO/nHgHwrLoUp6TfoPohyU30FKFfb8EnLR2KYKhhUEEHlwXQIvVzIe1rIOEELnnLlB4yWtOG8axFK8/QvLTXeMZZtPNrvAk77W7se/2Ap4LnxhBLQRipoMuuLLuMa9HIS/fbh5B9JG809GktGkfXNI+am+XLYKbrUahyF58l3kcRTdjloY0XPKm2nHhuIxX5hsXrUO5hYrX9TyObulBsHjq/RLJloTtLwT7vJq1clXdTYK0XISn25e/V5HiOsINx/iE5nT7jOBWJCRyqfp6d+E9rIIuvlc6GxpLIpm00MtLmwvjYtVDT1OJRW611ui/IWKRotFmcjs20DTP/aHmsCCZSy5LWTnO7Ok9BeuolR7WFCBxy/eahc8ApzoMpF23KsD24elyBdn/OnGVHUshwghDQeO4grz","Immortal57!")
