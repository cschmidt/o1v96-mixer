// Based on https://codepen.io/lzl124631x/pen/wvGBwKV
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

let dragging = false
const faderLevel = ref(0);
const sliderContainer = ref<HTMLDivElement | null>(null)

const emit = defineEmits(['update:modelValue'])

const props = defineProps<{
  label: String,
  channel: String,
  modelValue: number
}>()

const value = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value, props.channel)
    faderLevel.value = value
  }
})


function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}


function onMouseDown(e : MouseEvent) {
  dragging = true
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}


function onMouseMove(e : MouseEvent) {
  if (dragging) update(e)
}


function onMouseUp(e : MouseEvent) {
  dragging = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}


function update(e : MouseEvent) {
  const rect = sliderContainer.value?.getBoundingClientRect()
  if (rect) {
    const updatedLevel =
      100 -
      ((clamp(e.clientY, rect.top, rect.bottom) - rect.top) / rect.height) * 100
    value.value = updatedLevel
  }
}


onMounted(() => {
  faderLevel.value = props.modelValue
})


watch(() => props.modelValue, (newValue) => {
  faderLevel.value = newValue;
});
</script>



<style scoped>
* {
  margin: 0;
  padding: 0;
}

.slider {
  padding: 0.5em 0;
  width: 4em;
  border-radius: 0.25em;
  border-left: solid 1px #8888AA;
}
.slider-value {
  text-align: center;
  width: 100%;
  margin-bottom: 1em;
  font-family: sans-serif;
  color: white;
}
.slider-label {
  color: white;
  text-align: center;
  width: 100%;
  margin-top: 3em;
}
.slider-hit-area {
  height: 20em;
  width: 100%;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.slider-container {
  width: 3px;
  height: 100%;
  background-color: black;
  position: relative;
  .filled {
    background-color: rgb(59, 157, 72);
    width: 100%;
    position: absolute;
    bottom: 0;
    left: 0;
  }
  .handle {
    width: 2em;
    height: 4em;
    border-radius: 5%;
    background-color: red;
    background-image: url('/mixer-knob.jpg');
    position: absolute;
    left: 50%;
    transform: translate(-50%, 50%);
  }
}
</style>
<!-- Use preprocessors via the lang attribute! e.g. <template lang="pug"> -->
<template>
  <div class="slider">
    <div class="slider-value">{{ Math.round(faderLevel) }}</div>
    <div class="slider-hit-area" @click="update">
      <div class="slider-container" ref="sliderContainer">
        <div class="filled" :style="{ height: faderLevel + '%' }"></div>
        <div
          class="handle"
          :style="{ bottom: faderLevel + '%' }"
          @mousedown="onMouseDown"
        ></div>
      </div>
    </div>
    <div class="slider-label">{{ label }}</div>
  </div>
</template>

