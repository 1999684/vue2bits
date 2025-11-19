<template>
    <p
      ref="textRef"
      :class="'split-text-normal' + ' ' + className"
      :style="{
        textAlign: textAlign,
        wordWrap: 'break-word'
      }"
    >
      {{ text }}
    </p>
</template>

<script>
export default {
  name: 'SplitText',
  props: {
    text: {
      type: String,
      default: ''
    },
    className: {
      type: String,
      default: ''
    },
    delay: {
      type: Number,
      default: 100
    },
    duration: {
      type: Number,
      default: 0.6
    },
    ease: {
      type: [String, Function],
      default: 'power3.out'
    },
    splitType: {
      type: String,
      default: 'chars',
      validator: function (value) {
        return ['chars', 'words', 'lines', 'words, chars'].indexOf(value) !== -1
      }
    },
    from: {
      type: Object,
      default: function () {
        return { opacity: 0, y: 40 }
      }
    },
    to: {
      type: Object,
      default: function () {
        return { opacity: 1, y: 0 }
      }
    },
    threshold: {
      type: Number,
      default: 0.1
    },
    rootMargin: {
      type: String,
      default: '-100px'
    },
    textAlign: {
      type: String,
      default: 'center',
      validator: function (value) {
        return ['left', 'center', 'right', 'justify'].indexOf(value) !== -1
      }
    },
    onLetterAnimationComplete: {
      type: Function,
      default: null
    }
  },
  data: function () {
    return {
      animationCompleted: false,
      scrollTrigger: null,
      timeline: null,
      splitter: null
    }
  },
  mounted: function () {
    this.initializeAnimation();
  },
  beforeDestroy: function () {
    this.cleanup();
  },
  watch: {
    text: function () {
      this.cleanup();
      this.initializeAnimation();
    },
    delay: function () {
      this.cleanup();
      this.initializeAnimation();
    },
    duration: function () {
      this.cleanup();
      this.initializeAnimation();
    },
    ease: function () {
      this.cleanup();
      this.initializeAnimation();
    },
    splitType: function () {
      this.cleanup();
      this.initializeAnimation();
    },
    from: function () {
      this.cleanup();
      this.initializeAnimation();
    },
    to: function () {
      this.cleanup();
      this.initializeAnimation();
    },
    threshold: function () {
      this.cleanup();
      this.initializeAnimation();
    },
    rootMargin: function () {
      this.cleanup();
      this.initializeAnimation();
    },
    onLetterAnimationComplete: function () {
      this.cleanup();
      this.initializeAnimation();
    }
  },
  methods: {
    initializeAnimation: function () {
      var self = this;

      // 检查是否在浏览器环境中
      if (typeof window === 'undefined' || !this.$refs.textRef || !this.text) return;

      // 使用 nextTick 确保 DOM 更新完成
      this.$nextTick(function () {
        var el = self.$refs.textRef;

        self.animationCompleted = false;

        var absoluteLines = self.splitType === 'lines';
        if (absoluteLines) el.style.position = 'relative';

        // 确保 SplitText 已加载
        if (typeof window.SplitText === 'undefined') {
          console.error('SplitText is not available. Please include the GSAP SplitText plugin.');
          return;
        }

        var splitter;
        try {
          splitter = new window.SplitText(el, {
            type: self.splitType,
            absolute: absoluteLines,
            linesClass: 'split-line'
          });
          self.splitter = splitter;
        } catch (error) {
          console.error('Failed to create SplitText:', error);
          return;
        }

        var targets;
        switch (self.splitType) {
          case 'lines':
            targets = splitter.lines;
            break;
          case 'words':
            targets = splitter.words;
            break;
          case 'chars':
            targets = splitter.chars;
            break;
          default:
            targets = splitter.chars;
        }

        if (!targets || targets.length === 0) {
          console.warn('No targets found for SplitText animation');
          splitter.revert();
          return;
        }

        targets.forEach(function (t) {
          t.style.willChange = 'transform, opacity';
        });

        var startPct = (1 - self.threshold) * 100;
        var marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(self.rootMargin);
        var marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
        var marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
        var sign = marginValue < 0 ? `-=${Math.abs(marginValue)}${marginUnit}` : `+=${marginValue}${marginUnit}`;
        var start = `top ${startPct}%${sign}`;

        // 确保 gsap 已加载
        if (typeof window.gsap === 'undefined') {
          console.error('GSAP is not available. Please include the GSAP library.');
          return;
        }

        var tl = window.gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: start,
            toggleActions: 'play none none none',
            once: true,
            onToggle: function (scrollTrigger) {
              self.scrollTrigger = scrollTrigger;
            }
          },
          smoothChildTiming: true,
          onComplete: function () {
            self.animationCompleted = true;

            // 合并 to 属性和 clearProps
            var toProps = Object.assign({}, self.to, {
              clearProps: 'willChange',
              immediateRender: true
            });

            window.gsap.set(targets, toProps);

            if (self.onLetterAnimationComplete) {
              self.onLetterAnimationComplete();
            }
            self.$emit('animation-complete');
          }
        });

        self.timeline = tl;

        // 合并 from 属性
        var fromProps = Object.assign({}, self.from, {
          immediateRender: false,
          force3D: true
        });

        tl.set(targets, fromProps);

        // 合并 to 属性
        var toProps = Object.assign({}, self.to, {
          duration: self.duration,
          ease: self.ease,
          stagger: self.delay / 1000,
          force3D: true
        });

        tl.to(targets, toProps);
      });
    },
    cleanup: function () {
      if (this.timeline) {
        this.timeline.kill();
        this.timeline = null;
      }
      if (this.scrollTrigger) {
        this.scrollTrigger.kill();
        this.scrollTrigger = null;
      }
      if (this.splitter) {
        if (typeof window.gsap !== 'undefined') {
          window.gsap.killTweensOf(this.$refs.textRef);
        }
        this.splitter.revert();
        this.splitter = null;
      }
    }
  }
}
</script>

<style scoped>
.split-text-normal {
  overflow: hidden;
  display: inline-block;
  white-space: normal;
  display: inline-block;
}
</style>