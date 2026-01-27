<template>
  <span ref="elementRef" :class="className" />
</template>

<script>
export default {
  name: "CountUp",
  props: {
    to: {
      type: Number,
      required: true,
    },
    from: {
      type: Number,
      default: 0,
    },
    direction: {
      type: String,
      default: "up",
      validator: function (value) {
        return ["up", "down"].indexOf(value) !== -1;
      },
    },
    delay: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 2,
    },
    className: {
      type: String,
      default: "",
    },
    startWhen: {
      type: Boolean,
      default: true,
    },
    separator: {
      type: String,
      default: "",
    },
    onStart: {
      type: Function,
      default: null,
    },
    onEnd: {
      type: Function,
      default: null,
    },
  },
  data: function () {
    return {
      currentValue: this.direction === "down" ? this.to : this.from,
      isInView: false,
      animationId: null,
      hasStarted: false,
      velocity: 0,
      startTime: 0,
      intersectionObserver: null,
    };
  },
  computed: {
    damping: function () {
      return 20 + 40 * (1 / this.duration);
    },
    stiffness: function () {
      return 100 * (1 / this.duration);
    },
  },
  mounted: function () {
    this.updateDisplay();
    this.setupIntersectionObserver();
  },
  beforeDestroy: function () {
    this.cleanup();
  },
  watch: {
    from: function () {
      this.currentValue = this.direction === "down" ? this.to : this.from;
      this.updateDisplay();
      this.hasStarted = false;
    },
    to: function () {
      this.currentValue = this.direction === "down" ? this.to : this.from;
      this.updateDisplay();
      this.hasStarted = false;
    },
    direction: function () {
      this.currentValue = this.direction === "down" ? this.to : this.from;
      this.updateDisplay();
      this.hasStarted = false;
    },
    startWhen: function () {
      if (this.startWhen && this.isInView && !this.hasStarted) {
        this.startAnimation();
      }
    },
  },
  methods: {
    formatNumber: function (value) {
      const options = {
        useGrouping: !!this.separator,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      };

      const formattedNumber = Intl.NumberFormat("en-US", options).format(
        Number(value.toFixed(0))
      );

      return this.separator
        ? formattedNumber.replace(/,/g, this.separator)
        : formattedNumber;
    },
    updateDisplay: function () {
      const element = this.$refs.elementRef;
      if (element) {
        element.textContent = this.formatNumber(this.currentValue);
      }
    },
    springAnimation: function (timestamp) {
      if (!this.startTime) this.startTime = timestamp;

      const target = this.direction === "down" ? this.from : this.to;
      const current = this.currentValue;

      const displacement = target - current;
      const springForce = displacement * this.stiffness;
      const dampingForce = this.velocity * this.damping;
      const acceleration = springForce - dampingForce;

      this.velocity += acceleration * 0.016; // Assuming 60fps
      this.currentValue += this.velocity * 0.016;

      this.updateDisplay();

      if (Math.abs(displacement) > 0.01 || Math.abs(this.velocity) > 0.01) {
        this.animationId = requestAnimationFrame(this.springAnimation);
      } else {
        this.currentValue = target;
        this.updateDisplay();
        this.animationId = null;

        if (this.onEnd) {
          this.onEnd();
        }
      }
    },
    startAnimation: function () {
      if (this.hasStarted || !this.isInView || !this.startWhen) return;

      this.hasStarted = true;

      if (this.onStart) {
        this.onStart();
      }

      setTimeout(() => {
        this.startTime = 0;
        this.velocity = 0;
        this.animationId = requestAnimationFrame(this.springAnimation);
      }, this.delay * 1000);
    },
    setupIntersectionObserver: function () {
      const element = this.$refs.elementRef;
      if (!element) return;

      // 在 Vue 2 中，我们使用原生 IntersectionObserver API
      // 但需要确保浏览器支持
      if (typeof IntersectionObserver !== "undefined") {
        this.intersectionObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && !this.isInView) {
                this.isInView = true;
                this.startAnimation();
              }
            });
          },
          {
            threshold: 0,
            rootMargin: "0px",
          }
        );

        this.intersectionObserver.observe(element);
      } else {
        // 如果不支持 IntersectionObserver，直接开始动画
        this.isInView = true;
        this.startAnimation();
      }
    },
    cleanup: function () {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }

      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
        this.intersectionObserver = null;
      }
    },
  },
};
</script>
