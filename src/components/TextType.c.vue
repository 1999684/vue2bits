<template>
  <component
    :is="as"
    ref="containerRef"
    :class="containerClass"
    v-bind="$attrs"
  >
    <span class="inline" :style="{ color: getCurrentTextColor() }">
      {{ displayedText }}
    </span>
    <span
      v-if="showCursor"
      ref="cursorRef"
      :class="cursorClass"
    >
      {{ cursorCharacter }}
    </span>
  </component>
</template>

<script>
import { gsap } from 'gsap';

export default {
  name: 'TextType',
  props: {
    className: {
      type: String,
      default: '',
    },
    showCursor: {
      type: Boolean,
      default: true,
    },
    hideCursorWhileTyping: {
      type: Boolean,
      default: false,
    },
    cursorCharacter: {
      type: String,
      default: '|',
    },
    cursorBlinkDuration: {
      type: Number,
      default: 0.5,
    },
    cursorClassName: {
      type: String,
      default: '',
    },
    text: {
      type: [String, Array],
      required: true,
    },
    as: {
      type: String,
      default: 'div',
    },
    typingSpeed: {
      type: Number,
      default: 50,
    },
    initialDelay: {
      type: Number,
      default: 0,
    },
    pauseDuration: {
      type: Number,
      default: 2000,
    },
    deletingSpeed: {
      type: Number,
      default: 30,
    },
    loop: {
      type: Boolean,
      default: true,
    },
    textColors: {
      type: Array,
      default: () => [],
    },
    variableSpeed: {
      type: Object,
      default: null,
    },
    onSentenceComplete: {
      type: Function,
      default: null,
    },
    startOnVisible: {
      type: Boolean,
      default: false,
    },
    reverseMode: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      displayedText: '',
      currentCharIndex: 0,
      isDeleting: false,
      currentTextIndex: 0,
      isVisible: null,
      timeout: null,
      visibilityObserver: null,
    };
  },
  computed: {
    textArray() {
      return Array.isArray(this.text) ? this.text : [this.text];
    },
    containerClass() {
      return `inline-block whitespace-pre-wrap tracking-tight ${this.className || ''}`;
    },
    cursorClass() {
      const shouldHide = this.hideCursorWhileTyping && 
        (this.currentCharIndex < (this.textArray[this.currentTextIndex] ? this.textArray[this.currentTextIndex].length : 0) || this.isDeleting);
      return [
        'ml-1 inline-block opacity-100',
        { 'hidden': shouldHide },
        this.cursorClassName
      ];
    },
  },
  methods: {
    getRandomSpeed() {
      if (!this.variableSpeed) return this.typingSpeed;
      const { min, max } = this.variableSpeed;
      return Math.random() * (max - min) + min;
    },
    getCurrentTextColor() {
      if (!this.textColors.length) return '#ffffff';
      return this.textColors[this.currentTextIndex % this.textColors.length];
    },
    clearTimeoutIfNeeded() {
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
    },
    executeTypingAnimation() {
      const currentText = this.textArray[this.currentTextIndex];
      const processedText = this.reverseMode ? currentText.split('').reverse().join('') : currentText;

      if (this.isDeleting) {
        if (this.displayedText === '') {
          this.isDeleting = false;
          if (this.currentTextIndex === this.textArray.length - 1 && !this.loop) return;

          if (this.onSentenceComplete) {
            this.onSentenceComplete(this.textArray[this.currentTextIndex], this.currentTextIndex);
          }

          this.currentTextIndex = (this.currentTextIndex + 1) % this.textArray.length;
          this.currentCharIndex = 0;
          this.timeout = setTimeout(() => {
            this.startTypingAnimation();
          }, this.pauseDuration);
        } else {
          this.timeout = setTimeout(() => {
            this.displayedText = this.displayedText.slice(0, -1);
          }, this.deletingSpeed);
        }
      } else {
        if (this.currentCharIndex < processedText.length) {
          this.timeout = setTimeout(
            () => {
              this.displayedText += processedText[this.currentCharIndex];
              this.currentCharIndex += 1;
            },
            this.variableSpeed ? this.getRandomSpeed() : this.typingSpeed
          );
        } else if (this.textArray.length > 1) {
          this.timeout = setTimeout(() => {
            this.isDeleting = true;
          }, this.pauseDuration);
        }
      }
    },
    startTypingAnimation() {
      if (!this.isVisible) return;
      this.clearTimeoutIfNeeded();

      if (this.currentCharIndex === 0 && !this.isDeleting && this.displayedText === '') {
        this.timeout = setTimeout(() => {
          this.executeTypingAnimation();
        }, this.initialDelay);
      } else {
        this.executeTypingAnimation();
      }
    },
    initCursorAnimation() {
      const cursorRef = this.$refs.cursorRef;
      if (this.showCursor && cursorRef) {
        gsap.set(cursorRef, { opacity: 1 });
        gsap.to(cursorRef, {
          opacity: 0,
          duration: this.cursorBlinkDuration,
          repeat: -1,
          yoyo: true,
          ease: 'power2.inOut'
        });
      }
    },
    initVisibilityObserver() {
      const containerRef = this.$refs.containerRef;
      if (this.startOnVisible && containerRef) {
        const observer = new IntersectionObserver(
          entries => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                this.isVisible = true;
                // 开始动画
                this.startTypingAnimation();
              }
            });
          },
          { threshold: 0.1 }
        );
        observer.observe(containerRef);
        
        // 保存 observer 以便稍后清理
        this.visibilityObserver = observer;
      }
    },
  },
  watch: {
    displayedText() {
      this.startTypingAnimation();
    },
    currentCharIndex() {
      this.startTypingAnimation();
    },
    isDeleting() {
      this.startTypingAnimation();
    },
    isVisible() {
      this.startTypingAnimation();
    },
  },
  mounted() {
    // 初始化可见性状态
    this.isVisible = !this.startOnVisible;
    
    this.initCursorAnimation();
    this.initVisibilityObserver();
    
    // 初始化时启动动画
    if (this.isVisible) {
      this.startTypingAnimation();
    }
  },
  beforeDestroy() {
    this.clearTimeoutIfNeeded();
    if (this.visibilityObserver) {
      this.visibilityObserver.disconnect();
    }
  },
};
</script>