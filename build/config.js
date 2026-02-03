const path = require('path');

module.exports = {
  // 定义需要加密的文件列表（相对于项目根目录）
  filesToEncrypt: [
    'dist/vue2bits.min.js',
  ],

  // 混淆配置（可根据需求统一调整）
  obfuscatorOptions: {
    compact: true,
    selfDefending: true,         // 防篡改
    debugProtection: true,       // 防调试
    debugProtectionInterval: 4000,
    disableConsoleOutput: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: false,
    stringArray: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayThreshold: 0.75,
    renameGlobals: false,
    identifierNamesGenerator: 'hexadecimal'
  }
};
