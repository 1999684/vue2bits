<script>
function hexToRgba(hex, alpha) {
  if (alpha === undefined) alpha = 1;
  if (!hex) return `rgba(0,0,0,${alpha})`;
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map(function (c) {
        return c + c;
      })
      .join("");
  }
  const int = parseInt(h, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default {
  name: "ElectricBorder",
  props: {
    color: {
      type: String,
      default: "#28FF85",
    },
    speed: {
      type: Number,
      default: 1,
    },
    chaos: {
      type: Number,
      default: 1,
    },
    thickness: {
      type: Number,
      default: 2,
    },
    className: {
      type: String,
      default: "",
    },
    customStyle: {
      type: Object,
      default: function () {
        return {};
      },
    },
  },
  data: function () {
    return {
      rawId:
        "id-" +
        (Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15)),
      filterId: null,
      ro: null,
    };
  },
  created: function () {
    this.filterId = "turbulent-displace-" + this.rawId;
  },
  computed: {
    inheritRadius: function () {
      const radius = this.customStyle && this.customStyle.borderRadius;

      if (radius === undefined) {
        return { borderRadius: "inherit" };
      }

      if (typeof radius === "number") {
        return { borderRadius: radius + "px" };
      }

      return { borderRadius: radius };
    },
    strokeStyle: function () {
      return {
        ...this.inheritRadius,
        borderWidth: this.thickness + "px",
        borderStyle: "solid",
        borderColor: this.color,
      };
    },
    glow1Style: function () {
      return {
        ...this.inheritRadius,
        borderWidth: this.thickness + "px",
        borderStyle: "solid",
        borderColor: hexToRgba(this.color, 0.6),
        filter: "blur(" + (0.5 + this.thickness * 0.25) + "px)",
        opacity: 0.5,
      };
    },
    glow2Style: function () {
      return {
        ...this.inheritRadius,
        borderWidth: this.thickness + "px",
        borderStyle: "solid",
        borderColor: this.color,
        filter: "blur(" + (2 + this.thickness * 0.5) + "px)",
        opacity: 0.5,
      };
    },
    bgGlowStyle: function () {
      return {
        ...this.inheritRadius,
        transform: "scale(1.08)",
        filter: "blur(32px)",
        opacity: 0.3,
        zIndex: -1,
        background:
          "linear-gradient(-30deg, " +
          hexToRgba(this.color, 0.8) +
          ", transparent, " +
          this.color +
          ")",
      };
    },
  },
  mounted: function () {
    // 在 Vue 2 中不支持 ResizeObserver，使用 window.resize 事件替代
    this.updateAnim();

    // 使用 window.resize 事件来检测尺寸变化
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener("resize", this.handleResize);
  },
  beforeDestroy: function () {
    // 清理事件监听器
    window.removeEventListener("resize", this.handleResize);
    if (this.ro) {
      this.ro.disconnect();
      this.ro = null;
    }
  },
  watch: {
    speed: function () {
      this.updateAnim();
    },
    chaos: function () {
      this.updateAnim();
    },
  },
  methods: {
    handleResize: function () {
      // 延迟更新以避免频繁触发
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      var self = this;
      this.resizeTimeout = setTimeout(function () {
        self.updateAnim();
      }, 100);
    },
    updateAnim: function () {
      var svg = this.$refs.svgRef;
      var host = this.$refs.rootRef;
      if (!svg || !host) return;

      var strokeRef = this.$refs.strokeRef;
      if (strokeRef) {
        strokeRef.style.filter = "url(#" + this.filterId + ")";
      }

      var width = Math.max(
        1,
        Math.round(host.clientWidth || host.getBoundingClientRect().width || 0)
      );
      var height = Math.max(
        1,
        Math.round(
          host.clientHeight || host.getBoundingClientRect().height || 0
        )
      );

      var dyAnims = Array.prototype.slice.call(
        svg.querySelectorAll('feOffset > animate[attributeName="dy"]')
      );
      if (dyAnims.length >= 2) {
        dyAnims[0].setAttribute("values", height + "; 0");
        dyAnims[1].setAttribute("values", "0; -" + height);
      }

      var dxAnims = Array.prototype.slice.call(
        svg.querySelectorAll('feOffset > animate[attributeName="dx"]')
      );
      if (dxAnims.length >= 2) {
        dxAnims[0].setAttribute("values", width + "; 0");
        dxAnims[1].setAttribute("values", "0; -" + width);
      }

      var baseDur = 6;
      var dur = Math.max(0.001, baseDur / (this.speed || 1));
      [...dyAnims, ...dxAnims].forEach(function (a) {
        a.setAttribute("dur", dur + "s");
      });

      var disp = svg.querySelector("feDisplacementMap");
      if (disp) disp.setAttribute("scale", String(30 * (this.chaos || 1)));

      var filterEl = svg.querySelector('[id="' + this.filterId + '"]');
      if (filterEl) {
        filterEl.setAttribute("x", "-200%");
        filterEl.setAttribute("y", "-200%");
        filterEl.setAttribute("width", "500%");
        filterEl.setAttribute("height", "500%");
      }

      var self = this;
      requestAnimationFrame(function () {
        [...dyAnims, ...dxAnims].forEach(function (a) {
          if (typeof a.beginElement === "function") {
            try {
              a.beginElement();
            } catch (e) {}
          }
        });
      });
    },
  },
};
</script>

