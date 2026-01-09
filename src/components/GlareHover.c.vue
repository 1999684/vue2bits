<template>
  <div
    :class="`glare-hover ${className}`"
    :style="{
      width: width,
      height: height,
      background: background,
      borderRadius: borderRadius,
      borderColor: borderColor,
      ...customStyle
    }"
    @mouseenter="animateIn"
    @mouseleave="animateOut"
  >
    <div ref="overlayRef" :style="overlayStyle" />

    <slot />
  </div>
</template>

<script>
function hexToRgba(hex, opacity) {
  const cleanHex = hex.replace('#', '');
  let result = hex;

  if (/^[\\dA-Fa-f]{6}$/.test(cleanHex)) {
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    result = `rgba(${r}, ${g}, ${b}, ${opacity})`;
  } else if (/^[\\dA-Fa-f]{3}$/.test(cleanHex)) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    result = `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return result;
}

export default {
  name: 'GlareHover',
  props: {
    width: {
      type: String,
      default: '500px'
    },
    height: {
      type: String,
      default: '500px'
    },
    background: {
      type: String,
      default: '#000'
    },
    borderRadius: {
      type: String,
      default: '10px'
    },
    borderColor: {
      type: String,
      default: '#333'
    },
    glareColor: {
      type: String,
      default: '#ffffff'
    },
    glareOpacity: {
      type: Number,
      default: 0.5
    },
    glareAngle: {
      type: Number,
      default: -45
    },
    glareSize: {
      type: Number,
      default: 250
    },
    transitionDuration: {
      type: Number,
      default: 650
    },
    playOnce: {
      type: Boolean,
      default: false
    },
    className: {
      type: String,
      default: ''
    },
    customStyle: {
      type: Object,
      default: function() { return {}; }
    }
  },
  computed: {
    rgba: function() {
      const hex = this.glareColor.replace('#', '');
      let result = this.glareColor;

      if (/^[\\dA-Fa-f]{6}$/.test(hex)) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        result = `rgba(${r}, ${g}, ${b}, ${this.glareOpacity})`;
      } else if (/^[\\dA-Fa-f]{3}$/.test(hex)) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        result = `rgba(${r}, ${g}, ${b}, ${this.glareOpacity})`;
      }

      return result;
    },
    overlayStyle: function() {
      return {
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        background: 'linear-gradient(' + this.glareAngle + 'deg,\n      hsla(0,0%,0%,0) 60%,\n      ' + this.rgba + ' 70%,\n      hsla(0,0%,0%,0) 100%)',
        backgroundSize: this.glareSize + '% ' + this.glareSize + '%, 100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '-100% -100%, 0 0',
        pointerEvents: 'none'
      };
    }
  },
  methods: {
    animateIn: function() {
      const el = this.$refs.overlayRef;
      if (!el) return;

      el.style.transition = 'none';
      el.style.backgroundPosition = '-100% -100%, 0 0';
      void el.offsetHeight;
      el.style.transition = this.transitionDuration + 'ms ease';
      el.style.backgroundPosition = '100% 100%, 0 0';
    },
    animateOut: function() {
      const el = this.$refs.overlayRef;
      if (!el) return;

      if (this.playOnce) {
        el.style.transition = 'none';
        el.style.backgroundPosition = '-100% -100%, 0 0';
      } else {
        el.style.transition = this.transitionDuration + 'ms ease';
        el.style.backgroundPosition = '-100% -100%, 0 0';
      }
    }
  }
};
</script>

<style scoped>
  .glare-hover {
    position: relative;
    display: grid;
    place-items: center;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid;
  }
</style>