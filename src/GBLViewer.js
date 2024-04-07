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
            rendererRef.current.shadowMap.enabled = true; // Включение использования теней

            // Create PMREMGenerator
            pmremGeneratorRef.current = new PMREMGenerator(rendererRef.current);

            camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 10000);
            camera.position.set(0, 0, 5);

            // Add lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
            directionalLight.position.set(1, 100, 50).normalize();
            directionalLight.castShadow = true; // Включение использования теней для источника света
            scene.add(directionalLight);

            // Настройка теней для источника света
            directionalLight.shadow.mapSize.width = 1024; // ширина теневой карты
            directionalLight.shadow.mapSize.height = 1024; // высота теневой карты
            directionalLight.shadow.camera.near = 0.5; // ближняя плоскость для теневого проецирования
            directionalLight.shadow.camera.far = 50; // дальняя плоскость для теневого проецирования

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
                    gltf.scene.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true; // Разрешение объекту проецировать тени
                            child.receiveShadow = true; // Разрешение объекту принимать тени от других объектов
                        }
                    });

                    // Получение размеров и центра модели
                    const box = new THREE.Box3().setFromObject(gltf.scene);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());

                    // Создание пола
                    const floorGeometry = new THREE.PlaneGeometry(size.x * 1.5, size.z * 1.5, 32, 32); // Создание геометрии пола
                    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide }); // Создание материала для пола
                    const floor = new THREE.Mesh(floorGeometry, floorMaterial); // Создание объекта пола
                    floor.rotation.x = -Math.PI / 2; // Поворот пола, чтобы он лежал плоско
                    floor.receiveShadow = true; // Разрешение полу принимать тени
                    scene.add(floor); // Добавление пола в сцену

                    // Позиция модели над полом
                    gltf.scene.position.set(center.x, size.y / 2, center.z); // Позиционирование модели над полом
                    scene.add(gltf.scene); // Добавление модели на сцену

                    // Установка позиции камеры и точки, куда она смотрит
                    camera.position.set(center.x + size.x, size.y, center.z + size.z * 3);
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
            rendererRef.current.shadowMap.needsUpdate = true; // Обновление теней на каждом кадре
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
