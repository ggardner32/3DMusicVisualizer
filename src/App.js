import React from "react";
import * as THREE from 'three'
import { Canvas, extend, useFrame } from '@react-three/fiber'
import { useRef, Suspense } from 'react';
import { OrbitControls, Environment, useTexture } from '@react-three/drei'
import { LayerMaterial, Color, Depth, Fresnel, Noise } from 'lamina'
import { useControls } from 'leva'
import './App.css';
import AudioAnalyzer from './AudioAnalyzer';
import { shaderMaterial } from "@react-three/drei";
import glsl from "babel-plugin-glsl/macro";

var clock = new THREE.Clock();

const WaveShaderMaterial = shaderMaterial(
  // Uniform
  { uTime: 0, uColor: new THREE.Color(0.0, 0.0, 0.0) }, 
  // Vertex Shader
  glsl`
    precision mediump float;
    varying vec2 vUv;
    uniform float uTime;
    #pragma glslify: snoise3 = require(glsl-noise/simplex/3d);
    void main() {
      vUv = uv;
      
      vec3 pos = position;
      float noiseFreq = 1.5;
      float noiseAmp = 0.25;
      vec3 noisePos = vec3(pos.x * noiseFreq + uTime, pos.y, pos.z);
      pos.x += snoise3(noisePos) * noiseAmp;
      gl_Position = projectionMatrix * modelViewMatrix * vec4 (pos, 1.0);
    }
  `, 
  // Fragment shader
  glsl`
    precision mediump float;
    uniform vec3 uColor;
    uniform float uTime;
    varying vec2 vUv;
    void main() {
      gl_FragColor = vec4(sin(vUv.x + uTime), 0.8, 0.7, 0.5);
    }
  `
);

const GradientShaderMaterial = shaderMaterial(
  // Uniform
  { uTime: 0, uColor: new THREE.Color(0.0, 0.0, 0.0) }, 
  // Vertex Shader
  glsl`
    precision mediump float;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4 (position, 1.0);
    }
  `, 
  // Fragment shader
  glsl`
    precision mediump float;
    uniform vec3 uColor;
    uniform float uTime;
    varying vec2 vUv;
    void main() {
      gl_FragColor = vec4(sin(uTime), 0.5, 1.0, 0.5);
    }
  `
);

const DitherShaderMaterial = shaderMaterial(
  // Uniform
  { uTime: 0, uColor: new THREE.Color(0.0, 0.0, 0.0) }, 
  // Vertex Shader
  glsl`
    precision mediump float;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4 (position, 1.0);
    }
  `, 

  // Fragment shader
  glsl`
    precision mediump float;
    uniform vec3 uColor;
    uniform float uTime;
    #pragma glslify: dither = require(glsl-dither);
    varying vec2 vUv;
    void main() {
      vec4 color = vec4(sin(uColor.x + uTime), 0.5, 1.0, 0.5);
      gl_FragColor = dither(gl_FragCoord.xy, color);
    }
  `
);

const GraceWaveShaderMaterial = shaderMaterial(
  // Uniform
  { uTime: 0, uColor: new THREE.Color(0.0, 0.0, 0.0) }, 
  // Vertex Shader
  glsl`
    precision mediump float;
    varying vec2 vUv;
    uniform float uTime;
    #pragma glslify: snoise3 = require(glsl-noise/simplex/3d);
    void main() {
      vUv = uv;
      
      vec3 pos = position;
      float noiseFreq = 1.5;
      float noiseAmp = 0.25;
      vec3 noisePos = vec3(pos.x * -noiseFreq + uTime, pos.y, pos.z);
      pos.x -= snoise3(noisePos) * noiseAmp;
      gl_Position = projectionMatrix * modelViewMatrix * vec4 (pos, 1.0);
    }
  `, 
  // Fragment shader
  glsl`
    precision mediump float;
    uniform vec3 uColor;
    uniform float uTime;
    varying vec2 vUv;
    void main() {
      gl_FragColor = vec4(sin(vUv.x - uTime), 0.8, 0.7, 0.5);
    }
  `
);

const GraceGradientShaderMaterial = shaderMaterial(
  // Uniform
  { uTime: 0, uColor: new THREE.Color(0.0, 0.0, 0.0) }, 
  // Vertex Shader
  glsl`
    precision mediump float;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4 (position, 1.0);
    }
  `, 
  // Fragment shader
  glsl`
    precision mediump float;
    uniform vec3 uColor;
    uniform float uTime;
    #pragma glslify: dither = require(glsl-dither);
    varying vec2 vUv;
    void main() {
      vec4 color = vec4(sin(uColor.x + uTime), 0.5, 1.0, 0.5);
      gl_FragColor = dither(gl_FragCoord.xy, color);
    }
  `
);

