const { customAlphabet } = require('nanoid');

const generateId = (length = 10) => {
  const dictionary = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const nanoid = customAlphabet(dictionary, length)

  return nanoid().toUpperCase();
};

module.exports = { generateId };
