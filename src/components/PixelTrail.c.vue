<template>
  <div class="pixel-trail-container">
    <!-- Gooey Filter SVG -->
    <svg v-if="gooeyFilter" class="pixel-trail-container-svg">
      <defs>
        <filter :id="gooeyFilter.id">
          <feGaussianBlur
            in="SourceGraphic"
            :stdDeviation="gooeyFilter.strength"
            result="blur"
          />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>

    <!-- Canvas Container -->
    <div
      ref="containerRef"
      :class="['pixel-trail-container-ref', className]"
      :style="filterStyle"
    />
  </div>
</template>
<script>
export default {
  name: 'PixelTrail',

  props: {
    gridSize: {
      type: Number,
      default: 40
    },
    trailSize: {
      type: Number,
      default: 0.1
    },
    maxAge: {
      type: Number,
      default: 250
    },
    interpolate: {
      type: Number,
      default: 5
    },
    color: {
      type: String,
      default: '#ffffff'
    },
    gooeyFilter: {
      type: Object,
      default: undefined
    },
    className: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      renderer: null,
      scene: null,
      camera: null,
      mesh: null,
      animationFrameId: null,
      lastTime: 0,
      containerWidth: 0,
      containerHeight: 0,
      TEXTURE_SIZE: 512,
      INTENSITY: 0.2,
      MIN_FORCE: 0.3,
      SMOOTHING: 0,
      trailCanvas: null,
      trailCtx: null,
      trailTexture: null,
      trail: [],
      force: 0
    };
  },

  computed: {
    filterStyle() {
      if (!this.gooeyFilter) return undefined;
      return {
        filter: `url(#${this.gooeyFilter.id})`
      };
    },

    vertexShader() {
      return `
        void main() {
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `;
    },

    fragmentShader() {
      return `
        uniform vec2 resolution;
        uniform sampler2D mouseTrail;
        uniform float gridSize;
        uniform vec3 pixelColor;

        vec2 coverUv(vec2 uv) {
          vec2 s = resolution.xy / max(resolution.x, resolution.y);
          vec2 newUv = (uv - 0.5) * s + 0.5;
          return clamp(newUv, 0.0, 1.0);
        }

        void main() {
          vec2 screenUv = gl_FragCoord.xy / resolution;
          vec2 uv = coverUv(screenUv);

          vec2 gridUv = fract(uv * gridSize);
          vec2 gridUvCenter = (floor(uv * gridSize) + 0.5) / gridSize;

          float trail = texture2D(mouseTrail, gridUvCenter).r;

          gl_FragColor = vec4(pixelColor, trail);
        }
      `;
    }
  },

  mounted() {
    this.setupScene();
  },

  beforeDestroy() {
    this.cleanup();
  },

  watch: {
    gridSize() {
      this.handlePropChange();
    },
    trailSize() {
      this.handlePropChange();
    },
    maxAge() {
      this.handlePropChange();
    },
    interpolate() {
      this.handlePropChange();
    },
    color() {
      this.handlePropChange();
    }
  },

  methods: {
    smoothAverage(current, measurement, smoothing = 0.9) {
      return measurement * smoothing + current * (1.0 - smoothing);
    },

    hexToRgb(hex) {
      return new THREE.Color(hex);
    },

    screenToTextureUv(screenX, screenY) {
      const maxDim = Math.max(this.containerWidth, this.containerHeight);
      const sx = this.containerWidth / maxDim;
      const sy = this.containerHeight / maxDim;

      const x = (screenX - 0.5) * sx + 0.5;
      const y = (screenY - 0.5) * sy + 0.5;

      return {
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y))
      };
    },

    initTrailTexture() {
      this.trailCanvas = document.createElement('canvas');
      this.trailCanvas.width = this.trailCanvas.height = this.TEXTURE_SIZE;
      this.trailCtx = this.trailCanvas.getContext('2d');
      this.trailCtx.fillStyle = 'black';
      this.trailCtx.fillRect(0, 0, this.TEXTURE_SIZE, this.TEXTURE_SIZE);

      this.trailTexture = new THREE.CanvasTexture(this.trailCanvas);
      this.trailTexture.minFilter = THREE.NearestFilter;
      this.trailTexture.magFilter = THREE.NearestFilter;
      this.trailTexture.wrapS = THREE.ClampToEdgeWrapping;
      this.trailTexture.wrapT = THREE.ClampToEdgeWrapping;
    },

    clearTrail() {
      if (!this.trailCtx) return;
      this.trailCtx.globalCompositeOperation = 'source-over';
      this.trailCtx.fillStyle = 'black';
      this.trailCtx.fillRect(0, 0, this.TEXTURE_SIZE, this.TEXTURE_SIZE);
    },

    addTouch(point) {
      const last = this.trail[this.trail.length - 1];

      if (last) {
        const dx = last.x - point.x;
        const dy = last.y - point.y;
        const dd = dx * dx + dy * dy;

        const newForce = Math.max(this.MIN_FORCE, Math.min(dd * 10000, 1));
        this.force = this.smoothAverage(newForce, this.force, this.SMOOTHING);

        // 插值
        if (this.interpolate > 0) {
          const lines = Math.ceil(
            dd / Math.pow((this.trailSize * 0.5) / this.interpolate, 2)
          );

          if (lines > 1) {
            for (let i = 1; i < lines; i++) {
              this.trail.push({
                x: last.x - (dx / lines) * i,
                y: last.y - (dy / lines) * i,
                age: 0,
                force: newForce
              });
            }
          }
        }
      }

      this.trail.push({
        x: point.x,
        y: point.y,
        age: 0,
        force: this.force
      });
    },

    drawTouch(point) {
      if (!this.trailCtx) return;

      const pos = {
        x: point.x * this.TEXTURE_SIZE,
        y: (1 - point.y) * this.TEXTURE_SIZE
      };

      // 根据age计算强度
      let intensity = 1;
      if (point.age < this.maxAge * 0.3) {
        intensity = point.age / (this.maxAge * 0.3);
      } else {
        intensity =
          1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7);
      }

      intensity *= point.force;

      // Apply blending
      this.trailCtx.globalCompositeOperation = 'screen';

      const radius = this.TEXTURE_SIZE * this.trailSize * intensity;

      if (radius <= 0) return;

      const grd = this.trailCtx.createRadialGradient(
        pos.x,
        pos.y,
        Math.max(0, radius * 0.25),
        pos.x,
        pos.y,
        Math.max(0, radius)
      );
      grd.addColorStop(0, `rgba(255, 255, 255, ${this.INTENSITY})`);
      grd.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

      this.trailCtx.beginPath();
      this.trailCtx.fillStyle = grd;
      this.trailCtx.arc(pos.x, pos.y, Math.max(0, radius), 0, Math.PI * 2);
      this.trailCtx.fill();
    },

    updateTrailTexture(delta) {
      if (!this.trailCtx || !this.trailTexture) return;

      this.clearTrail();

      // 增加点age并移除旧点
      this.trail = this.trail.filter(point => {
        point.age += delta * 1000;
        return point.age <= this.maxAge;
      });

      // 当为空时重置
      if (!this.trail.length) {
        this.force = 0;
      }

      // 绘制所有点
      this.trail.forEach(point => this.drawTouch(point));

      this.trailTexture.needsUpdate = true;
    },

    setupScene() {
      const container = this.$refs.containerRef;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      this.containerWidth = width;
      this.containerHeight = height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      // 初始化轨迹纹理
      this.initTrailTexture();

      // 主渲染器
      this.renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(dpr);
      container.appendChild(this.renderer.domElement);

      // 主场景
      this.scene = new THREE.Scene();
      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      this.camera.position.z = 1;

      // 主网格，使用像素着色器
      const pixelColor = this.hexToRgb(this.color);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          resolution: {
            value: new THREE.Vector2(width * dpr, height * dpr)
          },
          mouseTrail: { value: this.trailTexture },
          gridSize: { value: this.gridSize },
          pixelColor: {
            value: new THREE.Vector3(pixelColor.r, pixelColor.g, pixelColor.b)
          }
        },
        vertexShader: this.vertexShader,
        fragmentShader: this.fragmentShader,
        transparent: true
      });

      const geometry = new THREE.PlaneGeometry(2, 2);
      this.mesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.mesh);

      // 事件监听器
      container.addEventListener('pointermove', this.handlePointerMove);
      window.addEventListener('resize', this.handleResize);

      // 开始动画
      this.trail = [];
      this.force = 0;
      this.lastTime = performance.now();
      this.animate();
    },

    handlePointerMove(event) {
      const container = this.$refs.containerRef;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const screenX = (event.clientX - rect.left) / rect.width;
      const screenY = 1 - (event.clientY - rect.top) / rect.height;

      // 将屏幕坐标转换为纹理UV空间
      const uv = this.screenToTextureUv(screenX, screenY);

      // 添加触摸点
      this.addTouch(uv);
    },

    handleResize() {
      const container = this.$refs.containerRef;
      if (!container || !this.renderer || !this.mesh) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      this.containerWidth = width;
      this.containerHeight = height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      this.renderer.setSize(width, height);

      const material = this.mesh.material;
      material.uniforms.resolution.value.set(width * dpr, height * dpr);
    },

    animate() {
      if (!this.renderer || !this.scene || !this.camera || !this.mesh) return;

      this.animationFrameId = requestAnimationFrame(() => this.animate());

      // 计算delta时间
      const currentTime = performance.now();
      const delta = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      // 使用delta时间更新轨迹纹理
      this.updateTrailTexture(delta);

      // 渲染
      this.renderer.render(this.scene, this.camera);
    },

    cleanup() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      const container = this.$refs.containerRef;
      if (container) {
        container.removeEventListener('pointermove', this.handlePointerMove);
      }
      window.removeEventListener('resize', this.handleResize);

      // 清空轨迹数据
      this.trail = [];
      this.force = 0;

      if (this.renderer) {
        if (container && container.contains(this.renderer.domElement)) {
          container.removeChild(this.renderer.domElement);
        }
        this.renderer.dispose();
        this.renderer = null;
      }

      if (this.trailTexture) {
        this.trailTexture.dispose();
        this.trailTexture = null;
      }

      if (this.mesh) {
        this.mesh.material.dispose();
        this.mesh.geometry.dispose();
        this.mesh = null;
      }

      this.trailCanvas = null;
      this.trailCtx = null;
      this.scene = null;
      this.camera = null;
    },

    handlePropChange() {
      this.cleanup();
      this.$nextTick(() => {
        this.setupScene();
      });
    }
  }
};
</script>
<style scoped>
    .pixel-trail-container {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .pixel-trail-container-svg {
      position: absolute;
      overflow: hidden;
      z-index: 1;
    }
    .pixel-trail-container-ref {
      position: absolute;
      z-index: 1;
      width: 100%;
      height: 100%;
    }
</style>