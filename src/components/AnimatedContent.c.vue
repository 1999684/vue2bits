<template>
  <div
    ref="containerRef"
    :class="'animated-content' + ' ' + className"
  >
    <slot />
  </div>
</template>

<script>
export default {
  name: 'AnimatedContent',
  props: {
    distance: {
      type: Number,
      default: 100
    },
    direction: {
      type: String,
      default: 'vertical',
      validator: function (value) {
        return ['vertical', 'horizontal'].indexOf(value) !== -1
      }
    },
    reverse: {
      type: Boolean,
      default: false
    },
    duration: {
      type: Number,
      default: 0.8
    },
    ease: {
      type: [String, Function],
      default: 'power3.out'
    },
    initialOpacity: {
      type: Number,
      default: 0
    },
    animateOpacity: {
      type: Boolean,
      default: true
    },
    scale: {
      type: Number,
      default: 1
    },
    threshold: {
      type: Number,
      default: 0.1
    },
    delay: {
      type: Number,
      default: 0
    },
    className: {
      type: String,
      default: ''
    }
  },
  data: function () {
    return {
      scrollTrigger: null
    }
  },
  mounted: function () {
    this.initializeAnimation();
  },
  beforeDestroy: function () {
    this.cleanup();
  },
  watch: {
    distance: function () {
      this.restartAnimation();
    },
    direction: function () {
      this.restartAnimation();
    },
    reverse: function () {
      this.restartAnimation();
    },
    duration: function () {
      this.restartAnimation();
    },
    ease: function () {
      this.restartAnimation();
    },
    initialOpacity: function () {
      this.restartAnimation();
    },
    animateOpacity: function () {
      this.restartAnimation();
    },
    scale: function () {
      this.restartAnimation();
    },
    threshold: function () {
      this.restartAnimation();
    },
    delay: function () {
      this.restartAnimation();
    }
  },
  methods: {
    initializeAnimation: function () {
      var self = this;
      
      if (typeof window === 'undefined' || !this.$refs.containerRef) return;
      
      // 确保 gsap 和 ScrollTrigger 已加载
      if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
        console.error('GSAP or ScrollTrigger is not available. Please include the GSAP library and ScrollTrigger plugin.');
        return;
      }
      
      // 注册 ScrollTrigger 插件
      window.gsap.registerPlugin(window.ScrollTrigger);
      
      this.$nextTick(function () {
        var el = self.$refs.containerRef;
        
        var axis = self.direction === 'horizontal' ? 'x' : 'y';
        var offset = self.reverse ? -self.distance : self.distance;
        var startPct = (1 - self.threshold) * 100;
        
        window.gsap.set(el, {
          [axis]: offset,
          scale: self.scale,
          opacity: self.animateOpacity ? self.initialOpacity : 1
        });
        
        var animation = window.gsap.to(el, {
          [axis]: 0,
          scale: 1,
          opacity: 1,
          duration: self.duration,
          ease: self.ease,
          delay: self.delay,
          onComplete: function () {
            self.$emit('complete');
          },
          scrollTrigger: {
            trigger: el,
            start: 'top ' + startPct + '%',
            toggleActions: 'play none none none',
            once: true,
            onKill: function() {
              self.scrollTrigger = null;
            }
          }
        });
        
        // 保存 ScrollTrigger 引用以便清理
        self.scrollTrigger = animation.scrollTrigger;
      });
    },
    restartAnimation: function () {
      this.cleanup();
      this.initializeAnimation();
    },
    cleanup: function () {
      if (this.scrollTrigger) {
        this.scrollTrigger.kill();
        this.scrollTrigger = null;
      }
      
      if (typeof window.gsap !== 'undefined' && this.$refs.containerRef) {
        window.gsap.killTweensOf(this.$refs.containerRef);
      }
    }
  }
}
</script>

<style scoped>
/* GSAP will handle all transforms and opacity */
</style>