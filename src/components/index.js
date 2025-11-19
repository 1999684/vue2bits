// 导入所有组件
import SplitText from './SplitText.c.vue'
import ScrollFloat from './ScrollFloat.c.vue'

// 定义组件列表
const components = [
  ScrollFloat,
  SplitText
]

// 定义 install 方法，接收 Vue 作为参数
const install = function(Vue) {
  // 判断是否安装，避免重复安装
  if (install.installed) return
  
  // 遍历并注册所有组件
  components.forEach(component => {
    Vue.component(component.name || component.__name, component)
  })
}

// 导出 install 方法和所有组件
export default {
  install,
  ScrollFloat,
  SplitText
}

// 单独导出组件，支持按需引入
export {
  ScrollFloat,
  SplitText
}