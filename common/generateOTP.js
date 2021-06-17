const codeGenerator = require("otp-generator");

module.exports = (code_length) => {
  return codeGenerator.generate(code_length, {
    digits: true,
    alphabets: false,
    upperCase: false,
    specialChars: false,
  });
};
