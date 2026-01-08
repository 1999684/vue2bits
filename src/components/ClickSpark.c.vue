<template>
  <div ref="containerRef" class="click-spark" @click="handleClick">
    <canvas ref="canvasRef" class="click-spark-canvas" />

    <slot />
  </div>
</template>

<script>
export default {
  name: 'ClickSpark',
  props: {
    sparkColor: {
      type: String,
      default: '#fff'
    },
    sparkSize: {
      type: Number,
      default: 10
    },
    sparkRadius: {
      type: Number,
      default: 15
    },
    sparkCount: {
      type: Number,
      default: 8
    },
    duration: {
      type: Number,
      default: 400
    },
    easing: {
      type: String,
      default: 'ease-out',
      validator: function (value) {
        return ['linear', 'ease-in', 'ease-out', 'ease-in-out'].indexOf(value) !== -1
      }
    },
    extraScale: {
      type: Number,
      default: 1.0
    }
  },
  data: function() {
    return {
      sparks: [],
      startTime: null,
      animationId: null,
      resizeTimeout: null,
      resizeObserver: null
    };
  },
  computed: {
    easeFunc: function() {
      const easing = this.easing;
      return function(t) {
        switch (easing) {
          case 'linear':
            return t;
          case 'ease-in':
            return t * t;
          case 'ease-in-out':
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          default:
            return t * (2 - t);
        }
      };
    }
  },
  mounted: function() {
    const canvas = this.$refs.canvasRef;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    // 简单的 resize 处理，因为 ResizeObserver 在 Vue 2 中可能不被支持
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    this.resizeCanvas();

    this.animationId = requestAnimationFrame(this.draw);
  },
  beforeDestroy: function() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    window.removeEventListener('resize', this.handleResize);
  },
  watch: {
    sparkColor: function() {
      this.restartAnimation();
    },
    sparkSize: function() {
      this.restartAnimation();
    },
    sparkRadius: function() {
      this.restartAnimation();
    },
    sparkCount: function() {
      this.restartAnimation();
    },
    duration: function() {
      this.restartAnimation();
    },
    extraScale: function() {
      this.restartAnimation();
    },
    easing: function() {
      this.restartAnimation();
    }
  },
  methods: {
    handleClick: function(e) {
      const canvas = this.$refs.canvasRef;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const now = performance.now();
      const newSparks = Array.from({ length: this.sparkCount }, function(_, i) {
        return {
          x: x,
          y: y,
          angle: (2 * Math.PI * i) / this.sparkCount,
          startTime: now
        };
      }.bind(this));

      this.sparks.push.apply(this.sparks, newSparks);
    },
    draw: function(timestamp) {
      if (!this.startTime) {
        this.startTime = timestamp;
      }

      const canvas = this.$refs.canvasRef;
      const ctx = canvas && canvas.getContext('2d');
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      this.sparks = this.sparks.filter(function(spark) {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= this.duration) {
          return false;
        }

        const progress = elapsed / this.duration;
        const eased = this.easeFunc(progress);

        const distance = eased * this.sparkRadius * this.extraScale;
        const lineLength = this.sparkSize * (1 - eased);

        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        ctx.strokeStyle = this.sparkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        return true;
      }.bind(this));

      this.animationId = requestAnimationFrame(this.draw);
    },
    resizeCanvas: function() {
      const canvas = this.$refs.canvasRef;
      if (!canvas) return;

      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    },
    handleResize: function() {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      this.resizeTimeout = setTimeout(this.resizeCanvas, 100);
    },
    restartAnimation: function() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
      this.animationId = requestAnimationFrame(this.draw);
    }
  }
};
</script>

<style scoped>
    .click-spark {
        position: relative;
        width: 100%;
        height: 100%;
    }
    .click-spark-canvas {
        position: absolute;
        inset: 0;
        pointer-events: none;
    }
</style>