const { config } = require("../config/index.js");
const log = require("fancy-log");
const openpgp = require('openpgp');
const aes256 = require('aes256');

let keyPoolArray = [];

const [publicKeyArmored] = `-----BEGIN PGP PUBLIC KEY BLOCK-----
...
-----END PGP PUBLIC KEY BLOCK-----`;

const [privateKeyArmored] = `-----BEGIN PGP PRIVATE KEY BLOCK-----
...
-----END PGP PRIVATE KEY BLOCK-----`; // encrypted private key


let newLoanPGPPublic;
let newLoanPGPrivate;
let newLoanPGPRevoke;

var key = config.sechash;
const pgpPassword = config.sechash;
const passphrase = `${config.sechash}`; // Password that private key is encrypted with

var plaintext = 'my plaintext message';
var buffer = Buffer.from(plaintext);

var cipher = (key) => {
    return aes256.createCipher(key);
}

var encryptedPlainText = cipher(key).encrypt(plaintext);
var decryptedPlainText = cipher(key).decrypt(encryptedPlainText);
// plaintext === decryptedPlainText

var encryptedBuffer = cipher(key).encrypt(buffer);
var decryptedBuffer = cipher(key).decrypt(encryptedBuffer);






module.exports.pgpKeygenAsync = async(username) => {
  const { privateKeyArmored, publicKeyArmored, revocationCertificate } = await openpgp.generateKey({
    userIds: [{name: `${username}`}], // you can pass multiple user IDs
    curve: 'brainpoolP256r1',    // ECC curve name
    passphrase: pgpPassword  // protects the private key
  });
  newLoanPGPPublic = publicKeyArmored;
  newLoanPGPrivate = privateKeyArmored;
  newLoanPGPRevoke = revocationCertificate;
  var newKeys = {
    public: newLoanPGPPublic,
    private: newLoanPGPrivate,
    revoke: newLoanPGPRevoke
  }

  keyPoolArray[`${username}`] = newKeys;
  log(keyPoolArray);
  return newKeys.public;
  //console.log(privateKeyArmored);     // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
  //console.log(publicKeyArmored);      // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
  //console.log(revocationCertificate); // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
};

module.exports.pgpEncryptAsync = async(data) => {
  log(data)
  const { data: encrypted } = await openpgp.encrypt({
      message: openpgp.message.fromText(`[{"${data.username}":{${data.encryptThis}}}]`),                 // input as Message object
      publicKeys: (await openpgp.key.readArmored(data.pgp)).keys});
      return encrypted;
};

module.exports.pgpDecryptAsync = async(data, user) => {
  log(data)
  await privateKeys.decrypt(pgpPassword);
  const decOptions = {
              message: await openpgp.message.readArmored(`${data}`),    // parse armored message
              publicKeys: (await openpgp.key.readArmored(newLoanPGPPublic)).keys, // for verification (optional)
              privateKeys: privateKeys   // for decryption
          }
  const decrypted = await openpgp.decrypt(decOptions);
  return decrypted;

    /*
  try {
    const { keys: [privateKeys] } = await openpgp.key.readArmored(newLoanPGPrivate);
    await privateKeys.decrypt(pgpPassword);
    const { data: decrypted } = await openpgp.decrypt({
      message: await openpgp.message.readArmored(data),              // parse armored message
      publicKeys: (await openpgp.key.readArmored(newLoanPGPPublic)).keys, // for verification (optional)
      privateKeys: [privateKeys]                                           // for decryption
    });
    return decrypted;
  } catch(e) {
    log(e);
  }
  */
};

module.exports.keyPool = async() => {
  if (keyPoolArray){
      return keyPoolArray;
  }
}
