<template>
  <div id="sidebar">
    <Slider
      :title="widthSliderName"
      :min="0"
      :max="100"
      :step="1"
      :val="widthSliderVal"
      @update="updateValue"
    />
    <Slider
      :title="heightSliderName"
      :min="0"
      :max="100"
      :step="1"
      :val="heightSliderVal"
      @update="updateValue"
    />
    <Dropdown
      :title="shapeDropDownName"
      :options="dropdownOptions"
      :val="shapeIndex"
      @update="updateValue"
    ></Dropdown>
  </div>

  <div id="viewer">
    <GeometryView :data="inputs" :path="path"></GeometryView>
  </div>
</template>

<script setup>
import { ref, onBeforeMount, computed } from "vue";
import GeometryView from "../components/MinimalisticGeometryView.vue";
import Slider from "../components/Slider.vue";
import Dropdown from "../components/Dropdown.vue";
//import Dropdown from 'primevue/dropdown';

//define path to grasshopper script
import def from "../assets/wall.gh";
const path = def;
const widthSliderName = ref("Width");
const widthSliderVal = ref(50);

const heightSliderName = ref("Height");
const heightSliderVal = ref(15);

const shapeDropDownName = ref("Shape");
const shapeIndex = ref(0);
const dropdownOptions = ref([
  { label: "Standard", value: 0 },
  { label: "Concave", value: 1 },
  { label: "Convex", value: 2 },
]);

//define inputs
let inputs = ref({
  [widthSliderName.value]: widthSliderVal.value,
  [heightSliderName.value]: heightSliderVal.value,
  [shapeDropDownName.value]: shapeIndex.value,
});

function updateValue(newValue, parameterName) {
  // Iterate over the inputs array
  for (const [key, value] of Object.entries(inputs.value)) {
    if (key == parameterName) {
      inputs.value[key] = newValue;
      console.log(parameterName + ":" + newValue);
    }
  }
}
</script>

<style scoped>
#sidebar {
  width: 310px;
  padding: 10px;
  flex-shrink: 0;
}

#viewer {
  width: 500px;
}
</style>
