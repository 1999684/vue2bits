<template>
  <div
    :class="`gradient-text-container ${className}`" :style="{borderRadius: borderRadius}"
  >
    <div
      v-if="showBorder"
      class="gradient-text-border animate-gradient"
      :style="borderStyle"
    >
      <div
        class="gradient-text-border-inner" :style="{ background: background, borderRadius: borderRadius }"
      />
    </div>

    <div class="gradient-text-content animate-gradient" :style="textStyle">
      {{ text }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'GradientText',
  props: {
    // 文本内容
    text: {
      type: String,
      default: ''
    },
    // 自定义CSS类名
    className: {
      type: String,
      default: ''
    },
    // 渐变颜色数组
    colors: {
      type: Array,
      default: function() {
        return ['#ffaa40', '#9c40ff', '#ffaa40'];
      }
    },
    // 动画速度（秒）
    animationSpeed: {
      type: Number,
      default: 8
    },
    // 是否显示边框
    showBorder: {
      type: Boolean,
      default: false
    },
    // 设置背景
    background: {
      type: String,
      default: 'black;'
    },
    // 边框圆角
    borderRadius: {
      type: String,
      default: '1.25rem'
    },
  },
  computed: {
    // 渐变样式
    gradientStyle: function() {
      return {
        backgroundImage: 'linear-gradient(to right, ' + this.colors.join(', ') + ')',
        animationDuration: this.animationSpeed + 's',
        backgroundSize: '300% 100%',
        '--animation-duration': this.animationSpeed + 's'
      };
    },
    // 边框样式
    borderStyle: function() {
      return this.gradientStyle;
    },
    // 文本样式
    textStyle: function() {
      return Object.assign({}, this.gradientStyle, {
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text'
      });
    }
  }
};
</script>


<style scoped>
.gradient-text-container {
  position: relative;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  backdrop-filter: blur(4px);
  transition: box-shadow 0.5s ease;
  overflow: hidden;
  cursor: pointer;
  max-width: fit-content;
}

.gradient-text-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  z-index: 0;
  pointer-events: none;
}

.gradient-text-border-inner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  width: calc(100% - 2px);
  height: calc(100% - 2px);
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.gradient-text-content {
  display: inline-block;
  position: relative;
  z-index: 2;
  color: transparent;
  background-size: cover;
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.animate-gradient {
  animation: gradient var(--animation-duration, 8s) linear infinite;
}
</style>