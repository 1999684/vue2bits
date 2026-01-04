// 导入所有组件
import SplitText from './SplitText.c.vue'
import ScrollFloat from './ScrollFloat.c.vue'
import ScrollReveal from './ScrollReveal.c.vue'
import BlurText from './BlurText.c.vue'
import CurvedLoop from './CurvedLoop.c.vue'
import CircularText from './CircularText.c.vue'
import AsciiText from './AsciiText.c.vue'
import DecryptedText from './DecryptedText.c.vue'
import FuzzyText from './FuzzyText.c.vue'
import GlitchText from './GlitchText.c.vue'
import GradientText from './GradientText.c.vue'
import ShinyText from './ShinyText.c.vue'

// 定义组件列表
const components = [
  ScrollReveal,
  ScrollFloat,
  SplitText,
  BlurText,
  CircularText,
  CurvedLoop,
  AsciiText,
  DecryptedText,
  FuzzyText,
  GlitchText,
  GradientText,
  ShinyText
]

// 定义 install 方法，接收 Vue 作为参数
const install = function(Vue) {
  // 判断是否安装，避免重复安装
  if (install.installed) return
  
  // 遍历并注册所有组件
  components.forEach(component => {
    Vue.component(component.name || component.__name, component)
  })
  Vue.component(ShinyText.name || ShinyText.__name, ShinyText)
}

// 导出 install 方法和所有组件
export default {
  install,
  ScrollReveal,
  ScrollFloat,
  SplitText,
  BlurText,
  CircularText,
  CurvedLoop,
  AsciiText,
  DecryptedText,
  FuzzyText,
  GlitchText,
  GradientText,
  ShinyText
}

// 单独导出组件，支持按需引入
export {
  ScrollReveal,
  ScrollFloat,
  SplitText,
  BlurText,
  CircularText,
  CurvedLoop,
  AsciiText,
  DecryptedText,
  FuzzyText,
  GlitchText,
  GradientText,
  ShinyText
}