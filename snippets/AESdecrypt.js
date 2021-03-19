const crypto = require("crypto");
const Algorithm = "aes-128-ecb";
const fs = require("fs");

function encryptFile(key, inputFile, outputFile) {
    const inputData = fs.readFileSync(inputFile);
    const cipher = crypto.createCipheriv(Algorithm, key, Buffer.alloc(0));
    const output = Buffer.concat([cipher.update(inputData) , cipher.final()]);
    fs.writeFileSync(outputFile, output);
}

function decryptFile(key, inputFile, outputFile) {
    const inputData = fs.readFileSync(inputFile);
    const cipher = crypto.createDecipheriv(Algorithm, key, Buffer.alloc(0));
    const output = Buffer.concat([cipher.update(inputData) , cipher.final()]);
    fs.writeFileSync(outputFile, output);
}

const KEY = Buffer.from("0123456789ABDCEF", "utf8");

encryptFile(KEY, "node-input.txt", "node-output.txt");
decryptFile(KEY, "node-output.txt", "node-decrypted.txt");
