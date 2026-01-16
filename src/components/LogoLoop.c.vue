<template>
  <div
    ref="containerRef"
    :class="rootClasses"
    :style="containerStyle"
    role="region"
    :aria-label="ariaLabel"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 淡出蒙层 -->
    <template v-if="fadeOut">
      <div
        aria-hidden="true"
        :style="fadeLeftStyle"
        class="fade-layer fade-left"
      />
      <div
        aria-hidden="true"
        :style="fadeRightStyle"
        class="fade-layer fade-right"
      />
    </template>

    <!-- 轨道 -->
    <div
      ref="trackRef"
      :style="trackStyle"
      class="track"
    >
      <!-- 循环副本 -->
      <ul
        v-for="copyIndex in copyCount"
        :key="`copy-${copyIndex - 1}`"
        :ref="`copy${copyIndex - 1}`"
        class="logo-list"
        role="list"
        :aria-hidden="copyIndex > 1 ? 'true' : 'false'"
      >
        <!-- 单个Logo项 -->
        <li
          v-for="(item, itemIndex) in logos"
          :key="`${copyIndex - 1}-${itemIndex}`"
          :style="logoItemStyle"
          :class="{ 'scale-on-hover': scaleOnHover }"
          class="logo-item"
          role="listitem"
        >
          <!-- 带链接 -->
          <a
            v-if="item.href"
            :href="item.href"
            :aria-label="getItemAriaLabel(item) || 'logo link'"
            target="_blank"
            rel="noreferrer noopener"
            class="logo-link"
            :style="logoLinkStyle"
          >
            <LogoContent
              :item="item"
              :scale-on-hover="scaleOnHover"
            />
          </a>
          <!-- 不带链接 -->
          <LogoContent
            v-else
            :item="item"
            :scale-on-hover="scaleOnHover"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import LogoContent from './LogoContent.c.vue';

const ANIMATION_CONFIG = {
  SMOOTH_TAU: 0.25,
  MIN_COPIES: 2,
  COPY_HEADROOM: 2
};

