import React, { useLayoutEffect }from 'react'; 
import { useGLTF } from '@react-three/drei'; 
import * as THREE from 'three'; 
 
export const Test = () => { 
  const { scene } = useGLTF('./models/test.gltf'); 
 
  return <primitive object={scene} /> 
}; 