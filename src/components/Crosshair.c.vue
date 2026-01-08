<template>
  <div
    ref="cursorRef"
    :style="{
      position: containerRef ? 'absolute' : 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 10000
    }"
  >
    <svg
      :style="{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%'
      }"
    >
      <defs>
        <filter id="filter-noise-x">
          <feTurbulence type="fractalNoise" baseFrequency="0.000001" numOctaves="1" />
          <feDisplacementMap in="SourceGraphic" scale="40" />
        </filter>
        <filter id="filter-noise-y">
          <feTurbulence type="fractalNoise" baseFrequency="0.000001" numOctaves="1" />
          <feDisplacementMap in="SourceGraphic" scale="40" />
        </filter>
      </defs>
    </svg>
    <div
      ref="lineHorizontalRef"
      :style="{
        position: 'absolute',
        width: '100%',
        height: '1px',
        background: color,
        pointerEvents: 'none',
        transform: 'translateY(50%)',
        opacity: 0
      }"
    />
    <div
      ref="lineVerticalRef"
      :style="{
        position: 'absolute',
        height: '100%',
        width: '1px',
        background: color,
        pointerEvents: 'none',
        transform: 'translateX(50%)',
        opacity: 0
      }"
    />
  </div>
</template>

<script>
export default {
  name: 'Crosshair',
  props: {
    color: {
      type: String,
      default: 'white'
    },
    containerRef: {
      type: null,
      default: null
    }
  },
  data: function() {
    return {
      mouse: { x: 0, y: 0 },
      animationId: null,
      cleanup: null,
      renderedStyles: {
        tx: { previous: 0, current: 0, amt: 0.15 },
        ty: { previous: 0, current: 0, amt: 0.15 }
      },
      primitiveValues: { turbulence: 0 }
    };
  },
  computed: {
    targetElement: function() {
      return this.containerRef || window;
    }
  },
  mounted: function() {
    this.initCrosshair();
  },
  watch: {
    containerRef: function(newVal, oldVal) {
      // 当 containerRef 发生变化时，重新初始化交叉线
      if (this.cleanup) {
        this.cleanup();
      }
      // 等待下一个 tick 确保 DOM 更新
      this.$nextTick(function() {
        this.initCrosshair();
      });
    }
  },
  beforeDestroy: function() {
    if (this.cleanup) {
      this.cleanup();
    }
  },
  methods: {
    lerp: function(a, b, n) {
      return (1 - n) * a + n * b;
    },
    getMousePos: function(e, container) {
      if (container) {
        const bounds = container.getBoundingClientRect();
        return {
          x: e.clientX - bounds.left,
          y: e.clientY - bounds.top
        };
      }
      return { x: e.clientX, y: e.clientY };
    },
    initCrosshair: function() {
      if (this.cleanup) {
        this.cleanup();
      }

      const self = this;
      
      const handleMouseMove = function(ev) {
        const mouseEvent = ev;
        self.mouse = self.getMousePos(mouseEvent, self.containerRef);

        if (self.containerRef) {
          const bounds = self.containerRef.getBoundingClientRect();
          if (
            mouseEvent.clientX < bounds.left ||
            mouseEvent.clientX > bounds.right ||
            mouseEvent.clientY < bounds.top ||
            mouseEvent.clientY > bounds.bottom
          ) {
            if (window.gsap) {
              window.gsap.to([self.$refs.lineHorizontalRef, self.$refs.lineVerticalRef], { opacity: 0 });
            } else {
              // 备用方案：如果 GSAP 不可用，直接设置样式
              if (self.$refs.lineHorizontalRef) self.$refs.lineHorizontalRef.style.opacity = 0;
              if (self.$refs.lineVerticalRef) self.$refs.lineVerticalRef.style.opacity = 0;
            }
          } else {
            if (window.gsap) {
              window.gsap.to([self.$refs.lineHorizontalRef, self.$refs.lineVerticalRef], { opacity: 1 });
            } else {
              // 备用方案：如果 GSAP 不可用，直接设置样式
              if (self.$refs.lineHorizontalRef) self.$refs.lineHorizontalRef.style.opacity = 1;
              if (self.$refs.lineVerticalRef) self.$refs.lineVerticalRef.style.opacity = 1;
            }
          }
        }
      };

      (this.containerRef || window).addEventListener('mousemove', handleMouseMove);

      if (window.gsap) {
        window.gsap.set([this.$refs.lineHorizontalRef, this.$refs.lineVerticalRef], { opacity: 0 });
      } else {
        // 备用方案
        if (this.$refs.lineHorizontalRef) this.$refs.lineHorizontalRef.style.opacity = 0;
        if (this.$refs.lineVerticalRef) this.$refs.lineVerticalRef.style.opacity = 0;
      }

      const onMouseMove = function(ev) {
        const mouseEvent = ev;
        self.mouse = self.getMousePos(mouseEvent, self.containerRef);

        self.renderedStyles.tx.previous = self.renderedStyles.tx.current = self.mouse.x;
        self.renderedStyles.ty.previous = self.renderedStyles.ty.current = self.mouse.y;

        if (window.gsap) {
          window.gsap.to([self.$refs.lineHorizontalRef, self.$refs.lineVerticalRef], {
            duration: 0.9,
            ease: 'Power3.easeOut',
            opacity: 1
          });
        }

        if (self.animationId === null) {
          self.animationId = requestAnimationFrame(self.render);
        }

        // 只在第一次移动时移除初始的mousemove监听器
        self.target.removeEventListener('mousemove', handleMouseMove);
      };

      (this.containerRef || window).addEventListener('mousemove', onMouseMove);

      let tl;
      if (window.gsap) {
        tl = window.gsap
          .timeline({
            paused: true,
            onStart: function() {
              if (self.$refs.lineHorizontalRef && self.$refs.lineVerticalRef) {
                self.$refs.lineHorizontalRef.style.filter = 'url(#filter-noise-x)';
                self.$refs.lineVerticalRef.style.filter = 'url(#filter-noise-y)';
              }
            },
            onUpdate: function() {
              // 更新 SVG 滤镜值
              const filterX = document.querySelector('#filter-noise-x feTurbulence');
              const filterY = document.querySelector('#filter-noise-y feTurbulence');
              if (filterX) filterX.setAttribute('baseFrequency', self.primitiveValues.turbulence.toString());
              if (filterY) filterY.setAttribute('baseFrequency', self.primitiveValues.turbulence.toString());
            },
            onComplete: function() {
              if (self.$refs.lineHorizontalRef && self.$refs.lineVerticalRef) {
                self.$refs.lineHorizontalRef.style.filter = 'none';
                self.$refs.lineVerticalRef.style.filter = 'none';
              }
            }
          })
          .to(self.primitiveValues, {
            duration: 0.5,
            ease: 'power1',
            startAt: { turbulence: 1 },
            turbulence: 0
          });
      }

      const enter = function() {
        if (tl) tl.restart();
      };
      const leave = function() {
        if (tl) tl.progress(1).kill();
      };

      this.render = function() {
        self.renderedStyles.tx.current = self.mouse.x;
        self.renderedStyles.ty.current = self.mouse.y;

        for (const key in self.renderedStyles) {
          self.renderedStyles[key].previous = self.lerp(
            self.renderedStyles[key].previous,
            self.renderedStyles[key].current,
            self.renderedStyles[key].amt
          );
        }

        if (window.gsap) {
          if (self.$refs.lineVerticalRef) window.gsap.set(self.$refs.lineVerticalRef, { x: self.renderedStyles.tx.previous });
          if (self.$refs.lineHorizontalRef) window.gsap.set(self.$refs.lineHorizontalRef, { y: self.renderedStyles.ty.previous });
        } else {
          // 备用方案：直接设置样式
          if (self.$refs.lineVerticalRef) self.$refs.lineVerticalRef.style.transform = `translateX(${self.renderedStyles.tx.previous}px)`;
          if (self.$refs.lineHorizontalRef) self.$refs.lineHorizontalRef.style.transform = `translateY(${self.renderedStyles.ty.previous}px)`;
        }

        self.animationId = requestAnimationFrame(self.render);
      };

      // 获取链接并添加事件监听器
      const links = this.containerRef ? 
        this.containerRef.querySelectorAll('a') : 
        document.querySelectorAll('a');
      
      links.forEach(function(link) {
        link.addEventListener('mouseenter', enter);
        link.addEventListener('mouseleave', leave);
      });

      this.cleanup = function() {
        const targetElement = self.containerRef || window;
        targetElement.removeEventListener('mousemove', handleMouseMove);
        targetElement.removeEventListener('mousemove', onMouseMove);

        if (self.animationId !== null) {
          cancelAnimationFrame(self.animationId);
          self.animationId = null;
        }

        links.forEach(function(link) {
          link.removeEventListener('mouseenter', enter);
          link.removeEventListener('mouseleave', leave);
        });
      };
    }
  }
};
</script>