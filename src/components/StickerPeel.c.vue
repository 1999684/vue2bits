<script>
/**
 * StickerPeel.c.vue
 * 注意：gsap 和 Draggable 插件需在预览环境或全局引入，本文件内不直接 import
 */
export default {
  name: "StickerPeel",
  props: {
    // 图片源地址
    imageSrc: {
      type: String,
      required: true,
    },
    // 旋转角度
    rotate: {
      type: Number,
      default: 30,
    },
    // 悬停时剥离百分比
    peelBackHoverPct: {
      type: Number,
      default: 30,
    },
    // 激活（点击）时剥离百分比
    peelBackActivePct: {
      type: Number,
      default: 40,
    },
    // 剥离动画缓动函数
    peelEasing: {
      type: String,
      default: "power3.out",
    },
    // 悬停剥离动画缓动函数
    peelHoverEasing: {
      type: String,
      default: "power2.out",
    },
    // 宽度
    width: {
      type: Number,
      default: 200,
    },
    // 阴影强度
    shadowIntensity: {
      type: Number,
      default: 0.6,
    },
    // 光照强度
    lightingIntensity: {
      type: Number,
      default: 0.1,
    },
    // 初始位置
    initialPosition: {
      type: [String, Object],
      default: "center",
    },
    // 剥离方向
    peelDirection: {
      type: Number,
      default: 0,
    },
    // 自定义类名
    className: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      draggableInstance: null,
      defaultPadding: 12,
      lightHandler: null,
      cleanupFn: null,
    };
  },
  computed: {
    cssVars() {
      return {
        "--sticker-rotate": `${this.rotate}deg`,
        "--sticker-p": `${this.defaultPadding}px`,
        "--sticker-peelback-hover": `${this.peelBackHoverPct}%`,
        "--sticker-peelback-active": `${this.peelBackActivePct}%`,
        "--sticker-peel-easing": this.peelEasing,
        "--sticker-peel-hover-easing": this.peelHoverEasing,
        "--sticker-width": `${this.width}px`,
        "--sticker-shadow-opacity": this.shadowIntensity,
        "--sticker-lighting-constant": this.lightingIntensity,
        "--peel-direction": `${this.peelDirection}deg`,
        "--sticker-start": `calc(-1 * ${this.defaultPadding}px)`,
        "--sticker-end": `calc(100% + ${this.defaultPadding}px)`,
      };
    },
    stickerMainStyle() {
      return {
        clipPath: `polygon(var(--sticker-start) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-end) var(--sticker-end), var(--sticker-start) var(--sticker-end))`,
        transition: "clip-path 0.6s ease-out",
        filter: "url(#dropShadow)",
        willChange: "clip-path, transform",
      };
    },
    flapStyle() {
      return {
        clipPath: `polygon(var(--sticker-start) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-start) var(--sticker-start))`,
        top: `calc(-100% - var(--sticker-p) - var(--sticker-p))`,
        transform: "scaleY(-1)",
        transition: "all 0.6s ease-out",
        willChange: "clip-path, transform",
      };
    },
    imageStyle() {
      return {
        transform: `rotate(calc(${this.rotate}deg - ${this.peelDirection}deg))`,
        width: `${this.width}px`,
      };
    },
    shadowImageStyle() {
      return {
        ...this.imageStyle,
        filter: "url(#expandAndFill)",
      };
    },
    dropShadowStdDeviation() {
      return 3 * this.shadowIntensity;
    },
    flippedLightingConstant() {
      return this.lightingIntensity * 7;
    },
  },
  watch: {
    initialPosition: {
      immediate: true,
      handler(val) {
        this.$nextTick(() => {
          const target = this.$refs.dragTargetRef;
          if (!target || typeof gsap === "undefined") return;

          let startX = 0,
            startY = 0;

          if (val === "center") return;

          if (typeof val === "object" && val.x !== undefined && val.y !== undefined) {
            startX = val.x;
            startY = val.y;
          }

          gsap.set(target, { x: startX, y: startY });
        });
      },
    },
    peelDirection: {
      immediate: true,
      handler() {
        this.initLightEffect();
      },
    },
  },
  mounted() {
    this.setupDraggable();
  },
  beforeDestroy() {
    if (this.lightHandler) {
      this.lightHandler();
    }
    if (this.cleanupFn) {
      this.cleanupFn();
    }
  },
  methods: {
    setupDraggable() {
      const target = this.$refs.dragTargetRef;
      if (!target || typeof Draggable === "undefined" || typeof gsap === "undefined") return;

      const boundsEl = target.parentNode;
      const draggable = Draggable.create(target, {
        type: "x,y",
        bounds: boundsEl,
        inertia: true,
        onDrag() {
          const rot = gsap.utils.clamp(-24, 24, this.deltaX * 0.4);
          gsap.to(target, { rotation: rot, duration: 0.15, ease: "power1.out" });
        },
        onDragEnd() {
          gsap.to(target, { rotation: 0, duration: 0.8, ease: "power2.out" });
        },
      });

      this.draggableInstance = draggable[0];

      const handleResize = () => {
        if (this.draggableInstance) {
          this.draggableInstance.update();
          const currentX = gsap.getProperty(target, "x");
          const currentY = gsap.getProperty(target, "y");
          const boundsRect = boundsEl.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();

          const maxX = boundsRect.width - targetRect.width;
          const maxY = boundsRect.height - targetRect.height;

          const newX = Math.max(0, Math.min(currentX, maxX));
          const newY = Math.max(0, Math.min(currentY, maxY));

          if (newX !== currentX || newY !== currentY) {
            gsap.to(target, { x: newX, y: newY, duration: 0.3, ease: "power2.out" });
          }
        }
      };

      window.addEventListener("resize", handleResize);
      window.addEventListener("orientationchange", handleResize);

      const container = this.$refs.containerRef;
      const handleTouchStart = () => container.classList.add("touch-active");
      const handleTouchEnd = () => container.classList.remove("touch-active");

      container.addEventListener("touchstart", handleTouchStart);
      container.addEventListener("touchend", handleTouchEnd);
      container.addEventListener("touchcancel", handleTouchEnd);

      this.cleanupFn = () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("orientationchange", handleResize);
        if (this.draggableInstance) this.draggableInstance.kill();
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchend", handleTouchEnd);
        container.removeEventListener("touchcancel", handleTouchEnd);
      };
    },
    initLightEffect() {
      if (this.lightHandler) this.lightHandler();

      const updateLight = (e) => {
        const rect = this.$refs.containerRef?.getBoundingClientRect();
        if (!rect || typeof gsap === "undefined") return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.$refs.pointLightRef) {
          gsap.set(this.$refs.pointLightRef, { attr: { x, y } });
        }

        const normalizedAngle = Math.abs(this.peelDirection % 360);
        if (this.$refs.pointLightFlippedRef) {
          if (normalizedAngle !== 180) {
            gsap.set(this.$refs.pointLightFlippedRef, {
              attr: { x, y: rect.height - y },
            });
          } else {
            gsap.set(this.$refs.pointLightFlippedRef, {
              attr: { x: -1000, y: -1000 },
            });
          }
        }
      };

      const container = this.$refs.containerRef;
      if (container) {
        container.addEventListener("mousemove", updateLight);
        this.lightHandler = () => container.removeEventListener("mousemove", updateLight);
      }
    },
  },
};
</script>

