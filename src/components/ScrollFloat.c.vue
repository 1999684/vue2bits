<template>
  <h2
    ref="containerRef"
    :class="'scroll-float-normal' + ' ' + containerClassName"
  >
    <span
      :class="'scroll-float-normal-span' + ' ' + textClassName"
      style="font-size: clamp(20px, 25px, 34px)"
    >
      <span
        v-for="(char, index) in splitText"
        :key="index"
        class="scroll-float-normal-span-split char"
      >
        {{ char === " " ? "\u00A0" : char }}
      </span>
    </span>
  </h2>
</template>

<script>
export default {
  name: "ScrollFloat",
  props: {
    // 文字内容
    children: {
      type: String,
      default: "",
    },
    // // 定义相对容器窗口
    // scrollContainerRef: {
    //   type: Object,
    //   default: function() {
    //     return { current: containerRef };
    //   }
    // },
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
    animationDuration: {
      type: Number,
      default: 1,
    },
    ease: {
      type: String,
      default: "back.inOut(2)",
    },
    scrollStart: {
      type: String,
      default: "top bottom",
    },
    scrollEnd: {
      type: String,
      default: "bottom bottom-=40%",
    },
    stagger: {
      type: Number,
      default: 0.03,
    },
  },
  data: function () {
    return {
      scrollTriggerInstance: null,
    };
  },
  computed: {
    splitText: function () {
      var text = typeof this.children === "string" ? this.children : "";
      return text.split("");
    },
  },
  mounted: function () {
    this.initializeAnimation();
  },
  beforeDestroy: function () {
    if (this.scrollTriggerInstance) {
      this.scrollTriggerInstance.kill();
    }
  },
  watch: {
    children: function () {
      this.initializeAnimation();
    },
    scrollContainerRef: function () {
      this.initializeAnimation();
    },
    animationDuration: function () {
      this.initializeAnimation();
    },
    ease: function () {
      this.initializeAnimation();
    },
    scrollStart: function () {
      this.initializeAnimation();
    },
    scrollEnd: function () {
      this.initializeAnimation();
    },
    stagger: function () {
      this.initializeAnimation();
    },
  },
  methods: {
    initializeAnimation: function () {
      var self = this;
      var el = this.$refs.containerRef;
      if (!el) return;

      var scroller =
        this.scrollContainerRef && this.scrollContainerRef.current
          ? this.scrollContainerRef.current
          : window;

      var charElements = el.querySelectorAll(".char");

      if (this.scrollTriggerInstance) {
        this.scrollTriggerInstance.kill();
      }

      // 注意：这里需要确保GSAP库已加载
      if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);

        var tl = gsap.fromTo(
          charElements,
          {
            willChange: "opacity, transform",
            opacity: 0,
            yPercent: 120,
            scaleY: 2.3,
            scaleX: 0.7,
            transformOrigin: "50% 0%",
          },
          {
            duration: this.animationDuration,
            ease: this.ease,
            opacity: 1,
            yPercent: 0,
            scaleY: 1,
            scaleX: 1,
            stagger: this.stagger,
            scrollTrigger: {
              trigger: el,
              scroller: scroller,
              start: this.scrollStart,
              end: this.scrollEnd,
              scrub: true,
            },
          }
        );

        this.scrollTriggerInstance = tl.scrollTrigger || null;
      }
    },
  },
};
</script>

<style scoped>
.scroll-float-normal {
  overflow: hidden;
}

.scroll-float-normal-span {
  display: inline-block;
  text-align: center;
  line-height: 1.625;
  font-weight: 900;
}

.scroll-float-normal-span-split {
  display: inline-block;
}
</style>
