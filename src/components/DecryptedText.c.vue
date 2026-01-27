<template>
  <span
    ref="containerRef"
    :class="`inline-block whitespace-pre-wrap ${parentClassName}`"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <span class="sr-only">{{ displayText }}</span>

    <span aria-hidden="true">
      <span
        v-for="(char, index) in displayText.split('')"
        :key="index"
        :class="
          revealedIndices.has(index) || !isScrambling || !isHovering
            ? className
            : encryptedClassName
        "
      >
        {{ char }}
      </span>
    </span>
  </span>
</template>

<script>
export default {
  name: "DecryptedText",
  props: {
    // 文本内容
    text: {
      type: String,
      default: "",
    },
    // 动画速度（毫秒）
    speed: {
      type: Number,
      default: 50,
    },
    // 最大迭代次数
    maxIterations: {
      type: Number,
      default: 10,
    },
    // 是否按顺序显示
    sequential: {
      type: Boolean,
      default: false,
    },
    // 显示方向
    revealDirection: {
      type: String,
      default: "start",
      validator: function (value) {
        return ["start", "end", "center"].indexOf(value) !== -1;
      },
    },
    // 是否只使用原文字符
    useOriginalCharsOnly: {
      type: Boolean,
      default: false,
    },
    // 可用字符集
    characters: {
      type: String,
      default:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+",
    },
    // CSS类名
    className: {
      type: String,
      default: "",
    },
    // 加密文本的CSS类名
    encryptedClassName: {
      type: String,
      default: "",
    },
    // 父元素的CSS类名
    parentClassName: {
      type: String,
      default: "",
    },
    // 触发动画的方式
    animateOn: {
      type: String,
      default: "hover",
      validator: function (value) {
        return ["view", "hover"].indexOf(value) !== -1;
      },
    },
  },
  data: function () {
    return {
      displayText: this.text,
      isHovering: false,
      isScrambling: false,
      revealedIndices: new Set(),
      hasAnimated: false,
      interval: null,
      intersectionObserver: null,
      currentIteration: 0,
    };
  },
  mounted: function () {
    if (this.animateOn === "view") {
      var self = this;
      this.$nextTick(function () {
        var observerCallback = function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && !self.hasAnimated) {
              self.isHovering = true;
              self.hasAnimated = true;
            }
          });
        };

        var observerOptions = {
          root: null,
          rootMargin: "0px",
          threshold: 0.1,
        };

        self.intersectionObserver = new IntersectionObserver(
          observerCallback,
          observerOptions
        );
        if (self.$refs.containerRef) {
          self.intersectionObserver.observe(self.$refs.containerRef);
        }
      });
    }
  },
  beforeDestroy: function () {
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.intersectionObserver && this.$refs.containerRef) {
      this.intersectionObserver.unobserve(this.$refs.containerRef);
    }
  },
  watch: {
    isHovering: function () {
      this.updateAnimation();
    },
    text: function () {
      this.displayText = this.text;
      this.revealedIndices = new Set();
      this.isScrambling = false;
      this.updateAnimation();
    },
    speed: function () {
      this.updateAnimation();
    },
    maxIterations: function () {
      this.updateAnimation();
    },
    sequential: function () {
      this.updateAnimation();
    },
    revealDirection: function () {
      this.updateAnimation();
    },
    characters: function () {
      this.updateAnimation();
    },
    useOriginalCharsOnly: function () {
      this.updateAnimation();
    },
  },
  methods: {
    getNextIndex: function (revealedSet) {
      var textLength = this.text.length;
      switch (this.revealDirection) {
        case "start":
          return revealedSet.size;
        case "end":
          return textLength - 1 - revealedSet.size;
        case "center": {
          var middle = Math.floor(textLength / 2);
          var offset = Math.floor(revealedSet.size / 2);
          var nextIndex =
            revealedSet.size % 2 === 0 ? middle + offset : middle - offset - 1;

          if (
            nextIndex >= 0 &&
            nextIndex < textLength &&
            !revealedSet.has(nextIndex)
          ) {
            return nextIndex;
          }
          for (var i = 0; i < textLength; i++) {
            if (!revealedSet.has(i)) return i;
          }
          return 0;
        }
        default:
          return revealedSet.size;
      }
    },
    getAvailableChars: function () {
      if (this.useOriginalCharsOnly) {
        return Array.from(new Set(this.text.split(""))).filter(function (char) {
          return char !== " ";
        });
      } else {
        return this.characters.split("");
      }
    },
    shuffleText: function (originalText, currentRevealed) {
      var self = this;
      var availableChars = this.getAvailableChars();

      if (this.useOriginalCharsOnly) {
        var positions = originalText.split("").map(function (char, i) {
          return {
            char: char,
            isSpace: char === " ",
            index: i,
            isRevealed: currentRevealed.has(i),
          };
        });

        var nonSpaceChars = positions
          .filter(function (p) {
            return !p.isSpace && !p.isRevealed;
          })
          .map(function (p) {
            return p.char;
          });

        for (var i = nonSpaceChars.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var temp = nonSpaceChars[i];
          nonSpaceChars[i] = nonSpaceChars[j];
          nonSpaceChars[j] = temp;
        }

        var charIndex = 0;
        return positions
          .map(function (p) {
            if (p.isSpace) return " ";
            if (p.isRevealed) return originalText[p.index];
            return nonSpaceChars[charIndex++];
          })
          .join("");
      } else {
        return originalText
          .split("")
          .map(function (char, i) {
            if (char === " ") return " ";
            if (currentRevealed.has(i)) return originalText[i];
            return availableChars[
              Math.floor(Math.random() * availableChars.length)
            ];
          })
          .join("");
      }
    },
    updateAnimation: function () {
      var self = this;
      this.currentIteration = 0;

      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }

      if (this.isHovering) {
        this.isScrambling = true;
        this.interval = setInterval(function () {
          if (self.sequential) {
            if (self.revealedIndices.size < self.text.length) {
              var nextIndex = self.getNextIndex(self.revealedIndices);
              var newRevealed = new Set(self.revealedIndices);
              newRevealed.add(nextIndex);
              self.revealedIndices = newRevealed;
              self.displayText = self.shuffleText(self.text, newRevealed);
            } else {
              clearInterval(self.interval);
              self.interval = null;
              self.isScrambling = false;
              self.$emit("animationComplete");
            }
          } else {
            self.displayText = self.shuffleText(
              self.text,
              self.revealedIndices
            );
            self.currentIteration++;
            if (self.currentIteration >= self.maxIterations) {
              clearInterval(self.interval);
              self.interval = null;
              self.isScrambling = false;
              self.displayText = self.text;
              self.$emit("animationComplete");
            }
          }
        }, this.speed);
      } else {
        this.displayText = this.text;
        this.revealedIndices = new Set();
        this.isScrambling = false;
      }
    },
    handleMouseEnter: function () {
      if (this.animateOn === "hover") {
        this.isHovering = true;
      }
    },
    handleMouseLeave: function () {
      if (this.animateOn === "hover") {
        this.isHovering = false;
      }
    },
  },
};
</script>

<style scoped>
.inline-block {
  display: inline-block;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
