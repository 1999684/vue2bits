<template>
  <div ref="shapeBlurContainer" class="shape-blur-container" />
</template>

<script>
export default {
  name: "ShapeBlur",
  props: {
    className: {
      type: String,
      default: "",
    },
    variation: {
      type: Number,
      default: 0,
    },
    pixelRatioProp: {
      type: Number,
      default: 2,
    },
    shapeSize: {
      type: Number,
      default: 1.2,
    },
    roundness: {
      type: Number,
      default: 0.4,
    },
    borderSize: {
      type: Number,
      default: 0.05,
    },
    circleSize: {
      type: Number,
      default: 0.3,
    },
    circleEdge: {
      type: Number,
      default: 0.5,
    },
  },
  data() {
    return {
      animationFrameId: null,
      time: 0,
      lastTime: 0,
      scene: null,
      camera: null,
      renderer: null,
      material: null,
      quad: null,
      resizeObserver: null,
      vMouse: new THREE.Vector2(),
      vMouseDamp: new THREE.Vector2(),
      vResolution: new THREE.Vector2(),
      w: 1,
      h: 1,
    };
  },
  computed: {
    vertexShader() {
      return `
        varying vec2 v_texcoord;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          v_texcoord = uv;
        }
      `;
    },
    fragmentShader() {
      return `
        varying vec2 v_texcoord;

        uniform vec2 u_mouse;
        uniform vec2 u_resolution;
        uniform float u_pixelRatio;

        uniform float u_shapeSize;
        uniform float u_roundness;
        uniform float u_borderSize;
        uniform float u_circleSize;
        uniform float u_circleEdge;

        #ifndef PI
        #define PI 3.1415926535897932384626433832795
        #endif
        #ifndef TWO_PI
        #define TWO_PI 6.2831853071795864769252867665590
        #endif

        #ifndef VAR
        #define VAR ${this.variation}
        #endif

        #ifndef FNC_COORD
        #define FNC_COORD
        vec2 coord(in vec2 p) {
          p = p / u_resolution.xy;
          if (u_resolution.x > u_resolution.y) {
            p.x *= u_resolution.x / u_resolution.y;
            p.x += (u_resolution.y - u_resolution.x) / u_resolution.y / 2.0;
          } else {
            p.y *= u_resolution.y / u_resolution.x;
            p.y += (u_resolution.x - u_resolution.y) / u_resolution.x / 2.0;
          }
          p -= 0.5;
          p *= vec2(-1.0, 1.0);
          return p;
        }
        #endif

        #define st0 coord(gl_FragCoord.xy)
        #define mx coord(u_mouse * u_pixelRatio)

        float sdRoundRect(vec2 p, vec2 b, float r) {
          vec2 d = abs(p - 0.5) * 4.2 - b + vec2(r);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
        }
        float sdCircle(in vec2 st, in vec2 center) {
          return length(st - center) * 2.0;
        }
        float sdPoly(in vec2 p, in float w, in int sides) {
          float a = atan(p.x, p.y) + PI;
          float r = TWO_PI / float(sides);
          float d = cos(floor(0.5 + a / r) * r - a) * length(max(abs(p) * 1.0, 0.0));
          return d * 2.0 - w;
        }

        float aastep(float threshold, float value) {
          float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
          return smoothstep(threshold - afwidth, threshold + afwidth, value);
        }
        float fill(in float x) { return 1.0 - aastep(0.0, x); }
        float fill(float x, float size, float edge) {
          return 1.0 - smoothstep(size - edge, size + edge, x);
        }
        float stroke(in float d, in float t) { return (1.0 - aastep(t, abs(d))); }
        float stroke(float x, float size, float w, float edge) {
          float d = smoothstep(size - edge, size + edge, x + w * 0.5) - smoothstep(size - edge, size + edge, x - w * 0.5);
          return clamp(d, 0.0, 1.0);
        }

        float strokeAA(float x, float size, float w, float edge) {
          float afwidth = length(vec2(dFdx(x), dFdy(x))) * 0.70710678;
          float d = smoothstep(size - edge - afwidth, size + edge + afwidth, x + w * 0.5)
                  - smoothstep(size - edge - afwidth, size + edge + afwidth, x - w * 0.5);
          return clamp(d, 0.0, 1.0);
        }

        void main() {
          vec2 st = st0 + 0.5;
          vec2 posMouse = mx * vec2(1., -1.) + 0.5;

          float size = u_shapeSize;
          float roundness = u_roundness;
          float borderSize = u_borderSize;
          float circleSize = u_circleSize;
          float circleEdge = u_circleEdge;

          float sdfCircle = fill(
            sdCircle(st, posMouse),
            circleSize,
            circleEdge
          );

          float sdf;
          if (VAR == 0) {
            sdf = sdRoundRect(st, vec2(size), roundness);
            sdf = strokeAA(sdf, 0.0, borderSize, sdfCircle) * 4.0;
          } else if (VAR == 1) {
            sdf = sdCircle(st, vec2(0.5));
            sdf = fill(sdf, 0.6, sdfCircle) * 1.2;
          } else if (VAR == 2) {
            sdf = sdCircle(st, vec2(0.5));
            sdf = strokeAA(sdf, 0.58, 0.02, sdfCircle) * 4.0;
          } else if (VAR == 3) {
            sdf = sdPoly(st - vec2(0.5, 0.45), 0.3, 3);
            sdf = fill(sdf, 0.05, sdfCircle) * 1.4;
          }

          vec3 color = vec3(1.0);
          float alpha = sdf;
          gl_FragColor = vec4(color.rgb, alpha);
        }
      `;
    },
  },
  watch: {
    variation() {
      this.updateMaterial();
    },
    pixelRatioProp() {
      this.updateMaterial();
    },
    shapeSize() {
      this.updateMaterial();
    },
    roundness() {
      this.updateMaterial();
    },
    borderSize() {
      this.updateMaterial();
    },
    circleSize() {
      this.updateMaterial();
    },
    circleEdge() {
      this.updateMaterial();
    },
  },
  mounted() {
    this.initShapeBlur();
  },
  beforeDestroy() {
    this.cleanup();
  },
  methods: {
    onPointerMove(e) {
      const mount = this.$refs.shapeBlurContainer;
      if (!mount) return;
      const rect = mount.getBoundingClientRect();
      this.vMouse.set(e.clientX - rect.left, e.clientY - rect.top);
    },
    resize() {
      const container = this.$refs.shapeBlurContainer;
      if (!container || !this.renderer) return;

      this.w = container.clientWidth;
      this.h = container.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      this.renderer.setSize(this.w, this.h, false);
      this.renderer.setPixelRatio(dpr);

      this.camera.left = -this.w / 2;
      this.camera.right = this.w / 2;
      this.camera.top = this.h / 2;
      this.camera.bottom = -this.h / 2;
      this.camera.updateProjectionMatrix();

      this.quad.scale.set(this.w, this.h, 1);
      this.vResolution.set(this.w, this.h).multiplyScalar(dpr);
      this.material.uniforms.u_pixelRatio.value = dpr;
    },
    update() {
      this.time = performance.now() * 0.001;
      const dt = this.time - this.lastTime;
      this.lastTime = this.time;

      this.vMouseDamp.x = THREE.MathUtils.damp(
        this.vMouseDamp.x,
        this.vMouse.x,
        8,
        dt
      );
      this.vMouseDamp.y = THREE.MathUtils.damp(
        this.vMouseDamp.y,
        this.vMouse.y,
        8,
        dt
      );
      this.renderer.render(this.scene, this.camera);
      this.animationFrameId = requestAnimationFrame(() => this.update());
    },
    initShapeBlur() {
      const mount = this.$refs.shapeBlurContainer;
      if (!mount) return;
      this.scene = new THREE.Scene();
      this.camera = new THREE.OrthographicCamera();
      this.camera.position.z = 1;
      this.renderer = new THREE.WebGLRenderer({ alpha: true });
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.domElement.style.width = "100%";
      this.renderer.domElement.style.height = "100%";
      this.renderer.domElement.style.display = "block";
      mount.appendChild(this.renderer.domElement);
      const geo = new THREE.PlaneGeometry(1, 1);
      this.material = new THREE.ShaderMaterial({
        vertexShader: this.vertexShader,
        fragmentShader: this.fragmentShader,
        uniforms: {
          u_mouse: { value: this.vMouseDamp },
          u_resolution: { value: this.vResolution },
          u_pixelRatio: { value: this.pixelRatioProp },
          u_shapeSize: { value: this.shapeSize },
          u_roundness: { value: this.roundness },
          u_borderSize: { value: this.borderSize },
          u_circleSize: { value: this.circleSize },
          u_circleEdge: { value: this.circleEdge },
        },
        defines: { VAR: this.variation },
        transparent: true,
      });
      this.quad = new THREE.Mesh(geo, this.material);
      this.scene.add(this.quad);
      document.addEventListener("mousemove", this.onPointerMove.bind(this));
      document.addEventListener("pointermove", this.onPointerMove.bind(this));
      this.resize();
      if (typeof ResizeObserver !== "undefined") {
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(mount);
      } else {
        window.addEventListener("resize", () => this.resize());
      }
      this.update();
    },
    updateMaterial() {
      if (!this.material) return;
      this.material.uniforms.u_pixelRatio.value = this.pixelRatioProp;
      this.material.uniforms.u_shapeSize.value = this.shapeSize;
      this.material.uniforms.u_roundness.value = this.roundness;
      this.material.uniforms.u_borderSize.value = this.borderSize;
      this.material.uniforms.u_circleSize.value = this.circleSize;
      this.material.uniforms.u_circleEdge.value = this.circleEdge;
      this.material.defines.VAR = this.variation;
      this.material.needsUpdate = true;
    },
    cleanup() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", () => this.resize());
      }
      document.removeEventListener("mousemove", this.onPointerMove.bind(this));
      document.removeEventListener(
        "pointermove",
        this.onPointerMove.bind(this)
      );
      const mount = this.$refs.shapeBlurContainer;
      if (mount && this.renderer) {
        if (mount.contains(this.renderer.domElement)) {
          mount.removeChild(this.renderer.domElement);
        }
        this.renderer.dispose();
      }
    },
  },
};
</script>

<style scoped>
.shape-blur-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.shape-blur-container ::v-deep canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
</style>
