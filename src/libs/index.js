// 用于存放第三方库的文件夹

// GSAP 核心库
import gsap from 'gsap'

// ScrollTrigger 插件
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// 注册插件
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

// SplitText 插件 (通过外部引入)
let SplitText = null;
if (typeof window !== 'undefined' && window.SplitText) {
  SplitText = window.SplitText;
}

export {
  gsap,
  ScrollTrigger,
  SplitText
}

export default {
  gsap,
  ScrollTrigger,
  SplitText
}