extend({ WaveShaderMaterial });
extend({ GradientShaderMaterial });
extend({ DitherShaderMaterial });
extend({ GraceWaveShaderMaterial });
extend({ GraceGradientShaderMaterial });

const BG = () => {
  const ref = useRef();
  return (
    <mesh position={[0.0, 0.0, -5]} >
      <planeBufferGeometry args={[8, 8, 8, 8]} />
      <ditherShaderMaterial uTime={clock.getElapsedTime()} uColor={"hotpink"} ref={ref} />
    </mesh>
  )
}

const Sphere = (props) => {
  const ref = useRef();
  return (
    <mesh scale={props.scale} position={[0.7, 0, 0]}>
      <sphereBufferGeometry args={[0.4, 32.0, 32.0]} />
      <waveShaderMaterial uTime={clock.getElapsedTime()} uColor={"hotpink"} ref={ref} wireframe />
    </mesh>
  )
}

const Frames = (props) => {
  const ref = useRef();
  return (
    <mesh position={props.position}>
      <planeBufferGeometry args={[0.5, 1.2, 16, 16]} />
      <ditherShaderMaterial uTime={clock.getElapsedTime()} uColor={"green"} ref={ref} />
    </mesh>
  )
}

const SphereFrame = (props) => {
  const ref = useRef();
  return (
    <mesh position={props.position}>
      <planeBufferGeometry args={[0.5, 0.8, 16, 16]} />
      <waveShaderMaterial uTime={clock.getElapsedTime()} uColor={"green"} ref={ref} />
    </mesh> 
  )
}

const GraceSphere = (props) => {
  const ref = useRef();
  return (
    <mesh scale={props.scale} position={[0, 0, 0]}>
      <icosahedronBufferGeometry args={[0.4, 3.0]} />
      <graceWaveShaderMaterial uTime={clock.getElapsedTime()} uColor={"hotpink"} ref={ref} wireframe />
    </mesh>
  )
}

const GraceSphere2 = (props) => {
  const ref = useRef();
  return (
    <mesh scale={props.scale} position={[-0.7, 0, 0]}>
      <icosahedronBufferGeometry args={[0.3, 1.0]} />
      <waveShaderMaterial uTime={clock.getElapsedTime()} uColor={"hotpink"} ref={ref} wireframe />
    </mesh>
  )
}

const GraceSphereFrame = (props) => {
  const ref = useRef();
  return (
    <mesh position={props.position}>
      <planeBufferGeometry args={[0.5, 0.8, 16, 16]} />
      <graceWaveShaderMaterial uTime={clock.getElapsedTime()} uColor={"green"} ref={ref} />
    </mesh> 
  )
}


