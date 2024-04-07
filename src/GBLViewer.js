import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { PMREMGenerator } from 'three';

const GBLViewer = ({ gblFile, textureEnvironment, textureBackground }) => {
    const containerRef = useRef();
    const canvasRef = useRef();
    const rendererRef = useRef();
    const pmremGeneratorRef = useRef();

    useEffect(() => {
        let scene, camera, controls;

        // Initialize Three.js scene
        function init() {
            scene = new THREE.Scene();

            // Create renderer
            rendererRef.current = new THREE.WebGLRenderer({ antialias: true, canvas: canvasRef.current });
            rendererRef.current.setSize(window.innerWidth, window.innerHeight);

            // Create PMREMGenerator
            pmremGeneratorRef.current = new PMREMGenerator(rendererRef.current);

            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 0, 5);

            // Add lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
            directionalLight.position.set(1, 1, 1).normalize();
            scene.add(directionalLight);

            // Load texture for environment map
            new THREE.TextureLoader().load(
                textureEnvironment,
                (texture) => {
                    const envMap = pmremGeneratorRef.current.fromEquirectangular(texture).texture;
                    scene.environment = envMap;
                    texture.dispose();
                    pmremGeneratorRef.current.dispose();
                },
                undefined,
                (error) => {
                    console.error('Error loading texture:', error);
                }
            );

            new THREE.TextureLoader().load(
                textureBackground,
                (texture) => {
                    scene.background = texture;
                },
                undefined,
                (error) => {
                    console.error('Error loading background texture:', error);
                }
            );

            // Load 3D model
            const loader = new GLTFLoader();
            loader.load(
                gblFile,
                (gltf) => {
                    scene.add(gltf.scene);
                    const box = new THREE.Box3().setFromObject(gltf.scene);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    camera.position.set(size.x, size.z, size.x);

                    controls.target = center;
                    camera.lookAt(center);
                },
                undefined,
                (error) => {
                    console.error(error);
                }
            );

            controls = new OrbitControls(camera, rendererRef.current.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.55;
            controls.enableZoom = true;
        }

        // Render loop
        function animate() {
            requestAnimationFrame(animate);
            rendererRef.current.render(scene, camera);
            controls.update();
        }

        init();
        animate();

        // Cleanup Three.js objects on unmount
        return () => {
            controls.dispose();
            scene.remove();
            rendererRef.current.dispose();
        };
    }, [gblFile, textureEnvironment]);

    return <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }} ref={containerRef}><canvas ref={canvasRef} /></div>;
};

export default GBLViewer;