<template>
  <div
    ref="dragTargetRef"
    class="sticker-drag-target"
    :class="className"
    :style="cssVars"
  >
    <svg width="0" height="0" style="position: absolute">
      <defs>
        <filter id="pointLight">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feSpecularLighting
            result="spec"
            in="blur"
            :specularExponent="100"
            :specularConstant="lightingIntensity"
            lighting-color="white"
          >
            <fePointLight ref="pointLightRef" :x="100" :y="100" :z="300" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceGraphic" result="lit" />
          <feComposite in="lit" in2="SourceAlpha" operator="in" />
        </filter>

        <filter id="pointLightFlipped">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feSpecularLighting
            result="spec"
            in="blur"
            :specularExponent="100"
            :specularConstant="flippedLightingConstant"
            lighting-color="white"
          >
            <fePointLight ref="pointLightFlippedRef" :x="100" :y="100" :z="300" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceGraphic" result="lit" />
          <feComposite in="lit" in2="SourceAlpha" operator="in" />
        </filter>

        <filter id="dropShadow">
          <feDropShadow
            dx="2"
            dy="4"
            :stdDeviation="dropShadowStdDeviation"
            flood-color="black"
            :flood-opacity="shadowIntensity"
          />
        </filter>

        <filter id="expandAndFill">
          <feOffset dx="0" dy="0" in="SourceAlpha" result="shape" />
          <feFlood flood-color="rgb(179,179,179)" result="flood" />
          <feComposite operator="in" in="flood" in2="shape" />
        </filter>
      </defs>
    </svg>

    <div
      class="sticker-container"
      ref="containerRef"
      :style="{
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
        transform: `rotate(${peelDirection}deg)`,
        transformOrigin: 'center'
      }"
    >
      <div class="sticker-main" :style="stickerMainStyle">
        <div :style="{ filter: 'url(#pointLight)' }">
          <img :src="imageSrc" alt="" class="sticker-img" :style="imageStyle" draggable="false" @contextmenu.prevent />
        </div>

        <div class="sticker-shadow-wrapper" :style="{ filter: 'brightness(0) blur(8px)' }">
          <div class="sticker-flap" :style="flapStyle">
            <img
              :src="imageSrc"
              alt=""
              class="sticker-img"
              :style="shadowImageStyle"
              draggable="false"
              @contextmenu.prevent
            />
          </div>
        </div>

        <div class="sticker-flap-wrapper sticker-flap" :style="flapStyle">
          <div :style="{ filter: 'url(#pointLightFlipped)' }">
            <img
              :src="imageSrc"
              alt=""
              class="sticker-img"
              :style="shadowImageStyle"
              draggable="false"
              @contextmenu.prevent
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sticker-drag-target {
  position: absolute;
  cursor: grab;
  transform-style: preserve-3d;
}
.sticker-drag-target:active {
  cursor: grabbing;
}

