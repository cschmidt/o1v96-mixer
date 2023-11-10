<!-- Mixer.vue -->
<template>
  <div class="mixer">
    <div class="mixer-controls">
      <div class="layer-controls-container">
        <h2>LAYER</h2>      
        <div class="layer-controls">
          <button>1&#8209;32</button>
          <button>MASTER</button>
          <button>REMOTE</button>
        </div>
      </div>
      <div class="fader-mode-controls-container">
        <h2>FADER MODE</h2>
        <div class="fader-mode-controls">
            <button>AUX1</button>
            <button>AUX2</button>
            <button>AUX3</button>
            <button>AUX4</button>
            <button>AUX5</button>
            <button>AUX6</button>
            <button>AUX7</button>
            <button>AUX8</button>
            <button>HOME</button>
        </div>
      </div>
    </div>
    <div class="faders">
      <Fader
        v-for="channel in channels"
        :key="channel"
        :label="channel.toString()"
        :value="faders[channel]"
        @update:value="setFaderValue(channel, $event)"
      />
      <Fader label="STEREO" :value="master" @update:value="master = $event" />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import Fader from './Fader.vue';

export default {
  components: {
    Fader
  },
  setup() {
    const faders = ref([...Array(16)].map(() => 63));  // Middle position for demonstration
    const master = ref(63);  // Master fader's initial value

    const setFaderValue = (channel, value) => {
      faders.value[channel - 1] = value;
      // Here, you would typically send the new value to your backend or the mixer's API
    };

    return {
      faders,
      master,
      channels: [...Array(16).keys()].map(i => i + 1),
      setFaderValue
    };
  }
};
</script>

<style scoped>
.mixer-controls {
  display: inline-flex;
  margin-bottom: 1em;
}

.faders {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.layer-controls-container {
  display: block;
  margin-right: 1em;
}
.layer-controls {
  background-color: white;
  padding: 0.5em;
  display: inline-flex;
}

.layer-controls button {
  padding: 0.5em;
  margin: 0.5em;
  background-color: #5e718f;
  color: #fefefe;
}

.layer-controls h2 {
  background-color: none;
}

.fader-mode-controls-container {
  display: block;
}

.fader-mode-controls {
  background-color: black;
  padding: 0.5em;
  display: inline-flex;
}
.fader-mode-controls button {
  padding: 0.5em;
  margin: 0.5em;
  font-variant: small-caps;
  background-color: #000000;
  color: #fefefe;
}

h2 {
  font-weight: bold;
}

</style>
