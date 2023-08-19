const cryptoJS = require('crypto-js');

const encrypt = (plainText, secret) => cryptoJS.AES.encrypt(plainText, secret).toString();

const compare = (cipher, textToCompare, secret) => {
  const bytes = cryptoJS.AES.decrypt(cipher, secret);
  const result = bytes.toString(cryptoJS.enc.Utf8);

  return result === textToCompare;
};

module.exports = { encrypt, compare };