.sticker-container {
  position: relative;
  touch-action: none;
  user-select: none;
}

.sticker-img {
  display: block;
}

.sticker-main {
  position: relative;
}

.sticker-shadow-wrapper {
  position: absolute;
  top: 1rem;
  left: 0.5rem;
  opacity: 0.4;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.sticker-flap-wrapper {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

.sticker-container:hover .sticker-main,
.sticker-container.touch-active .sticker-main {
  clip-path: polygon(
    var(--sticker-start) var(--sticker-peelback-hover),
    var(--sticker-end) var(--sticker-peelback-hover),
    var(--sticker-end) var(--sticker-end),
    var(--sticker-start) var(--sticker-end)
  ) !important;
}

.sticker-container:hover .sticker-flap,
.sticker-container.touch-active .sticker-flap {
  clip-path: polygon(
    var(--sticker-start) var(--sticker-start),
    var(--sticker-end) var(--sticker-start),
    var(--sticker-end) var(--sticker-peelback-hover),
    var(--sticker-start) var(--sticker-peelback-hover)
  ) !important;
  top: calc(-100% + 2 * var(--sticker-peelback-hover) - 1px) !important;
}

.sticker-container:active .sticker-main {
  clip-path: polygon(
    var(--sticker-start) var(--sticker-peelback-active),
    var(--sticker-end) var(--sticker-peelback-active),
    var(--sticker-end) var(--sticker-end),
    var(--sticker-start) var(--sticker-end)
  ) !important;
}

.sticker-container:active .sticker-flap {
  clip-path: polygon(
    var(--sticker-start) var(--sticker-start),
    var(--sticker-end) var(--sticker-start),
    var(--sticker-end) var(--sticker-peelback-active),
    var(--sticker-start) var(--sticker-peelback-active)
  ) !important;
  top: calc(-100% + 2 * var(--sticker-peelback-active) - 1px) !important;
}
</style>
