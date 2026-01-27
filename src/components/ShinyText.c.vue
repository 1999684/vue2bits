<script>
export default {
  name: "ShinyText",
  props: {
    // 显示的文字内容
    text: {
      type: String,
      default: "",
    },
    // 是否禁用动画
    disabled: {
      type: Boolean,
      default: false,
    },
    // 动画速度（秒）
    speed: {
      type: Number,
      default: 5,
    },
    // CSS类名
    className: {
      type: String,
      default: "",
    },
  },
  computed: {
    animationDuration: function () {
      return this.speed + "s";
    },
  },
};
</script>

<template>
  <div
    :class="['text-shiny', { 'animate-shine': !disabled }, className]"
    :style="{
      backgroundImage:
        'linear-gradient(120deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 60%)',
      backgroundSize: '200% 100%',
      WebkitBackgroundClip: 'text',
      animationDuration: animationDuration,
    }"
  >
    {{ text }}
  </div>
</template>

<style scoped>
.text-shiny {
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

@keyframes shine {
  0% {
    background-position: 100%;
  }
  100% {
    background-position: -100%;
  }
}

.animate-shine {
  animation: shine 5s linear infinite;
}
</style>
