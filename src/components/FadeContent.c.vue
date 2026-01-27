<template>
  <div
    ref="elementRef"
    :class="className"
    :style="{
      opacity: inView ? 1 : initialOpacity,
      transition:
        'opacity ' +
        duration +
        'ms ' +
        easing +
        ', filter ' +
        duration +
        'ms ' +
        easing,
      filter: blur ? (inView ? 'blur(0px)' : 'blur(10px)') : 'none',
    }"
  >
    <slot />
  </div>
</template>

<script>
export default {
  name: "FadeContent",
  props: {
    blur: {
      type: Boolean,
      default: false,
    },
    duration: {
      type: Number,
      default: 1000,
    },
    easing: {
      type: String,
      default: "ease-out",
    },
    delay: {
      type: Number,
      default: 0,
    },
    threshold: {
      type: Number,
      default: 0.1,
    },
    initialOpacity: {
      type: Number,
      default: 0,
    },
    className: {
      type: String,
      default: "",
    },
  },
  data: function () {
    return {
      inView: false,
      observer: null,
    };
  },
  mounted: function () {
    var self = this;
    var element = this.$refs.elementRef;
    if (!element) return;

    // IntersectionObserver 是浏览器原生 API，需要检查浏览器支持情况
    if (typeof IntersectionObserver !== "undefined") {
      this.observer = new IntersectionObserver(
        function (entries) {
          var entry = entries[0];
          if (entry.isIntersecting) {
            self.observer.unobserve(element);
            setTimeout(function () {
              self.inView = true;
            }, self.delay);
          }
        },
        { threshold: this.threshold }
      );

      this.observer.observe(element);
    } else {
      // 如果不支持 IntersectionObserver，则立即显示内容
      setTimeout(function () {
        self.inView = true;
      }, self.delay);
    }
  },
  beforeDestroy: function () {
    if (this.observer) {
      this.observer.disconnect();
    }
  },
};
</script>
