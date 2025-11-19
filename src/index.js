import Vue from 'vue'

// 导入所有组件
import Components from './components/index.js'

// 定义 install 方法，接收 Vue 作为参数
const install = function(Vue) {
  // 判断是否安装，避免重复安装
  if (install.installed) return
  
  // 遍历并注册所有组件
  Object.keys(Components).forEach(key => {
    if (key !== 'install') {
      Vue.component(Components[key].name || Components[key].__name || key, Components[key])
    }
  })
}

// 判断是否直接引入文件，如果是，就自动安装组件
if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue)
}

// 导出 install 方法和所有组件
export default {
  install,
  ...Components
}

// 单独导出组件，支持按需引入
export * from './components/index.js'

// 如果是在浏览器环境中直接引入，且window.Vue2bits未定义，则将其挂载到window上
if (typeof window !== 'undefined' && window.Vue) {
  // 自动安装所有组件
  install(window.Vue);
  
  // 将组件库挂载到window对象上
  window.Vue2bits = {
    install,
    ...Components
  }
}