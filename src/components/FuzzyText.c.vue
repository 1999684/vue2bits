<template>
  <canvas ref="canvasRef" />
</template>

<script>
export default {
  name: "FuzzyText",
  props: {
    // 文本内容
    text: {
      type: String,
      default: "",
    },
    // 字体大小
    fontSize: {
      type: [Number, String],
      default: "clamp(2rem, 8vw, 8rem)",
    },
    // 字体粗细
    fontWeight: {
      type: [String, Number],
      default: 900,
    },
    // 字体族
    fontFamily: {
      type: String,
      default: "inherit",
    },
    // 颜色
    color: {
      type: String,
      default: "#fff",
    },
    // 是否启用悬停效果
    enableHover: {
      type: Boolean,
      default: true,
    },
    // 基础模糊强度
    baseIntensity: {
      type: Number,
      default: 0.18,
    },
    // 悬停时的模糊强度
    hoverIntensity: {
      type: Number,
      default: 0.5,
    },
  },
  data: function () {
    return {
      animationFrameId: null,
      isCancelled: false,
      cleanup: null,
    };
  },
  mounted: function () {
    var self = this;
    this.$nextTick(function () {
      self.initCanvas();
    });
  },
  beforeDestroy: function () {
    this.isCancelled = true;
    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId);
    }
    if (this.cleanup) {
      this.cleanup();
    }
  },
  watch: {
    text: function () {
      this.restartCanvas();
    },
    fontSize: function () {
      this.restartCanvas();
    },
    fontWeight: function () {
      this.restartCanvas();
    },
    fontFamily: function () {
      this.restartCanvas();
    },
    color: function () {
      this.restartCanvas();
    },
    enableHover: function () {
      this.restartCanvas();
    },
    baseIntensity: function () {
      this.restartCanvas();
    },
    hoverIntensity: function () {
      this.restartCanvas();
    },
  },
  methods: {
    waitForFont: function (fontFamily, fontWeight, fontSize) {
      var self = this;
      return new Promise(function (resolve) {
        if (document.fonts && document.fonts.check) {
          var fontString = fontWeight + " " + fontSize + " " + fontFamily;

          if (document.fonts.check(fontString)) {
            resolve(true);
            return;
          }

          document.fonts
            .load(fontString)
            .then(function () {
              resolve(document.fonts.check(fontString));
            })
            .catch(function (error) {
              console.warn("Font loading failed:", error);
              resolve(false);
            });
        } else {
          // Fallback for browsers that don't support document.fonts
          var canvas = document.createElement("canvas");
          var ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(false);
            return;
          }

          ctx.font = fontWeight + " " + fontSize + " " + fontFamily;
          var testWidth = ctx.measureText("M").width;

          var attempts = 0;
          var checkFont = function () {
            ctx.font = fontWeight + " " + fontSize + " " + fontFamily;
            var newWidth = ctx.measureText("M").width;

            if (newWidth !== testWidth && newWidth > 0) {
              resolve(true);
            } else if (attempts < 20) {
              attempts++;
              setTimeout(checkFont, 50);
            } else {
              resolve(false);
            }
          };

          setTimeout(checkFont, 10);
        }
      });
    },
    initCanvas: function () {
      var self = this;

      // Wait for fonts to be ready
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          self.initCanvasInternal();
        });
      } else {
        // Fallback for browsers that don't support document.fonts.ready
        setTimeout(function () {
          self.initCanvasInternal();
        }, 100);
      }
    },
    initCanvasInternal: function () {
      if (this.isCancelled) return;

      var canvas = this.$refs.canvasRef;
      if (!canvas) return;

      var ctx = canvas.getContext("2d");
      if (!ctx) return;

      var computedFontFamily =
        this.fontFamily === "inherit"
          ? window.getComputedStyle(canvas).fontFamily || "sans-serif"
          : this.fontFamily;

      var fontSizeStr =
        typeof this.fontSize === "number"
          ? this.fontSize + "px"
          : this.fontSize;
      var numericFontSize;

      if (typeof this.fontSize === "number") {
        numericFontSize = this.fontSize;
      } else {
        var temp = document.createElement("span");
        temp.style.fontSize = this.fontSize;
        temp.style.fontFamily = computedFontFamily;
        document.body.appendChild(temp);
        var computedSize = window.getComputedStyle(temp).fontSize;
        numericFontSize = parseFloat(computedSize);
        document.body.removeChild(temp);
      }

      var self = this;
      this.waitForFont(computedFontFamily, this.fontWeight, fontSizeStr).then(
        function (fontLoaded) {
          if (!fontLoaded) {
            console.warn("Font not loaded: " + computedFontFamily);
          }

          self.setupCanvas(
            canvas,
            ctx,
            computedFontFamily,
            fontSizeStr,
            numericFontSize
          );
        }
      );
    },
    setupCanvas: function (
      canvas,
      ctx,
      computedFontFamily,
      fontSizeStr,
      numericFontSize
    ) {
      if (this.isCancelled) return;

      var text = this.text;

      var offscreen = document.createElement("canvas");
      var offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      var fontString =
        this.fontWeight + " " + fontSizeStr + " " + computedFontFamily;
      offCtx.font = fontString;

      var testMetrics = offCtx.measureText("M");
      if (testMetrics.width === 0) {
        var self = this;
        setTimeout(function () {
          if (!self.isCancelled) {
            self.initCanvas();
          }
        }, 100);
        return;
      }

      offCtx.textBaseline = "alphabetic";
      var metrics = offCtx.measureText(text);

      var actualLeft = metrics.actualBoundingBoxLeft || 0;
      var actualRight = metrics.actualBoundingBoxRight || metrics.width;
      var actualAscent = metrics.actualBoundingBoxAscent || numericFontSize;
      var actualDescent =
        metrics.actualBoundingBoxDescent || numericFontSize * 0.2;

      var textBoundingWidth = Math.ceil(actualLeft + actualRight);
      var tightHeight = Math.ceil(actualAscent + actualDescent);

      var extraWidthBuffer = 10;
      var offscreenWidth = textBoundingWidth + extraWidthBuffer;

      offscreen.width = offscreenWidth;
      offscreen.height = tightHeight;

      var xOffset = extraWidthBuffer / 2;
      offCtx.font =
        this.fontWeight + " " + fontSizeStr + " " + computedFontFamily;
      offCtx.textBaseline = "alphabetic";
      offCtx.fillStyle = this.color;
      offCtx.fillText(text, xOffset - actualLeft, actualAscent);

      var horizontalMargin = 50;
      var verticalMargin = 0;
      canvas.width = offscreenWidth + horizontalMargin * 2;
      canvas.height = tightHeight + verticalMargin * 2;
      ctx.translate(horizontalMargin, verticalMargin);

      var interactiveLeft = horizontalMargin + xOffset;
      var interactiveTop = verticalMargin;
      var interactiveRight = interactiveLeft + textBoundingWidth;
      var interactiveBottom = interactiveTop + tightHeight;

      var isHovering = false;
      var fuzzRange = 30;

      var self = this;
      var run = function () {
        if (self.isCancelled) return;
        ctx.clearRect(
          -fuzzRange,
          -fuzzRange,
          offscreenWidth + 2 * fuzzRange,
          tightHeight + 2 * fuzzRange
        );
        var intensity = isHovering ? self.hoverIntensity : self.baseIntensity;
        for (var j = 0; j < tightHeight; j++) {
          var dx = Math.floor(intensity * (Math.random() - 0.5) * fuzzRange);
          ctx.drawImage(
            offscreen,
            0,
            j,
            offscreenWidth,
            1,
            dx,
            j,
            offscreenWidth,
            1
          );
        }
        self.animationFrameId = window.requestAnimationFrame(run);
      };

      run();

      var isInsideTextArea = function (x, y) {
        return (
          x >= interactiveLeft &&
          x <= interactiveRight &&
          y >= interactiveTop &&
          y <= interactiveBottom
        );
      };

      var handleMouseMove = function (e) {
        if (!self.enableHover) return;
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        isHovering = isInsideTextArea(x, y);
      };

      var handleMouseLeave = function () {
        isHovering = false;
      };

      var handleTouchMove = function (e) {
        if (!self.enableHover) return;
        e.preventDefault();
        var rect = canvas.getBoundingClientRect();
        var touch = e.touches[0];
        var x = touch.clientX - rect.left;
        var y = touch.clientY - rect.top;
        isHovering = isInsideTextArea(x, y);
      };

      var handleTouchEnd = function () {
        isHovering = false;
      };

      if (this.enableHover) {
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseleave", handleMouseLeave);
        canvas.addEventListener("touchmove", handleTouchMove, {
          passive: false,
        });
        canvas.addEventListener("touchend", handleTouchEnd);
      }

      this.cleanup = function () {
        window.cancelAnimationFrame(self.animationFrameId);
        if (self.enableHover) {
          canvas.removeEventListener("mousemove", handleMouseMove);
          canvas.removeEventListener("mouseleave", handleMouseLeave);
          canvas.removeEventListener("touchmove", handleTouchMove);
          canvas.removeEventListener("touchend", handleTouchEnd);
        }
      };
    },
    restartCanvas: function () {
      this.isCancelled = true;
      if (this.animationFrameId) {
        window.cancelAnimationFrame(this.animationFrameId);
      }
      if (this.cleanup) {
        this.cleanup();
      }
      this.isCancelled = false;
      var self = this;
      this.$nextTick(function () {
        self.initCanvas();
      });
    },
  },
};
</script>
