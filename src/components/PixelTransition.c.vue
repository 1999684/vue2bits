<template>
  <div
    ref="containerRef"
    :class="containerClasses"
    :style="ptStyle"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
  >
    <!-- Aspect Ratio Spacer -->
    <div :style="paddingTopStyle" />

    <!-- First Content (Default) -->
    <div class="pixel-transition-first-content">
      <slot name="firstcontent" />
    </div>

    <!-- Second Content (Active) -->
    <div
      ref="activeRef"
      class="pixel-transition-second-content"
      style="display: none"
    >
      <slot name="secondcontent" />
    </div>

    <!-- Pixel Grid Overlay -->
    <div
      ref="pixelGridRef"
      class="pixel-transition-third-content"
    />
  </div>
</template>
<script>
export default {
  name: 'PixelTransition',

  props: {
    gridSize: {
      type: Number,
      default: 7
    },
    pixelColor: {
      type: String,
      default: '#00ff00'
    },
    animationStepDuration: {
      type: Number,
      default: 0.3
    },
    className: {
      type: String,
      default: ''
    },
    ptStyle: {
      type: Object,
      default: () => ({})
    },
    aspectRatio: {
      type: String,
      default: '100%'
    }
  },

  data() {
    return {
      isActive: false,
      delayedCall: null,
      isTouchDevice:
        typeof window !== 'undefined' &&
        ('ontouchstart' in window ||
          (navigator && navigator.maxTouchPoints > 0) ||
          (typeof window.matchMedia !== 'undefined' &&
            window.matchMedia('(pointer: coarse)').matches))
    };
  },

  computed: {
    containerClasses() {
      return [
        this.className,
        'default-container',
      ];
    },

    paddingTopStyle() {
      return {
        paddingTop: this.aspectRatio
      };
    }
  },

  watch: {
    gridSize() {
      this.buildPixelGrid();
    },
    pixelColor() {
      this.buildPixelGrid();
    }
  },

  mounted() {
    this.$nextTick(() => {
      this.buildPixelGrid();
    });
  },

  beforeDestroy() {
    if (this.delayedCall) {
      this.delayedCall.kill();
    }
  },

  methods: {
    buildPixelGrid() {
      const pixelGridEl = this.$refs.pixelGridRef;
      if (!pixelGridEl) return;

      pixelGridEl.innerHTML = '';

      for (let row = 0; row < this.gridSize; row++) {
        for (let col = 0; col < this.gridSize; col++) {
          const pixel = document.createElement('div');
          pixel.classList.add(
            'pixelated-image-card-pixel',
            'abs-hidden'
          );
          pixel.style.backgroundColor = this.pixelColor;

          const size = 100 / this.gridSize;
          pixel.style.width = `${size}%`;
          pixel.style.height = `${size}%`;
          pixel.style.left = `${col * size}%`;
          pixel.style.top = `${row * size}%`;
          pixel.style.display = 'none';

          pixelGridEl.appendChild(pixel);
        }
      }
    },

    async animatePixels(activate) {
      this.isActive = activate;

      await this.$nextTick();

      const pixelGridEl = this.$refs.pixelGridRef;
      const activeEl = this.$refs.activeRef;

      if (!pixelGridEl || !activeEl) return;

      const pixels = pixelGridEl.querySelectorAll(
        '.pixelated-image-card-pixel'
      );

      if (!pixels.length) return;

      // Kill any existing tweens
      gsap.killTweensOf(pixels);
      if (this.delayedCall) {
        this.delayedCall.kill();
      }

      // Hide all pixels initially
      gsap.set(pixels, { display: 'none' });

      const totalPixels = pixels.length;
      const staggerDuration = this.animationStepDuration / totalPixels;

      // Show pixels with stagger
      gsap.to(pixels, {
        display: 'block',
        duration: 0,
        stagger: {
          each: staggerDuration,
          from: 'random'
        }
      });

      // Change active element display at the midpoint
      this.delayedCall = gsap.delayedCall(this.animationStepDuration, () => {
        activeEl.style.display = activate ? 'block' : 'none';
        activeEl.style.pointerEvents = activate ? 'none' : '';
      });

      // Hide pixels with stagger after animation duration
      gsap.to(pixels, {
        display: 'none',
        duration: 0,
        delay: this.animationStepDuration,
        stagger: {
          each: staggerDuration,
          from: 'random'
        }
      });
    },

    handleMouseEnter() {
      if (this.isTouchDevice) return;
      if (!this.isActive) {
        this.animatePixels(true);
      }
    },

    handleMouseLeave() {
      if (this.isTouchDevice) return;
      if (this.isActive) {
        this.animatePixels(false);
      }
    },

    handleClick() {
      if (!this.isTouchDevice) return;
      this.animatePixels(!this.isActive);
    }
  }
};
</script>


<style scoped>
::v-deep .pixelated-image-card-pixel {
  transition: none;
}
::v-deep .abs-hidden {
    position: absolute;
}
.pixel-transition-first-content {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}
.pixel-transition-second-content {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
}
.pixel-transition-third-content {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 3;
}
.default-container {
    background: #222;
    color: white;
    border-radius: 15px;
    border: 2px solid white;
    width: 300px;
    max-width: 100%;
    position: relative;
    overflow: hidden;
}
</style>
