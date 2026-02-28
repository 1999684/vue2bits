const path = require('path');

module.exports = {
  // 定义需要加密的文件列表（相对于项目根目录）
  filesToEncrypt: [
    'dist/vue2bits.min.js',
  ],
  // 极致混淆配置：旨在将源码转化为完全不可读的乱码状态，并提升逆向难度
  obfuscatorOptions: {
    // 压缩代码：移除所有换行和空格，使代码整块堆叠
    compact: true,

    // --- 视觉干扰：彻底乱码化的核心 ---
    // 关键：将字符串转换为 Unicode 转义序列（如 'a' -> '\x61'），使 'function'、'this' 等关键字在肉眼下消失
    unicodeEscapeSequence: true,
    // 标识符混淆：将变量名、函数名改为十六进制格式（如 _0xabc123）
    identifierNamesGenerator: 'hexadecimal',

    // --- 字符串加密与保护 ---
    // 启用字符串数组：将所有字符串提取到一个统一的数组中管理
    stringArray: true,
    // 字符串加密方式：使用 base64 编码，防止通过文本搜索直接定位业务逻辑或 API 地址
    stringArrayEncoding: ['base64'],
    // 字符串混淆概率：1 表示 100% 的字符串都会被放入数组并加密
    stringArrayThreshold: 1,
    // 数组旋转：打乱字符串数组的原始顺序，增加静态分析难度
    stringArrayRotate: true,
    // 数组洗牌：在加密基础上再次随机打乱数组
    stringArrayShuffle: true,

    // --- 逻辑结构粉碎 ---
    // 控制流扁平化：最强混淆手段，将原有的 if/else/loop 逻辑拆解为复杂的 switch 嵌套，使逻辑路径难以追踪
    controlFlowFlattening: true,
    // 扁平化比例：0.75 表示 75% 的逻辑会被改写，平衡了安全性和运行性能
    controlFlowFlatteningThreshold: 0.75,
    // 死代码注入：在代码中随机插入永远不会执行的垃圾代码，干扰逆向分析人员的判断
    deadCodeInjection: true,
    // 死代码比例：40% 的代码块会被干扰代码覆盖
    deadCodeInjectionThreshold: 0.4,
    // 对象键名混淆：将 obj.name 转换为 obj['_0x...']，隐藏对象的属性结构
    transformObjectKeys: true,

    // --- 调试与兼容性设置 ---
    // 自我防御：若开启，代码被格式化后将失效
    selfDefending: false,
    // 调试保护：若开启，打开浏览器开发者工具会导致页面卡死。由于需要调试，设为 false
    debugProtection: false,
    // 调试保护间隔：设为 0 禁用定期检查调试状态
    debugProtectionInterval: 0,
    // 禁止控制台输出：设为 false 以便在调试时能看到 console.log
    disableConsoleOutput: false,

    // 全局变量重命名：建议 false。若开启，Vue 或 window 上的全局变量会被改名，可能导致组件挂载失败
    renameGlobals: false,
    // 字符串拆分：将长字符串切断
    splitStrings: true,
    // 拆分长度：每 5 个字符切断一次并用 '+' 连接，使通过关键字搜索源码变得几乎不可能
    splitStringsChunkLength: 5
  }



};
