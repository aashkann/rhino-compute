<template>
    <div id="viewport">
        <!-- To this element we will append our 3d scene. -->
        <div id="threejs-container"></div>

    </div>
</template>

<script setup>
// Imports;
import { onMounted, onUpdated, watch } from 'vue'
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { Rhino3dmLoader } from "three/addons/loaders/3DMLoader.js"
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { runCompute } from "@/scripts/compute.js"
import { loadRhino } from "@/scripts/compute.js";

import texturePath from "../assets/graphics/brick_texture.jpg"


const loader = new Rhino3dmLoader()
loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@8.0.0-beta2/')


const props = defineProps(["data", "path", "runCompute"]);
const emits = defineEmits(["updateMetadata"]);


watch(() => props.data, (newValue) => {
    console.log(props.data)
    if (newValue) {
        compute();
    }
}, { deep: true })


// Three js objects
let renderer, camera, scene, controls, container
let mirrorMaterial, blackMaterial, texture


const widthRatio = 0.7;
const heightRatio = 0.85;
let width = window.innerWidth * widthRatio;
let heigh = window.innerHeight * heightRatio;
const frustumSize = 40;
const aspectRatio = width / heigh;



function init() {

    window.addEventListener("resize", onWindowResize, false);
    // rendeder
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, heigh);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById("threejs-container").appendChild(renderer.domElement);

    // camera
    THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);
    camera = camera = new THREE.OrthographicCamera(
        -frustumSize * aspectRatio / 2, // left
        frustumSize * aspectRatio / 2,  // right
        frustumSize / 2,               // top
        -frustumSize / 2,              // bottom
        -1000,                         // near
        1000                           // far
    );
    camera.position.set(100, 25, 20);//setup the right camera to start with!
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);

    // scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color("rgb(222, 231, 243)");


    // orbit controls
    controls = new OrbitControls(camera, renderer.domElement);

    let lightX = 20;
    let lightY = 50;
    let lightZ = 50;

    // create a spotlight with shadow camera parameters
    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d, 2 );
				hemiLight.position.set( lightX, lightY,lightZ );
				scene.add( hemiLight );

    const dirLight = new THREE.DirectionalLight( 0xFFDB83, 3 );
    dirLight.position.set( 10, 100, 100 );
    dirLight.lookAt(0, 0, 0)
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 5024;
    dirLight.shadow.mapSize.height = 5024;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 1000;
    scene.add( dirLight );

    const geometry = new THREE.SphereGeometry( 1,10,10); 

const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } ); 
const sphere = new THREE.Mesh( geometry, material ); scene.add( sphere );
sphere.position.set(lightX, lightY, lightZ);
scene.add(sphere)

    // // add floor material
    // const shadowMaterial = new THREE.ShadowMaterial();
    // shadowMaterial.opacity = 5;
    // shadowMaterial.blending = THREE.MultiplyBlending;

    // Ground


    // add shadow plane
    // const plane = new THREE.Mesh(
    //     new THREE.PlaneGeometry(1000, 50),
    //     new THREE.ShadowMaterial( {
    //         color:  'skyblue',
    //         transparent: true,
    //         opacity: 0.75,
    //         side: THREE.DoubleSide,
    //     } ),
    // );
    // plane.position.y = - 3;
    // plane.rotation.x = - Math.PI;
    // plane.scale.setScalar( 10 );
    // plane.receiveShadow = true;
    // scene.add( plane );
    texture = new THREE.TextureLoader().load(texturePath, function() {
    console.log('Texture loaded successfully');
    }, undefined, function(err) {
        console.error('Error loading texture:', err);
    });
    THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

    // add fun shape
    animate();
}


// this function runs Compute
async function compute() {
    console.log("Runnning compute... \ndata sent: ", props.data)
    const doc = await runCompute(props.data, props.path)

    if (doc.metadata) {
        emits("updateMetadata", doc.metadata);
    }

    // clear objects from scene
    scene.traverse((child) => {
        if (!child.isLight && child.isCompute) {
        scene.remove(child);
        }
    });


    // add object graph from rhino model to three.js scene
    const buffer = new Uint8Array(doc.toByteArray()).buffer;
    loader.parse(buffer, function (object) {
        
        object.isCompute = true;
        object.castShadow = true;
        object.traverse((child) => {
            if (child.isMesh) {


                child.castShadow = true;
                child.receiveShadow = true;
                // Create a material with the texture
                const material = new THREE.MeshPhongMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    receiveShadow: true,
                    castShadow: true,
                });


                // Apply the material to the child
                child.material = material;
            }
        })

        scene.add(object)
        console.log("Compute done")
    });
}



// for controls update
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// This will be run whenever the window is resized
window.addEventListener("resize", onWindowResize);
function onWindowResize() {

    camera.aspect =
    (window.innerWidth * widthRatio) / (window.innerHeight * heightRatio);
  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth * widthRatio,
    window.innerHeight * heightRatio
  );
}

/**
 * Helper function that behaves like rhino's "zoom to selection", but for three.js!
 */
function zoomCameraToSelection(camera, controls, selection, fitOffset = 1.1) {

    const box = new THREE.Box3();

    for (const object of selection) {
        if (object.isLight) continue
        box.expandByObject(object);
    }

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxSize = Math.max(size.x, size.y, size.z);
    const fitHeightDistance = maxSize / (2 * Math.atan(Math.PI * camera.fov / 360));
    const fitWidthDistance = fitHeightDistance / camera.aspect;
    const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

    const direction = controls.target.clone()
        .sub(camera.position)
        .normalize()
        .multiplyScalar(distance);
    controls.maxDistance = distance * 10;
    controls.target.copy(center);

    camera.near = distance / 100;
    camera.far = distance * 100;
    camera.updateProjectionMatrix();
    camera.position.copy(controls.target).sub(direction);

    controls.update();

}



// This will be run whenever this component is instantiated
onMounted(async () => {
    init()
    await loadRhino()
    //compute();
})


</script>

<style scoped>
#viewport {
    height: 100%;
    width: 100%;
    min-width: 200px;
    position: inherit;
}

#threejs-container {
    height: 100%;
    width: 100%;
    min-width: 200px;
    position: inherit;
}
</style>