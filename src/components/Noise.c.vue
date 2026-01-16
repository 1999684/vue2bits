<template>
  <canvas
    ref="grainRef"
    class="grain-canvas"
    :style="canvasStyle"
  ></canvas>
</template>

<script>
export default {
  name: 'Noise',
  props: {
    patternRefreshInterval: {
      type: Number,
      default: 2
    },
    patternAlpha: {
      type: Number,
      default: 10
    },
    mixBlendMode: {
      type: String,
      default: 'normal'
    }
  },

  data() {
    return {
      animationId: 0,
      frame: 0,
      canvasSize: 1024,
      noiseData: null,
      noise32: null,
      ctx: null
    };
  },

  computed: {
    canvasStyle() {
      return {
        imageRendering: 'pixelated',
        mixBlendMode: this.mixBlendMode,
        pointerEvents: 'none',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh'
      };
    }
  },

  mounted() {
    this.initialize();
    window.addEventListener('resize', this.resize);
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.resize);
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  },

  methods: {
    initialize() {
      const canvas = this.$refs.grainRef;
      if (!canvas) return;

      this.ctx = canvas.getContext('2d', { alpha: true });
      if (!this.ctx) return;

      this.resize();
      this.initImageData();
      this.drawGrain();
      this.ctx.putImageData(this.noiseData, 0, 0);
      this.loop();
    },

    resize() {
      const canvas = this.$refs.grainRef;
      if (!canvas) return;

      canvas.width = this.canvasSize;
      canvas.height = this.canvasSize;
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
    },

    initImageData() {
      if (!this.ctx) return;

      this.noiseData = this.ctx.createImageData(
        this.canvasSize,
        this.canvasSize
      );
      this.noise32 = new Uint32Array(this.noiseData.data.buffer);
    },

    drawGrain() {
      const a = this.patternAlpha << 24;

      for (let i = 0; i < this.noise32.length; i++) {
        const v = (Math.random() * 255) | 0;
        this.noise32[i] = a | (v << 16) | (v << 8) | v;
      }
    },

    loop() {
      const interval = Math.max(1, Math.round(this.patternRefreshInterval));

      if (this.frame % interval === 0) {
        this.drawGrain();
        this.ctx.putImageData(this.noiseData, 0, 0);
      }

      this.frame++;
      this.animationId = requestAnimationFrame(() => this.loop());
    }
  }
};
</script>

<style scoped>
.grain-canvas {
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}
</style>
