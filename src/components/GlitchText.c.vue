<template>
  <div :class="computedClasses" :style="inlineStyles" :data-text="children">
    {{ children }}
  </div>
</template>

<script>
export default {
  name: 'GlitchText',
  props: {
    // 文本内容
    children: {
      type: String,
      required: true
    },
    // 动画速度
    speed: {
      type: Number,
      default: 0.5
    },
    // 是否启用阴影
    enableShadows: {
      type: Boolean,
      default: true
    },
    // 是否仅在悬停时启用效果
    enableOnHover: {
      type: Boolean,
      default: false
    },
    // 自定义CSS类名
    className: {
      type: String,
      default: ''
    }
  },
  computed: {
    // 内联样式
    inlineStyles: function() {
      return {
        '--after-duration': (this.speed * 3) + 's',
        '--before-duration': (this.speed * 2) + 's',
        '--after-shadow': this.enableShadows ? '-5px 0 red' : 'none',
        '--before-shadow': this.enableShadows ? '5px 0 cyan' : 'none'
      };
    },
    // 计算后的CSS类
    computedClasses: function() {
      var classes = ['glitch-text-base'];
      
      if (this.enableOnHover) {
        classes.push('glitch-text-hover');
      } else {
        classes.push('glitch-text-normal');
      }
      
      if (this.className) {
        classes.push(this.className);
      }
      
      return classes.join(' ');
    }
  }
};
</script>

<style>
.glitch-text-base {
  color: white;
  font-weight: 900;
  white-space: nowrap;
  position: relative;
  margin-left: auto;
  margin-right: auto;
  user-select: none;
  cursor: pointer;
  font-size: clamp(2rem, 10vw, 8rem);
}

.glitch-text-base::before {
  content: attr(data-text);
  position: absolute;
  top: 0;
  color: white;
  background: #0b0b0b;
  overflow: hidden;
  clip-path: inset(0 0 0 0);
}

.glitch-text-base::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  color: white;
  background: #0b0b0b;
  overflow: hidden;
  clip-path: inset(0 0 0 0);
}

.glitch-text-normal::after {
  left: 10px;
  text-shadow: var(--after-shadow, -10px 0 red);
  animation: animate-glitch var(--after-duration, 3s) infinite linear alternate-reverse;
}

.glitch-text-normal::before {
  left: -10px;
  text-shadow: var(--before-shadow, 10px 0 cyan);
  animation: animate-glitch var(--before-duration, 2s) infinite linear alternate-reverse;
}

.glitch-text-hover::before {
  content: "";
  opacity: 0;
  animation: none;
}

.glitch-text-hover::after {
  content: "";
  opacity: 0;
  animation: none;
}

.glitch-text-hover:hover::before {
  content: attr(data-text);
  opacity: 1;
  left: -10px;
  text-shadow: var(--before-shadow, 10px 0 cyan);
  animation: animate-glitch var(--before-duration, 2s) infinite linear alternate-reverse;
}

.glitch-text-hover:hover::after {
  content: attr(data-text);
  opacity: 1;
  left: 10px;
  text-shadow: var(--after-shadow, -10px 0 red);
  animation: animate-glitch var(--after-duration, 3s) infinite linear alternate-reverse;
}

@keyframes animate-glitch {
  0% {
    clip-path: inset(20% 0 50% 0);
  }
  5% {
    clip-path: inset(10% 0 60% 0);
  }
  10% {
    clip-path: inset(15% 0 55% 0);
  }
  15% {
    clip-path: inset(25% 0 35% 0);
  }
  20% {
    clip-path: inset(30% 0 40% 0);
  }
  25% {
    clip-path: inset(40% 0 20% 0);
  }
  30% {
    clip-path: inset(10% 0 60% 0);
  }
  35% {
    clip-path: inset(15% 0 55% 0);
  }
  40% {
    clip-path: inset(25% 0 35% 0);
  }
  45% {
    clip-path: inset(30% 0 40% 0);
  }
  50% {
    clip-path: inset(20% 0 50% 0);
  }
  55% {
    clip-path: inset(10% 0 60% 0);
  }
  60% {
    clip-path: inset(15% 0 55% 0);
  }
  65% {
    clip-path: inset(25% 0 35% 0);
  }
  70% {
    clip-path: inset(30% 0 40% 0);
  }
  75% {
    clip-path: inset(40% 0 20% 0);
  }
  80% {
    clip-path: inset(20% 0 50% 0);
  }
  85% {
    clip-path: inset(10% 0 60% 0);
  }
  90% {
    clip-path: inset(15% 0 55% 0);
  }
  95% {
    clip-path: inset(25% 0 35% 0);
  }
  100% {
    clip-path: inset(30% 0 40% 0);
  }
}
</style>