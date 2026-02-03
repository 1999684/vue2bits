// 1. 解决旧版 Node.js 兼容性问题
if (!Object.hasOwn) {
  Object.hasOwn = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
}
if (!Array.prototype.at) {
  Array.prototype.at = function(n) {
    n = Math.trunc(n) || 0;
    if (n < 0) n += this.length;
    if (n < 0 || n >= this.length) return undefined;
    return this[n];
  };
}

const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const rootDir = path.resolve(__dirname, '../');

function encryptAll() {
  const files = config.filesToEncrypt;

  if (!files || files.length === 0) {
    console.warn('警告: 没有在 config.js 中定义需要加密的文件。');
    return;
  }

  console.log('开始批量加密任务...');
  console.log('---------------------------------------');

  files.forEach(relativeFilePath => {
    const filePath = path.join(rootDir, relativeFilePath);

    if (!fs.existsSync(filePath)) {
      console.error(`跳过: 未找到文件 ${relativeFilePath}`);
      return;
    }

    try {
      const code = fs.readFileSync(filePath, 'utf8');
      console.log(`正在处理: ${relativeFilePath} ...`);

      const result = JavaScriptObfuscator.obfuscate(code, config.obfuscatorOptions);

      fs.writeFileSync(filePath, result.getObfuscatedCode());
      console.log(`成功: ${relativeFilePath} 已加固。`);
    } catch (err) {
      console.error(`失败: 处理 ${relativeFilePath} 时出错:`);
      console.error(err);
    }
  });

  console.log('---------------------------------------');
  console.log('所有加密任务执行完毕。');
}

encryptAll();