//UI editor
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      audioData: new Uint8Array(0),
      normalizedData: new Uint8Array(0),
      base: { value: '#ff4eb8' },
      colorA: { value: '#00ffff' },
      colorB: { value: '#ff8f00' }
    }

    this.toggleMicrophone = this.toggleMicrophone.bind(this);

    this.audioAnalyzer = new AudioAnalyzer();

    this.canvas = React.createRef();

    // react thing, idk why it is needed.
    this.loop = this.loop.bind(this);
  }

  // Asks the browser for access to use the microphone. When the user
  // allows, it will internally update its 'audio' variable with 
  // the microphone media device. It will be used by AudioAnalyser.
  async getMicrophone() {
    const audio = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });

    if (audio) {
      this.audioAnalyzer.connect(audio);
      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  stopMicrophone() {
    this.audioAnalyzer.disconnect();
    cancelAnimationFrame(this.rafId);
  }

  // Gets called when the user clicks the button on the screen. This is
  // not required. As the developer you can have the mic running 24/7.
  toggleMicrophone() {
    if (this.audioAnalyzer.isConnected()) {
      this.stopMicrophone();
    } else {
      this.getMicrophone();
    }
  }

  loop() {
    if (this.audioAnalyzer.isConnected()) {
      this.audioAnalyzer.analyze();

      const audioData = this.audioAnalyzer.getAudioData();
      const normalizedData = audioData;

      // Do what you want here with normalized data.
      // let count = 0;
      // for (let i = 0; i < 9; i++) {
      //   let avg = 0;
      //   let sampleCnt =  (Math.pow(2, i) * 2) | 0;

      //   if (i == 8) {
      //     sampleCnt += 2;
      //   }
      //   for (let j = 0; j < sampleCnt; j++) {
      //     avg += audioData[count] * (count + 1);
      //     count++;
      //   }
      //   avg /= count;
      //   normalizedData [i] = avg * 10;

      // }

      this.setState({ audioData: audioData, normalizedData: normalizedData });
    }

    this.rafId = requestAnimationFrame(this.loop);
  }

  // this gets called when the frame needs to be refreshed... DRAW()
  componentDidUpdate() {

    const audioData = this.state.audioData;

    const canvas = this.canvas.current;
    const height = canvas.height;
    const width = canvas.width;

    // The actual context that you can draw on, like graphics.
    const context = canvas.getContext('2d');

    const sliceWidth = (width * 1.0) / audioData.length;

    context.lineWidth = 2;
    context.strokeStyle = '#ffffff';
    context.clearRect(0, 0, width, height);

    let x = 0;
    for (const item of audioData) {
      const h = (item / 255.0) * height;
      const y = height - h;
      context.strokeRect(x, y, sliceWidth, h);
      x += sliceWidth;
    }

    context.stroke();
  }


  render() {
    if (!this.audioAnalyzer.isConnected()) {
      return (
        <div className="controls">
          <button className="btn" onClick={this.toggleMicrophone}>
            {'start'}
          </button>
        </div>
      )
    }

    const s1 = this.state.normalizedData[10] / 255.0 * 1.5; //1
    const s3 = this.state.normalizedData[15] / 255.0 * 1.5; //2
    const s5 = this.state.normalizedData[20] / 255.0 * 2.5; //3 
    const s2 = this.state.normalizedData[100] / 255.0 * 2.5; //4
    const s7 = this.state.normalizedData[150] / 255.0 * 2.5; //5
    const s4 = this.state.normalizedData[380] / 255.0 * 2.5; //6
    const s6 = this.state.normalizedData[400] / 255.0 * 1.5; //7
    const s8 = this.state.normalizedData[500] / 255.0 * 2.5; //8

    const r = this.state.normalizedData[100] / 300.0;

    return (
      <div>

        <div >
          <Canvas style={{ height: `500px` }} dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 10, near: 0.1 }} onpmrthographic={ true }>
            <Suspense fallback={null}>

              <BG />
              
              <Sphere scale={s1}/>
              <GraceSphere scale={s3}/>
              <GraceSphere2 scale={s5}/>

              <Frames position={[-1.5, 0.0, -3]}/>
              <Frames position={[-0.9, 0.0, -3]}/>
              <Frames position={[-0.3, 0.0, -3]}/>
              <Frames position={[0.3, 0.0, -3]}/>
              <Frames position={[0.9, 0.0, -3]}/>
              <Frames position={[1.5, 0.0, -3]}/>

              <SphereFrame position={[1.2, 0.0, -3]}/>
              <GraceSphereFrame position={[0, 0.0, -3]}/>
              <SphereFrame position={[-1.2, 0.0, -3]}/>

              <mesh scale={s1} position={[0.7, 0, 0]} >
                <sphereGeometry args={[0.2, 64, 64]} />
                <meshPhysicalMaterial color={0xaaa9ad} depthWrite={false} transmission={1} thickness={10} roughness={r} />
              </mesh>

              <mesh scale={s3} position={[0, 0, 0]} >
                <sphereGeometry args={[0.1, 64, 64]} />
                <meshPhysicalMaterial color={0xaaa9ad} depthWrite={false} transmission={1} thickness={10} roughness={r} />
              </mesh>
              <mesh scale={s3} position={[0, 0, 0]} >
                <torusGeometry args={[0.2, 0.05, 64, 64]} />
                <meshPhysicalMaterial color={0xaaa9ad} depthWrite={false} transmission={1} thickness={10} roughness={r} />
              </mesh>

              <mesh scale={s5} position={[-0.7, 0, 0]} >
                <sphereGeometry args={[0.045, 64, 64]} />
                <meshPhysicalMaterial color={0xaaa9ad} depthWrite={false} transmission={1} thickness={10} roughness={r} />
              </mesh>
              <mesh scale={s5} position={[-0.7, 0, 0]} >
                <torusGeometry args={[0.085, 0.025, 64, 64]} />
                <meshPhysicalMaterial color={0xaaa9ad} depthWrite={false} transmission={1} thickness={10} roughness={r} />
              </mesh>
              <mesh scale={s5} position={[-0.7, 0, 0]} >
                <torusGeometry args={[0.15, 0.025, 64, 64]} />
                <meshPhysicalMaterial color={0xaaa9ad} depthWrite={false} transmission={1} thickness={10} roughness={r} />
              </mesh>

              <OrbitControls />
              <pointLight position={[500, 500, 0]} />
              <ambientLight intensity={0.4} />
              <Environment preset="warehouse" />
            </Suspense>
          </Canvas>
        </div>

        <div>
          <canvas width="1350" height="300" ref={this.canvas} />;
        </div>

      </div>
    );
  }
}


export default App;