<template>
  <div
    ref="rootRef"
    :class="['electric-border', className]"
    :style="customStyle"
  >
    <svg
      ref="svgRef"
      class="electric-border-svg"
      style="position: absolute; top: -9999px; left: -9999px"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter
          :id="filterId"
          color-interpolation-filters="sRGB"
          x="-200%"
          y="-200%"
          width="500%"
          height="500%"
        >
          <feTurbulence
            type="turbulence"
            baseFrequency="0.015"
            numOctaves="8"
            result="noise1"
            seed="1"
          />
          <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
            <animate
              attributeName="dy"
              values="500; 0"
              dur="6s"
              repeatCount="indefinite"
              calcMode="linear"
            />
          </feOffset>

          <feTurbulence
            type="turbulence"
            baseFrequency="0.015"
            numOctaves="8"
            result="noise2"
            seed="3"
          />
          <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
            <animate
              attributeName="dy"
              values="0; -500"
              dur="6s"
              repeatCount="indefinite"
              calcMode="linear"
            />
          </feOffset>

          <feTurbulence
            type="turbulence"
            baseFrequency="0.02"
            numOctaves="6"
            result="noise3"
            seed="5"
          />
          <feOffset in="noise3" dx="0" dy="0" result="offsetNoise3">
            <animate
              attributeName="dx"
              values="500; 0"
              dur="6s"
              repeatCount="indefinite"
              calcMode="linear"
            />
          </feOffset>

          <feTurbulence
            type="turbulence"
            baseFrequency="0.02"
            numOctaves="6"
            result="noise4"
            seed="7"
          />
          <feOffset in="noise4" dx="0" dy="0" result="offsetNoise4">
            <animate
              attributeName="dx"
              values="0; -500"
              dur="6s"
              repeatCount="indefinite"
              calcMode="linear"
            />
          </feOffset>

          <feComposite
            in="offsetNoise1"
            in2="offsetNoise2"
            operator="arithmetic"
            k2="1"
            k3="1"
            result="verticalNoise"
          />
          <feComposite
            in="offsetNoise3"
            in2="offsetNoise4"
            operator="arithmetic"
            k2="1"
            k3="1"
            result="horizontalNoise"
          />
          <feBlend
            in="verticalNoise"
            in2="horizontalNoise"
            mode="screen"
            result="combinedNoise"
          />

          <feDisplacementMap
            in="SourceGraphic"
            in2="combinedNoise"
            scale="30"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
        </filter>
      </defs>
    </svg>

    <div class="electric-border-glow" :style="inheritRadius">
      <div
        ref="strokeRef"
        class="electric-border-glow-div"
        :style="strokeStyle"
      />
      <div class="electric-border-glow-div" :style="glow1Style" />
      <div class="electric-border-glow-div" :style="glow2Style" />
      <div class="electric-border-glow-div2" :style="bgGlowStyle" />
    </div>

    <div class="electric-border-content" :style="inheritRadius">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.electric-border {
  position: relative;
  isolation: isolate;
}
.electric-border-svg {
  position: fixed;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}
.electric-border-content {
  position: relative;
}
.electric-border-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.electric-border-glow-div {
  box-sizing: border-box;
  position: absolute;
  inset: 0;
}
.electric-border-glow-div2 {
  position: absolute;
  inset: 0;
}
</style>
