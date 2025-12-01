<template>
    <p ref="rootRef" :class="['blur-text', className, 'flex', 'flex-wrap']">
        <span v-for="(segment, index) in elements" :key="animationKey + '-' + index" :style="getElementStyle(index)"
            ref="motionElements">
            {{ segment === ' ' ? '\u00A0' : segment }}{{ animateBy === 'words' && index < elements.length - 1 ? '\u00A0'
                : '' }} </span>
    </p>
</template>

<script>
export default {
    name: 'BlurText',
    props: {
        // 文字内容
        text: {
            type: String,
            default: ''
        },
        // 动画延迟时间
        delay: {
            type: Number,
            default: 200
        },
        // CSS类名
        className: {
            type: String,
            default: ''
        },
        // 动画方式，可选值：words、letters
        animateBy: {
            type: String,
            default: 'words',
            validator: function (value) {
                return ['words', 'letters'].indexOf(value) !== -1
            }
        },
        // 动画方向，可选值：top、bottom
        direction: {
            type: String,
            default: 'top',
            validator: function (value) {
                return ['top', 'bottom'].indexOf(value) !== -1
            }
        },
        // 视口阈值
        threshold: {
            type: Number,
            default: 0.1
        },
        // 视口边距
        rootMargin: {
            type: String,
            default: '0px'
        },
        // 自定义初始动画属性
        animationFrom: {
            type: Object,
            default: null
        },
        // 自定义结束动画属性
        animationTo: {
            type: Array,
            default: null
        },
        // 动画缓动函数
        easing: {
            type: Function,
            default: function (t) { return t; }
        },
        // 当所有动画完成时触发的回调函数
        onAnimationComplete: {
            type: Function,
            default: null
        },
        // 每个字母/单词的动画时间（以秒为单位）
        stepDuration: {
            type: Number,
            default: 0.35
        }
    },
    data: function () {
        return {
            inView: false,
            animationKey: 0,
            completionFired: false,
            observer: null,
            animationStates: [] // 存储每个元素的动画状态
        }
    },
    computed: {
        elements: function () {
            return this.animateBy === 'words' ? this.text.split(' ') : this.text.split('')
        },
        defaultFrom: function () {
            return this.direction === 'top' ?
                { filter: 'blur(10px)', opacity: 0, y: -50 } :
                { filter: 'blur(10px)', opacity: 0, y: 50 }
        },
        defaultTo: function () {
            return [
                {
                    filter: 'blur(5px)',
                    opacity: 0.5,
                    y: this.direction === 'top' ? 5 : -5
                },
                {
                    filter: 'blur(0px)',
                    opacity: 1,
                    y: 0
                }
            ]
        },
        fromSnapshot: function () {
            return this.animationFrom || this.defaultFrom
        },
        toSnapshots: function () {
            return this.animationTo || this.defaultTo
        },
        stepCount: function () {
            return this.toSnapshots.length + 1
        },
        totalDuration: function () {
            return this.stepDuration * (this.stepCount - 1)
        }
    },
    mounted: function () {
        this.setupObserver()
        // 初始化动画状态
        this.animationStates = new Array(this.elements.length).fill().map(function () {
            return Object.assign({}, this.fromSnapshot)
        }, this)
    },
    beforeDestroy: function () {
        if (this.observer) {
            this.observer.disconnect()
        }
    },
    watch: {
        threshold: function () {
            if (this.observer) {
                this.observer.disconnect()
            }
            this.setupObserver()
        },
        rootMargin: function () {
            if (this.observer) {
                this.observer.disconnect()
            }
            this.setupObserver()
        },
        delay: function () {
            this.animationKey++
            this.completionFired = false
        },
        stepDuration: function () {
            this.animationKey++
            this.completionFired = false
        },
        animateBy: function () {
            this.animationKey++
            this.completionFired = false
        },
        direction: function () {
            this.animationKey++
            this.completionFired = false
        },
        inView: function (newVal) {
            if (newVal) {
                this.startAnimation()
            }
        }
    },
    methods: {
        getElementStyle: function (index) {
            var style = {
                display: 'inline-block',
                willChange: 'transform, filter, opacity',
                transition: 'all ' + (this.stepDuration * this.stepCount) + 's'
            }

            // 应用当前动画状态
            var state = this.animationStates[index] || this.fromSnapshot
            for (var key in state) {
                if (key === 'y') {
                    style.transform = 'translateY(' + state[key] + 'px)'
                } else if (key === 'filter' || key === 'opacity') {
                    style[key] = state[key]
                }
            }

            return style
        },
        setupObserver: function () {
            var self = this
            if (!this.$refs.rootRef) return

            this.observer = new IntersectionObserver(
                function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            self.inView = true
                            if (self.observer) {
                                self.observer.unobserve(self.$refs.rootRef)
                            }
                        }
                    })
                },
                {
                    threshold: this.threshold,
                    rootMargin: this.rootMargin
                }
            )

            this.observer.observe(this.$refs.rootRef)
        },
        startAnimation: function () {
            var self = this
            // 为每个元素启动动画
            this.elements.forEach(function (element, index) {
                setTimeout(function () {
                    self.animateElement(index)
                }, index * self.delay)
            })
        },
        animateElement: function (index) {
            var self = this
            var steps = [this.fromSnapshot].concat(this.toSnapshots)
            var totalSteps = steps.length

            // 逐步更新元素状态
            for (var i = 0; i < totalSteps; i++) {
                (function (stepIndex) {
                    setTimeout(function () {
                        if (stepIndex < steps.length) {
                            // 更新元素状态
                            self.$set(self.animationStates, index, Object.assign({}, steps[stepIndex]))

                            // 如果是最后一个步骤且是最后一个元素，触发完成事件
                            if (stepIndex === totalSteps - 1 && index === self.elements.length - 1) {
                                self.handleAnimationComplete(index)
                            }
                        }
                    }, stepIndex * (self.totalDuration / totalSteps) * 1000)
                })(i)
            }
        },
        handleAnimationComplete: function (index) {
            if (index === this.elements.length - 1 && !this.completionFired && this.onAnimationComplete) {
                this.completionFired = true
                this.onAnimationComplete()
            }
        }
    }
}
</script>

<style scoped>
.flex-wrap {
  display: flex;
  flex-wrap: wrap;
}
.blur-text {
  font-size: clamp(20px, 25px, 34px);
}
</style>