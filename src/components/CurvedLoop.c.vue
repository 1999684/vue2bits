<template>
  <div
    :style="containerClass"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="endDrag"
    @pointerleave="endDrag"
  >
    <svg :style="svgStyle" viewBox="0 0 1440 120">
      <text
        ref="measureRef"
        xml:space="preserve"
        style="visibility: hidden; opacity: 0; pointer-events: none"
      >
        {{ processedText }}
      </text>

      <defs>
        <path
          ref="pathRef"
          :id="pathId"
          :d="pathD"
          fill="none"
          stroke="transparent"
        />
      </defs>

      <text v-if="ready" xml:space="preserve" :class="[className]">
        <textPath
          ref="textPathRef"
          :href="'#' + pathId"
          :startOffset="offset + 'px'"
          xml:space="preserve"
        >
          {{ totalText }}
        </textPath>
      </text>
    </svg>
  </div>
</template>

<script>
export default {
  name: "CurvedLoop",
  props: {
    // 跑马灯文字
    marqueeText: {
      type: String,
      default: "",
    },
    // 滚动速度
    speed: {
      type: Number,
      default: 2,
    },
    // 自定义CSS类名
    className: {
      type: String,
      default: "",
    },
    // 曲线弯曲程度
    curveAmount: {
      type: Number,
      default: 400,
    },
    // 滚动方向
    direction: {
      type: String,
      default: "left",
      validator: function (value) {
        return ["left", "right"].indexOf(value) !== -1;
      },
    },
    // 是否可交互
    interactive: {
      type: Boolean,
      default: true,
    },
  },
  data: function () {
    return {
      spacing: 0,
      offset: 0,
      uid: Math.random().toString(36).substr(2, 9),
      drag: false,
      lastX: 0,
      dir: "left",
      vel: 0,
      animationFrame: null,
    };
  },
  computed: {
    // 处理后的文本
    processedText: function () {
      var hasTrailing = /\s|\u00A0$/.test(this.marqueeText);
      return (
        (hasTrailing
          ? this.marqueeText.replace(/\s+$/, "")
          : this.marqueeText) + "\u00A0"
      );
    },
    // 路径ID
    pathId: function () {
      return "curve-" + this.uid;
    },
    // SVG路径数据
    pathD: function () {
      // 修复路径起始和结束点，确保文本能够正确循环
      return "M 0 40 Q 500 " + (20 + this.curveAmount) + " 1440 20";
    },
    // 文本长度
    textLength: function () {
      return this.spacing;
    },
    // 总文本
    totalText: function () {
      if (!this.textLength) return this.processedText;
      var repeatCount = Math.ceil(1800 / this.textLength) + 2;
      var texts = [];
      for (var i = 0; i < repeatCount; i++) {
        texts.push(this.processedText);
      }
      return texts.join("");
    },
    // 是否准备就绪
    ready: function () {
      return this.spacing > 0;
    },
    // 容器样式
    containerStyle: function () {
      return {
        visibility: this.ready ? "visible" : "hidden",
        cursor: this.interactive ? (this.drag ? "grabbing" : "grab") : "auto",
      };
    },
    // 容器类样式
    containerClass: function () {
      return {
        "min-height": "100%",
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        width: "100%",
        ...this.containerStyle,
      };
    },
    // SVG样式
    svgStyle: function () {
      return {
        "user-select": "none",
        width: "100%",
        overflow: "visible",
        display: "block",
        "aspect-ratio": "8/1",
        "font-size": "2rem",
        color: "#333",
        "font-weight": "bold",
        "text-transform": "uppercase",
        "line-height": "1",
      };
    },
  },
  mounted: function () {
    var self = this;
    this.$nextTick(function () {
      self.updateSpacing();
      self.dir = self.direction;
      self.animate();
    });
  },
  beforeDestroy: function () {
    this.stopAnimation();
  },
  watch: {
    marqueeText: function () {
      var self = this;
      this.$nextTick(function () {
        self.updateSpacing();
      });
    },
    className: function () {
      var self = this;
      this.$nextTick(function () {
        self.updateSpacing();
      });
    },
    spacing: function () {
      this.stopAnimation();
      if (this.spacing) {
        this.animate();
      }
    },
    speed: function () {
      this.stopAnimation();
      if (this.spacing) {
        this.animate();
      }
    },
  },
  methods: {
    // 更新间距
    updateSpacing: function () {
      if (this.$refs.measureRef) {
        this.spacing = this.$refs.measureRef.getComputedTextLength();
      }
    },
    // 动画循环
    animate: function () {
      if (!this.spacing || !this.ready) return;

      var self = this;
      var step = function () {
        if (!self.drag && self.$refs.textPathRef) {
          var delta = self.dir === "right" ? self.speed : -self.speed;
          var currentOffset = parseFloat(
            self.$refs.textPathRef.getAttribute("startOffset") || "0"
          );
          var newOffset = currentOffset + delta;

          var wrapPoint = self.spacing;
          if (newOffset <= -wrapPoint) newOffset += wrapPoint;
          if (newOffset >= wrapPoint) newOffset -= wrapPoint;

          self.$refs.textPathRef.setAttribute("startOffset", newOffset + "px");
          self.offset = newOffset;
        }
        self.animationFrame = requestAnimationFrame(step);
      };
      step();
    },
    // 停止动画
    stopAnimation: function () {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
    },
    // 指针按下事件
    onPointerDown: function (e) {
      if (!this.interactive) return;
      this.drag = true;
      this.lastX = e.clientX;
      this.vel = 0;
      if (e.target.setPointerCapture) {
        e.target.setPointerCapture(e.pointerId);
      }
    },
    // 指针移动事件
    onPointerMove: function (e) {
      if (!this.interactive || !this.drag || !this.$refs.textPathRef) return;
      var dx = e.clientX - this.lastX;
      this.lastX = e.clientX;
      this.vel = dx;

      var currentOffset = parseFloat(
        this.$refs.textPathRef.getAttribute("startOffset") || "0"
      );
      var newOffset = currentOffset + dx;

      var wrapPoint = this.spacing;
      if (newOffset <= -wrapPoint) newOffset += wrapPoint;
      if (newOffset >= wrapPoint) newOffset -= wrapPoint;

      this.$refs.textPathRef.setAttribute("startOffset", newOffset + "px");
      this.offset = newOffset;
    },
    // 结束拖拽
    endDrag: function () {
      if (!this.interactive) return;
      this.drag = false;
      this.dir = this.vel > 0 ? "right" : "left";
    },
  },
};
</script>

<style scoped></style>