export default {
  name: 'LogoLoop',
  components: {
    LogoContent
  },
  props: {
    logos: {
      type: Array,
      required: true,
      validator: (arr) => arr.every(item => item.src || item.node)
    },
    speed: {
      type: Number,
      default: 120
    },
    direction: {
      type: String,
      default: 'left',
      validator: val => ['left', 'right'].includes(val)
    },
    width: {
      type: [Number, String],
      default: '100%'
    },
    logoHeight: {
      type: Number,
      default: 60
    },
    gap: {
      type: Number,
      default: 32
    },
    pauseOnHover: {
      type: Boolean,
      default: true
    },
    fadeOut: {
      type: Boolean,
      default: false
    },
    fadeOutColor: {
      type: String,
      default: ''
    },
    scaleOnHover: {
      type: Boolean,
      default: false
    },
    ariaLabel: {
      type: String,
      default: 'logo loop'
    },
    className: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      seqWidth: 0,
      copyCount: ANIMATION_CONFIG.MIN_COPIES,
      isHovered: false,
      offsetRef: 0,
      velocityRef: 0,
      rafRef: null,
      lastTimestampRef: null,
      resizeObserver: null,
      cleanupResize: null,
      cleanupImages: null,
      cleanupAnimation: null
    };
  },

  computed: {
    // 目标速度计算
    targetVelocity() {
      const magnitude = Math.abs(this.speed);
      const directionMultiplier = this.direction === 'left' ? 1 : -1;
      const speedMultiplier = this.speed < 0 ? -1 : 1;
      return magnitude * directionMultiplier * speedMultiplier;
    },

    // 容器样式
    containerStyle() {
      const style = {
        width: typeof this.width === 'number' ? `${this.width}px` : this.width,
        position: 'relative',
        overflow: 'hidden',
        '--logoloop-gap': `${this.gap}px`,
        '--logoloop-logoHeight': `${this.logoHeight}px`
      };

      if (this.fadeOutColor) {
        style['--logoloop-fadeColor'] = this.fadeOutColor;
      }

      // 检测深色模式 (简单实现)
      if (!this.fadeOutColor) {
        const isDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        style['--logoloop-fadeColorAuto'] = isDark ? '#0b0b0b' : '#ffffff';
      }

      return style;
    },

    // 轨道样式
    trackStyle() {
      return {
        display: 'flex',
        width: 'max-content',
        willChange: 'transform',
        userSelect: 'none',
        transform: `translate3d(${-this.offsetRef}px, 0, 0)`,
        transition: this.prefersReducedMotion ? 'none' : 'none'
      };
    },

    // Logo项样式
    logoItemStyle() {
      return {
        flexShrink: 0,
        marginRight: `${this.gap}px`,
        fontSize: `${this.logoHeight}px`,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        position: 'relative'
      };
    },

    // Logo链接样式
    logoLinkStyle() {
      return {
        display: 'inline-flex',
        alignItems: 'center',
        textDecoration: 'none',
        borderRadius: '4px',
        transition: 'opacity 200ms linear',
        outline: 'none'
      };
    },

    // 淡出层左侧样式
    fadeLeftStyle() {
      const fadeColor = this.fadeOutColor ||
        (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? '#0b0b0b' : '#ffffff');
      return {
        pointerEvents: 'none',
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 1,
        width: 'clamp(24px, 8%, 120px)',
        background: `linear-gradient(to right, ${fadeColor} 0%, rgba(0, 0, 0, 0) 100%)`
      };
    },

    // 淡出层右侧样式
    fadeRightStyle() {
      const fadeColor = this.fadeOutColor ||
        (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? '#0b0b0b' : '#ffffff');
      return {
        pointerEvents: 'none',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        width: 'clamp(24px, 8%, 120px)',
        background: `linear-gradient(to left, ${fadeColor} 0%, rgba(0, 0, 0, 0) 100%)`
      };
    },

    // 根容器类名
    rootClasses() {
      const classes = ['logo-loop-container'];
      if (this.scaleOnHover) {
        classes.push('has-scale-hover');
      }
      if (this.className) {
        classes.push(this.className);
      }
      return classes;
    },

    // 检测减速运动偏好
    prefersReducedMotion() {
      return typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    }
  },

  watch: {
    // 监听 logos、gap、logoHeight 变化
    logos: {
      handler() {
        this.$nextTick(() => {
          this.cleanupImages?.();
          this.cleanupImages = this.setupImageLoader();
        });
      },
      deep: true
    },
    gap() {
      this.$nextTick(() => {
        this.cleanupImages?.();
        this.cleanupImages = this.setupImageLoader();
      });
    },
    logoHeight() {
      this.$nextTick(() => {
        this.cleanupImages?.();
        this.cleanupImages = this.setupImageLoader();
      });
    }
  },

  mounted() {
    this.$nextTick(() => {
      setTimeout(() => {
        this.cleanupResize = this.setupResizeObserver();
        this.cleanupImages = this.setupImageLoader();
      }, 10);
    });
  },

  beforeDestroy() {
    this.cleanup();
  },

  methods: {
    // 处理鼠标进入
    handleMouseEnter() {
      if (this.pauseOnHover) {
        this.isHovered = true;
      }
    },

    // 处理鼠标离开
    handleMouseLeave() {
      if (this.pauseOnHover) {
        this.isHovered = false;
      }
    },

    // 获取项的 aria-label
    getItemAriaLabel(item) {
      if (item.node) {
        return item.ariaLabel || item.title;
      }
      return item.alt || item.title;
    },

    // 更新尺寸
    async updateDimensions() {
      await this.$nextTick();

      const container = this.$refs.containerRef;
      const seqRef = this.$refs.copy0?.[0]; // 获取第一个副本

      if (!container || !seqRef) return;

      const containerWidth = container.clientWidth || 0;
      const sequenceWidth = seqRef.getBoundingClientRect?.()?.width || 0;

      if (sequenceWidth > 0) {
        this.seqWidth = Math.ceil(sequenceWidth);

        const copiesNeeded =
          Math.ceil(containerWidth / sequenceWidth) + ANIMATION_CONFIG.COPY_HEADROOM;

        this.copyCount = Math.max(ANIMATION_CONFIG.MIN_COPIES, copiesNeeded);

        this.cleanupAnimation?.();
        this.cleanupAnimation = this.startAnimationLoop();
      }
    },

    // 设置 ResizeObserver
    setupResizeObserver() {
      if (!window.ResizeObserver) {
        const handleResize = () => this.updateDimensions();
        window.addEventListener('resize', handleResize);
        this.updateDimensions();

        return () => window.removeEventListener('resize', handleResize);
      }

      this.resizeObserver = new ResizeObserver(() => this.updateDimensions());

      const container = this.$refs.containerRef;
      const seqRef = this.$refs.copy0?.[0];

      if (container) {
        this.resizeObserver.observe(container);
      }
      if (seqRef) {
        this.resizeObserver.observe(seqRef);
      }

      this.updateDimensions();

      return () => {
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
      };
    },

    // 设置图片加载器
    setupImageLoader() {
      const seqRef = this.$refs.copy0?.[0];
      const images = seqRef?.querySelectorAll('img') || [];

      if (images.length === 0) {
        this.updateDimensions();
        return;
      }

      let remainingImages = images.length;

      const handleImageLoad = () => {
        remainingImages -= 1;
        if (remainingImages === 0) {
          this.updateDimensions();
        }
      };

      images.forEach(img => {
        if (img.complete) {
          handleImageLoad();
        } else {
          img.addEventListener('load', handleImageLoad, { once: true });
          img.addEventListener('error', handleImageLoad, { once: true });
        }
      });

      return () => {
        images.forEach(img => {
          img.removeEventListener('load', handleImageLoad);
          img.removeEventListener('error', handleImageLoad);
        });
      };
    },

    // 启动动画循环
    startAnimationLoop() {
      const track = this.$refs.trackRef;
      if (!track) return;

      if (this.seqWidth > 0) {
        this.offsetRef = ((this.offsetRef % this.seqWidth) + this.seqWidth) % this.seqWidth;
        track.style.transform = `translate3d(${-this.offsetRef}px, 0, 0)`;
      }

      if (this.prefersReducedMotion) {
        track.style.transform = 'translate3d(0, 0, 0)';
        return () => {
          this.lastTimestampRef = null;
        };
      }

      const animate = (timestamp) => {
        if (this.lastTimestampRef === null) {
          this.lastTimestampRef = timestamp;
        }

        const deltaTime = Math.max(0, timestamp - this.lastTimestampRef) / 1000;
        this.lastTimestampRef = timestamp;

        // 计算目标速度
        const target = this.pauseOnHover && this.isHovered ? 0 : this.targetVelocity;

        // 平滑插值
        const easingFactor = 1 - Math.exp(-deltaTime / ANIMATION_CONFIG.SMOOTH_TAU);
        this.velocityRef += (target - this.velocityRef) * easingFactor;

        if (this.seqWidth > 0) {
          let nextOffset = this.offsetRef + this.velocityRef * deltaTime;
          nextOffset = ((nextOffset % this.seqWidth) + this.seqWidth) % this.seqWidth;
          this.offsetRef = nextOffset;

          const translateX = -this.offsetRef;
          track.style.transform = `translate3d(${translateX}px, 0, 0)`;
        }

        this.rafRef = requestAnimationFrame(animate);
      };

      this.rafRef = requestAnimationFrame(animate);

      return () => {
        if (this.rafRef !== null) {
          cancelAnimationFrame(this.rafRef);
          this.rafRef = null;
        }
        this.lastTimestampRef = null;
      };
    },

    // 清理所有资源
    cleanup() {
      this.cleanupResize?.();
      this.cleanupImages?.();
      this.cleanupAnimation?.();
    }
  }
};
</script>

