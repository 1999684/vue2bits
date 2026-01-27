<template>
  <h2 ref="containerRef" :class="'my-5' + ' ' + containerClassName">
    <p
      :class="'leading-relaxed font-semibold' + ' ' + textClassName"
      style="font-size: clamp(1.6rem, 4vw, 3rem)"
    >
      <span
        v-for="(word, index) in splitText"
        :key="index"
        :class="word.isWhitespace ? '' : 'inline-block word'"
      >
        {{ word.text }}
      </span>
    </p>
  </h2>
</template>

<script>
export default {
  name: "ScrollReveal",
  props: {
    // 文字内容
    children: {
      type: String,
      default: "",
    },
    // 滚动容器引用
    scrollContainerRef: {
      type: Object,
      default: function () {
        return { current: null };
      },
    },
    // 是否启用模糊效果
    enableBlur: {
      type: Boolean,
      default: true,
    },
    // 基础透明度
    baseOpacity: {
      type: Number,
      default: 0.1,
    },
    // 基础旋转角度
    baseRotation: {
      type: Number,
      default: 3,
    },
    // 模糊强度
    blurStrength: {
      type: Number,
      default: 4,
    },
    // 为外容器添加类名
    containerClassName: {
      type: String,
      default: "",
    },
    // 文字类名，用于为文字添加样式
    textClassName: {
      type: String,
      default: "",
    },
    // 旋转动画结束位置
    rotationEnd: {
      type: String,
      default: "bottom bottom",
    },
    // 文字动画结束位置
    wordAnimationEnd: {
      type: String,
      default: "bottom bottom",
    },
  },
  data: function () {
    return {
      scrollTriggerInstances: [],
    };
  },
  computed: {
    splitText: function () {
      var text = typeof this.children === "string" ? this.children : "";
      return text.split(/(\s+)/).map(function (word, index) {
        return {
          text: word,
          isWhitespace: /^\s+$/.test(word),
          key: index,
        };
      });
    },
  },
  mounted: function () {
    this.initializeAnimation();
  },
  beforeDestroy: function () {
    // 清理ScrollTrigger实例
    this.scrollTriggerInstances.forEach(function (trigger) {
      trigger.kill();
    });
  },
  watch: {
    children: function () {
      this.initializeAnimation();
    },
    scrollContainerRef: function () {
      this.initializeAnimation();
    },
    enableBlur: function () {
      this.initializeAnimation();
    },
    baseOpacity: function () {
      this.initializeAnimation();
    },
    baseRotation: function () {
      this.initializeAnimation();
    },
    blurStrength: function () {
      this.initializeAnimation();
    },
    rotationEnd: function () {
      this.initializeAnimation();
    },
    wordAnimationEnd: function () {
      this.initializeAnimation();
    },
  },
  methods: {
    initializeAnimation: function () {
      var self = this;
      var el = this.$refs.containerRef;
      if (!el) return;

      // 清理之前的实例
      this.scrollTriggerInstances.forEach(function (trigger) {
        trigger.kill();
      });
      this.scrollTriggerInstances = [];

      var scroller =
        this.scrollContainerRef && this.scrollContainerRef.current
          ? this.scrollContainerRef.current
          : window;

      // 旋转动画
      if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);

        var rotationTl = gsap.fromTo(
          el,
          { transformOrigin: "0% 50%", rotate: this.baseRotation },
          {
            ease: "none",
            rotate: 0,
            scrollTrigger: {
              trigger: el,
              scroller: scroller,
              start: "top bottom",
              end: this.rotationEnd,
              scrub: true,
            },
          }
        );

        if (rotationTl.scrollTrigger) {
          this.scrollTriggerInstances.push(rotationTl.scrollTrigger);
        }

        var wordElements = el.querySelectorAll(".word");

        // 透明度动画
        var opacityTl = gsap.fromTo(
          wordElements,
          { opacity: this.baseOpacity, willChange: "opacity" },
          {
            ease: "none",
            opacity: 1,
            stagger: 0.05,
            scrollTrigger: {
              trigger: el,
              scroller: scroller,
              start: "top bottom-=20%",
              end: this.wordAnimationEnd,
              scrub: true,
            },
          }
        );

        if (opacityTl.scrollTrigger) {
          this.scrollTriggerInstances.push(opacityTl.scrollTrigger);
        }

        // 模糊效果
        if (this.enableBlur) {
          var blurTl = gsap.fromTo(
            wordElements,
            { filter: "blur(" + this.blurStrength + "px)" },
            {
              ease: "none",
              filter: "blur(0px)",
              stagger: 0.05,
              scrollTrigger: {
                trigger: el,
                scroller: scroller,
                start: "top bottom-=20%",
                end: this.wordAnimationEnd,
                scrub: true,
              },
            }
          );

          if (blurTl.scrollTrigger) {
            this.scrollTriggerInstances.push(blurTl.scrollTrigger);
          }
        }
      }
    },
  },
};
</script>
