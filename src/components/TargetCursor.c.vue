<script>
export default {
  name: "TargetCursor",
  props: {
    // 目标选择器
    targetSelector: {
      type: String,
      default: ".cursor-target",
    },
    // 旋转周期（秒）
    spinDuration: {
      type: Number,
      default: 2,
    },
    // 是否隐藏默认光标
    hideDefaultCursor: {
      type: Boolean,
      default: true,
    },
    // 光标颜色
    color: {
      type: String,
      default: "white",
    },
  },
  data() {
    return {
      spinTl: null,
      corners: null,
      constants: {
        borderWidth: 3,
        cornerSize: 12,
        parallaxStrength: 0.00005,
      },
      cleanupAnimation: null,
      originalCursor: "",
    };
  },
  computed: {
    rootStyles() {
      return {
        "--cursor-color": this.color,
        willChange: "transform",
      };
    },
  },
  watch: {
    // 监听核心参数变化，重新初始化
    targetSelector() {
      this.reinit();
    },
    spinDuration() {
      this.reinit();
    },
    hideDefaultCursor() {
      this.reinit();
    },
  },
  mounted() {
    this.setupAnimation();
  },
  beforeDestroy() {
    if (this.cleanupAnimation) {
      this.cleanupAnimation();
    }
  },
  methods: {
    reinit() {
      if (this.cleanupAnimation) this.cleanupAnimation();
      this.setupAnimation();
    },
    moveCursor(x, y) {
      if (!this.$refs.cursorRef || typeof gsap === "undefined") return;
      gsap.to(this.$refs.cursorRef, {
        x,
        y,
        duration: 0.1,
        ease: "power3.out",
      });
    },
    setupAnimation() {
      if (typeof gsap === "undefined") return;

      const cursor = this.$refs.cursorRef;
      if (!cursor) return;

      this.originalCursor = document.body.style.cursor;
      if (this.hideDefaultCursor) {
        document.body.style.cursor = "none";
      }

      this.corners = cursor.querySelectorAll(".target-cursor-corner");

      let activeTarget = null;
      let currentTargetMove = null;
      let currentLeaveHandler = null;
      let isAnimatingToTarget = false;
      let resumeTimeout = null;

      const cleanupTarget = (target) => {
        if (currentTargetMove) target.removeEventListener("mousemove", currentTargetMove);
        if (currentLeaveHandler) target.removeEventListener("mouseleave", currentLeaveHandler);
        currentTargetMove = null;
        currentLeaveHandler = null;
      };

      // 初始化位置和状态
      gsap.set(cursor, {
        xPercent: -50,
        yPercent: -50,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        opacity: 1,
        display: "block",
      });

      // 创建旋转动画
      const createSpinTimeline = () => {
        if (this.spinTl) this.spinTl.kill();
        this.spinTl = gsap.timeline({ repeat: -1 }).to(cursor, {
          rotation: "+=360",
          duration: this.spinDuration,
          ease: "none",
        });
      };
      createSpinTimeline();

      // 全局鼠标移动处理
      const moveHandler = (e) => this.moveCursor(e.clientX, e.clientY);
      window.addEventListener("mousemove", moveHandler);

      // 目标进入处理
      const enterHandler = (e) => {
        const directTarget = e.target;
        let current = directTarget;
        let target = null;

        while (current && current !== document.body) {
          if (current.matches && current.matches(this.targetSelector)) {
            target = current;
            break;
          }
          current = current.parentElement;
        }

        if (!target || !this.$refs.cursorRef || !this.corners) return;
        if (activeTarget === target) return;

        if (activeTarget) cleanupTarget(activeTarget);
        if (resumeTimeout) {
          clearTimeout(resumeTimeout);
          resumeTimeout = null;
        }

        activeTarget = target;
        const cornerArray = Array.from(this.corners);
        cornerArray.forEach((c) => gsap.killTweensOf(c));
        gsap.killTweensOf(cursor, "rotation");
        if (this.spinTl) this.spinTl.pause();

        gsap.set(cursor, { rotation: 0 });

        const updateCorners = (mouseX, mouseY) => {
          const rect = target.getBoundingClientRect();
          const cursorRect = cursor.getBoundingClientRect();
          const cursorCenterX = cursorRect.left + cursorRect.width / 2;
          const cursorCenterY = cursorRect.top + cursorRect.height / 2;

          const [tlc, trc, brc, blc] = cornerArray;
          const { borderWidth, cornerSize, parallaxStrength } = this.constants;

          const offsets = [
            { x: rect.left - cursorCenterX - borderWidth, y: rect.top - cursorCenterY - borderWidth },
            { x: rect.right - cursorCenterX + borderWidth - cornerSize, y: rect.top - cursorCenterY - borderWidth },
            { x: rect.right - cursorCenterX + borderWidth - cornerSize, y: rect.bottom - cursorCenterY + borderWidth - cornerSize },
            { x: rect.left - cursorCenterX - borderWidth, y: rect.bottom - cursorCenterY + borderWidth - cornerSize },
          ];

          if (mouseX !== undefined && mouseY !== undefined) {
            const targetCenterX = rect.left + rect.width / 2;
            const targetCenterY = rect.top + rect.height / 2;
            const mouseOffsetX = (mouseX - targetCenterX) * parallaxStrength;
            const mouseOffsetY = (mouseY - targetCenterY) * parallaxStrength;
            offsets.forEach((off) => {
              off.x += mouseOffsetX;
              off.y += mouseOffsetY;
            });
          }

          const tl = gsap.timeline();
          [tlc, trc, brc, blc].forEach((c, i) => {
            tl.to(c, { x: offsets[i].x, y: offsets[i].y, duration: 0.2, ease: "power2.out" }, 0);
          });
        };

        isAnimatingToTarget = true;
        updateCorners();
        setTimeout(() => { isAnimatingToTarget = false; }, 1);

        let moveThrottle = null;
        const targetMove = (ev) => {
          if (moveThrottle || isAnimatingToTarget) return;
          moveThrottle = requestAnimationFrame(() => {
            updateCorners(ev.clientX, ev.clientY);
            moveThrottle = null;
          });
        };

        const leaveHandler = () => {
          activeTarget = null;
          isAnimatingToTarget = false;

          const { cornerSize } = this.constants;
          const positions = [
            { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
            { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
            { x: cornerSize * 0.5, y: cornerSize * 0.5 },
            { x: -cornerSize * 1.5, y: cornerSize * 0.5 },
          ];

          const tl = gsap.timeline();
          cornerArray.forEach((c, i) => {
            tl.to(c, { x: positions[i].x, y: positions[i].y, duration: 0.3, ease: "power3.out" }, 0);
          });

          resumeTimeout = setTimeout(() => {
            if (!activeTarget && this.$refs.cursorRef && this.spinTl) {
              const currentRotation = gsap.getProperty(this.$refs.cursorRef, "rotation") || 0;
              const normalizedRotation = currentRotation % 360;
              this.spinTl.kill();
              this.spinTl = gsap.timeline({ repeat: -1 }).to(this.$refs.cursorRef, {
                rotation: "+=360",
                duration: this.spinDuration,
                ease: "none",
              });
              gsap.to(this.$refs.cursorRef, {
                rotation: normalizedRotation + 360,
                duration: this.spinDuration * (1 - normalizedRotation / 360),
                ease: "none",
                onComplete: () => { if (this.spinTl) this.spinTl.restart(); },
              });
            }
            resumeTimeout = null;
          }, 50);

          cleanupTarget(target);
        };

        currentTargetMove = targetMove;
        currentLeaveHandler = leaveHandler;
        target.addEventListener("mousemove", targetMove);
        target.addEventListener("mouseleave", leaveHandler);
      };

      window.addEventListener("mouseover", enterHandler, { passive: true });

      this.cleanupAnimation = () => {
        window.removeEventListener("mousemove", moveHandler);
        window.removeEventListener("mouseover", enterHandler);
        if (activeTarget) cleanupTarget(activeTarget);
        if (resumeTimeout) clearTimeout(resumeTimeout);
        if (this.spinTl) this.spinTl.kill();
        if (cursor) {
          gsap.killTweensOf(cursor);
          gsap.set(cursor, { x: 0, y: 0, rotation: 0, opacity: 0, display: "none" });
        }
        if (this.corners) gsap.killTweensOf(Array.from(this.corners));
        document.body.style.cursor = this.originalCursor;
      };
    },
  },
};
</script>

<template>
  <div ref="cursorRef" class="target-cursor-root" :style="rootStyles">
    <div class="target-cursor-center" />
    <div class="target-cursor-corner corner-tl" />
    <div class="target-cursor-corner corner-tr" />
    <div class="target-cursor-corner corner-br" />
    <div class="target-cursor-corner corner-bl" />
  </div>
</template>

<style scoped>
.target-cursor-root {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  width: 0;
  height: 0;
  transform: translate(-50%, -50%);
  pointer-events: none;
  mix-blend-difference: difference;
  opacity: 0;
}

.target-cursor-center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  background-color: var(--cursor-color, white);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  will-change: transform;
}

.target-cursor-corner {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  border: 3px solid var(--cursor-color, white);
  will-change: transform;
}

.corner-tl {
  border-right: 0;
  border-bottom: 0;
  transform: translate(-150%, -150%);
}

.corner-tr {
  border-bottom: 0;
  border-left: 0;
  transform: translate(50%, -150%);
}

.corner-br {
  border-top: 0;
  border-left: 0;
  transform: translate(50%, 50%);
}

.corner-bl {
  border-top: 0;
  border-right: 0;
  transform: translate(-150%, 50%);
}
</style>