<style scoped>
/* 容器 */
.logo-loop-container {
  position: relative;
  overflow: hidden;
  display: block;
}

.logo-loop-container.has-scale-hover {
  padding: calc(var(--logoloop-logoHeight) * 0.1) 0;
}

/* 轨道 */
.track {
  display: flex;
  width: max-content;
  will-change: transform;
  user-select: none;
}

@media (prefers-reduced-motion: reduce) {
  .track {
    transform: none !important;
  }
}

/* Logo列表 */
.logo-list {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Logo项 */
.logo-item {
  flex-shrink: 0;
  margin-right: var(--logoloop-gap);
  font-size: var(--logoloop-logoHeight);
  line-height: 1;
  display: flex;
  align-items: center;
}

.logo-item.scale-on-hover {
  overflow: visible;
}

/* Logo链接 */
.logo-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  border-radius: 4px;
  transition: opacity 200ms linear;
  outline: none;
}

.logo-link:hover {
  opacity: 0.8;
}

.logo-link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .logo-link {
    transition: none;
  }
}

/* 淡出层 */
.fade-layer {
  pointer-events: none;
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 1;
}

.fade-left {
  left: 0;
}

.fade-right {
  right: 0;
}

@media (prefers-reduced-motion: reduce) {
  .fade-layer {
    display: none;
  }
}
</style>
