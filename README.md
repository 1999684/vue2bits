### 直接引入
下载 dist 目录下的文件，在 HTML 中直接引入：
```html
<link rel="stylesheet" href="vue2bits.css">
<script src="vue2bits.min.js"></script>
```

## 使用方法

### 全局引入
```javascript
import Vue from 'vue'
import Vue2bits from 'vue2bits'
import 'vue2bits/dist/vue2bits.css'

Vue.use(Vue2bits)
```

### 按需引入
```javascript
import { FadeIn } from 'vue2bits'
import 'vue2bits/dist/vue2bits.css'

export default {
  components: {
    FadeIn
  }
}
```

### 命令
```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 构建开发版本
npm run build:dev

# 打包为tgz文件
npm pack

# 预览
npm run preview
```