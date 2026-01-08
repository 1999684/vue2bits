<template>
  <span
    ref="rootRef"
    :class="[className]"
    :style="{
      display: 'inline',
      ...customStyle
    }"
    @click="handleClick"
  >
    <span
      v-for="(word, wordIndex) in words"
      :key="wordIndex"
      :style="{ display: 'inline-block', whiteSpace: 'nowrap' }"
    >
      <span
        v-for="(letter, letterIndex) in word.split('')"
        :key="getLetterKey(wordIndex, letterIndex)"
        :style="{
          display: 'inline-block',
          fontVariationSettings: fromFontVariationSettings,
          color: color,
        }"
        class="letter"
        :data-index="getGlobalLetterIndex(wordIndex, letterIndex)"
        aria-hidden="true"
      >
        {{ letter }}
      </span>
      <span v-if="wordIndex < words.length - 1" class="inline-block" style="display: inline-block;">&nbsp;</span>
    </span>
    <span style="
      position: absolute;
      border: 0;
      height: 1px;
      width: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      white-space: nowrap;
      clip: rect(0, 0, 0, 0);
    ">
      <!-- {{ label }} -->
    </span>
  </span>
</template>

<script>
export default {
  name: 'VariableProximity',
  props: {
    color: {
      type: String,
      default: 'black'
    },
    label: {
      type: String,
      required: true
    },
    fromFontVariationSettings: {
      type: String,
      required: true
    },
    toFontVariationSettings: {
      type: String,
      required: true
    },
    containerRef: {
      type: Object,
      default: null
    },
    radius: {
      type: Number,
      default: 50
    },
    falloff: {
      type: String,
      default: 'linear', // linear, exponential, gaussian
      validator: function (value) {
        return ['linear', 'exponential', 'gaussian'].indexOf(value) !== -1;
      }
    },
    className: {
      type: String,
      default: ''
    },
    customStyle: {
      type: Object,
      default: function() {
        return {};
      }
    },
    onClick: {
      type: Function,
      default: null
    }
  },
  data() {
    return {
      letterElements: [],
      mousePosition: { x: 0, y: 0 },
      lastPosition: { x: null, y: null },
      interpolatedSettings: [],
      animationFrameId: null
    };
  },
  computed: {
    words: function() {
      // 检查是否包含空格，如果没有则按字符分割
      if (this.label.includes(' ')) {
        return this.label.split(' ');
      } else {
        // 对于没有空格的文本（如中文），直接按字符分割
        return [this.label];
      }
    },
    parsedSettings: function() {
      const parseSettings = (settingsStr) => {
        const result = {};
        settingsStr.split(',').forEach(s => {
          const parts = s.trim().split(' ');
          if (parts.length === 2) {
            const name = parts[0].replace(/['"]/g, '');
            const value = parseFloat(parts[1]);
            result[name] = value;
          }
        });
        return result;
      };

      const fromSettings = parseSettings(this.fromFontVariationSettings);
      const toSettings = parseSettings(this.toFontVariationSettings);

      const fromEntries = Object.keys(fromSettings).map(key => [key, fromSettings[key]]);
      return fromEntries.map(([axis, fromValue]) => ({
        axis: axis,
        fromValue: fromValue,
        toValue: toSettings[axis] !== undefined ? toSettings[axis] : fromValue
      }));
    }
  },
  methods: {
    calculateDistance: function(x1, y1, x2, y2) {
      return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },
    
    calculateFalloff: function(distance) {
      const norm = Math.min(Math.max(1 - distance / this.radius, 0), 1);
      switch (this.falloff) {
        case 'exponential':
          return Math.pow(norm, 2);
        case 'gaussian':
          return Math.exp(-Math.pow(distance / (this.radius / 2), 2) / 2);
        case 'linear':
        default:
          return norm;
      }
    },
    
    getLetterKey: function(wordIndex, letterIndex) {
      return wordIndex + '-' + letterIndex;
    },
    
    getGlobalLetterIndex: function(wordIndex, letterIndex) {
      let globalIndex = 0;
      for (let i = 0; i < wordIndex; i++) {
        globalIndex += this.words[i].length;
      }
      return globalIndex + letterIndex;
    },
    
    initializeLetterElements: function() {
      if (!this.$refs.rootRef) return;

      this.letterElements = Array.prototype.slice.call(this.$refs.rootRef.querySelectorAll('.letter'));
      console.log('Found ' + this.letterElements.length + ' letter elements');
    },
    
    handleMouseMove: function(ev) {
      const container = this.containerRef || this.$refs.rootRef;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      this.mousePosition = {
        x: ev.clientX - rect.left,
        y: ev.clientY - rect.top
      };
    },
    
    handleTouchMove: function(ev) {
      const container = this.containerRef || this.$refs.rootRef;
      if (!container) return;

      const touch = ev.touches[0];
      const rect = container.getBoundingClientRect();
      this.mousePosition = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    },
    
    animationLoop: function() {
      const container = this.containerRef || this.$refs.rootRef;
      if (!container || this.letterElements.length === 0) {
        this.animationFrameId = requestAnimationFrame(this.animationLoop);
        return;
      }

      const containerRect = container.getBoundingClientRect();

      if (this.lastPosition.x === this.mousePosition.x && this.lastPosition.y === this.mousePosition.y) {
        this.animationFrameId = requestAnimationFrame(this.animationLoop);
        return;
      }

      this.lastPosition = { x: this.mousePosition.x, y: this.mousePosition.y };

      const newSettings = Array(this.letterElements.length).fill(this.fromFontVariationSettings);

      this.letterElements.forEach((letterEl, index) => {
        if (!letterEl) return;

        const rect = letterEl.getBoundingClientRect();
        const letterCenterX = rect.left + rect.width / 2 - containerRect.left;
        const letterCenterY = rect.top + rect.height / 2 - containerRect.top;

        const distance = this.calculateDistance(this.mousePosition.x, this.mousePosition.y, letterCenterX, letterCenterY);

        if (distance >= this.radius) {
          return;
        }

        const falloffValue = this.calculateFalloff(distance);
        const setting = this.parsedSettings
          .map(({ axis, fromValue, toValue }) => {
            const interpolatedValue = fromValue + (toValue - fromValue) * falloffValue;
            return "'" + axis + "' " + interpolatedValue;
          })
          .join(', ');

        newSettings[index] = setting;
      });

      this.interpolatedSettings = newSettings;

      this.letterElements.forEach((letterEl, index) => {
        if (letterEl) {
          letterEl.style.fontVariationSettings = this.interpolatedSettings[index];
        }
      });

      this.animationFrameId = requestAnimationFrame(this.animationLoop);
    },
    
    handleClick: function() {
      if (this.onClick) {
        this.onClick();
      }
    }
  },
  mounted: function() {
    var self = this; // 保存 this 引用
    this.$nextTick(function() {
      // 延迟一点时间确保 DOM 完全渲染
      setTimeout(function() {
        self.initializeLetterElements();

        window.addEventListener('mousemove', self.handleMouseMove);
        window.addEventListener('touchmove', self.handleTouchMove);

        self.animationFrameId = requestAnimationFrame(function() { self.animationLoop(); });
      }, 100);
    });
  },
  beforeDestroy: function() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('touchmove', this.handleTouchMove);

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
};
</script>