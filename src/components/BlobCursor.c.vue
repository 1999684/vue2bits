<template>
  <div
    ref="containerRef"
    @mousemove="handleMove"
    @touchmove="handleMove"
    class="blob-cursor-container"
    :style="{ zIndex: zIndex }"
  >
    <svg v-if="useFilter" class="blod-cursor-filter-svg">
      <filter :id="filterId">
        <feGaussianBlur in="SourceGraphic" result="blur" :stdDeviation="filterStdDeviation" />
        <feColorMatrix in="blur" :values="filterColorMatrixValues" />
      </filter>
    </svg>

    <div
      class="blob-cursor-filter-content"
      :style="{
        filter: useFilter ? `url(#${filterId})` : undefined
      }"
    >
      <div
        v-for="i in trailCountArray"
        :key="i"
        :ref="`blob-${i-1}`"
        class="blob-cursor-filter-content2"
        :style="{
          width: `${sizes[i-1]}px`,
          height: `${sizes[i-1]}px`,
          borderRadius: blobType == 'circle' ? '50%' : '0',
          backgroundColor: fillColor,
          opacity: opacities[i-1],
          boxShadow: `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px 0 ${shadowColor}`
        }"
      >
        <div
          style="position: absolute;"
          :style="{
            width: `${innerSizes[i-1]}px`,
            height: `${innerSizes[i-1]}px`,
            top: `${(sizes[i-1] - innerSizes[i-1]) / 2}px`,
            left: `${(sizes[i-1] - innerSizes[i-1]) / 2}px`,
            backgroundColor: innerColor,
            borderRadius: blobType === 'circle' ? '50%' : '0'
          }"
        />
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'BlobCursor',
  props: {
    blobType: {
      type: String,
      default: 'circle'
    },
    fillColor: {
      type: String,
      default: '#27FF64'
    },
    trailCount: {
      type: Number,
      default: 3
    },
    sizes: {
      type: Array,
      default: function() { return [60, 125, 75]; }
    },
    innerSizes: {
      type: Array,
      default: function() { return [20, 35, 25]; }
    },
    innerColor: {
      type: String,
      default: 'rgba(255,255,255,0.8)'
    },
    opacities: {
      type: Array,
      default: function() { return [0.6, 0.6, 0.6]; }
    },
    shadowColor: {
      type: String,
      default: 'rgba(0,0,0,0.75)'
    },
    shadowBlur: {
      type: Number,
      default: 5
    },
    shadowOffsetX: {
      type: Number,
      default: 10
    },
    shadowOffsetY: {
      type: Number,
      default: 10
    },
    filterId: {
      type: String,
      default: 'blob'
    },
    filterStdDeviation: {
      type: Number,
      default: 30
    },
    filterColorMatrixValues: {
      type: String,
      default: '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 35 -10'
    },
    useFilter: {
      type: Boolean,
      default: true
    },
    fastDuration: {
      type: Number,
      default: 0.1
    },
    slowDuration: {
      type: Number,
      default: 0.5
    },
    fastEase: {
      type: String,
      default: 'power3.out'
    },
    slowEase: {
      type: String,
      default: 'power1.out'
    },
    zIndex: {
      type: Number,
      default: 100
    }
  },
  computed: {
    trailCountArray: function() {
      return Array.from({length: this.trailCount}, (_, i) => i + 1);
    }
  },

  mounted: function() {
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy: function() {
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    updateOffset: function() {
      const containerRef = this.$refs.containerRef;
      if (!containerRef) return { left: 0, top: 0 };
      const rect = containerRef.getBoundingClientRect();
      return { left: rect.left, top: rect.top };
    },
    handleMove: function(e) {
      const { left, top } = this.updateOffset();
      const x = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const y = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

      for (let i = 0; i < this.trailCount; i++) {
        const el = this.$refs[`blob-${i}`];
        if (!el || !el[0]) continue;

        const isLead = i === 0;
        if (window.gsap) {
          window.gsap.to(el[0], {
            x: x - left,
            y: y - top,
            duration: isLead ? this.fastDuration : this.slowDuration,
            ease: isLead ? this.fastEase : this.slowEase
          });
        } else {
          // 如果没有 GSAP，则使用原生 CSS transition
          if (el[0]) {
            el[0].style.transform = `translate(${x - left}px, ${y - top}px)`;
            el[0].style.transition = `transform ${isLead ? this.fastDuration : this.slowDuration}s ${isLead ? this.fastEase : this.slowEase}`;
          }
        }
      }
    },
    handleResize: function() {
      // 在窗口大小调整时可能需要重新计算某些值
    }
  }
};
</script>

<style scoped>
.blob-cursor-container {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.blob-cursor-filter-svg {
  position: absolute;
  width: 0;
  height: 0;
}
.blob-cursor-filter-content {
    position: absolute;
    inset: 0;
    overflow: hidden;
    cursor: default;
    pointer-events: none;
    user-select: none;
}
.blob-cursor-filter-content2 {
    position: absolute;
    transform: translate(-50%, -50%);
    will-change: transform;
}
</style>
