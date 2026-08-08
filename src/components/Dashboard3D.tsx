import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Eye, EyeOff, Layers, RefreshCw, Compass } from 'lucide-react';
import { Node as NodeType, TooltipData, AnimationSettings } from '../types';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { Header } from './Header';
import { Legend } from './Legend';
import { LiveStatus } from './LiveStatus';
import { SettingsPanel } from './SettingsPanel';
import { ChartModal } from './ChartModal';
import { Tooltip } from './Tooltip';
import { ComparisonPanel } from './ComparisonPanel';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';

interface Node3D extends NodeType {
  x3d: number;
  y3d: number;
  z3d: number;
  opacity3d: number;
}

interface Dashboard3DProps {
  viewMode?: '2d' | '3d' | 'vr';
  onViewModeSwitch?: (viewMode: '2d' | '3d' | 'vr') => void;
}

export const Dashboard3D: React.FC<Dashboard3DProps> = ({
  viewMode = '3d',
  onViewModeSwitch
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [refreshInterval, setRefreshInterval] = useState<number>(() => {
    const saved = localStorage.getItem('blotchain_refresh_interval');
    return saved ? parseInt(saved, 10) : 30000;
  });

  const { nodes, connections, loading, error, lastUpdate, refetch } = useRealTimeData(refreshInterval);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [activeChartNode, setActiveChartNode] = useState<NodeType | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Anatomy features states
  const [isIsolated, setIsIsolated] = useState<boolean>(false);
  const [isStructure, setIsStructure] = useState<boolean>(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [ambientColor, setAmbientColor] = useState<string>('#3b82f6'); // default blue glow

  // Screen projected labels state (Imperative HTML projection)
  const [projectedLabels, setProjectedLabels] = useState<Array<{
    id: string;
    name: string;
    category: string;
    color: string;
    isHub: boolean;
    x: number;
    y: number;
    visible: boolean;
    opacity: number;
  }>>([]);

  const [animationSettings, setAnimationSettings] = useState<AnimationSettings>(() => {
    const saved = localStorage.getItem('blotchain_animation_settings');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      particleSpeed: 1,
      breathingIntensity: 1
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipData>({
    node: {} as NodeType,
    x: 0,
    y: 0,
    visible: false
  });

  // Calculate uniform 3D spherical positions for the nodes
  const nodes3D = useMemo(() => {
    if (nodes.length === 0) return [];

    const hubs = nodes.filter(n => n.isHub);
    const cex = nodes.filter(n => n.category === 'CEX' && !n.isHub);
    const others = nodes.filter(n => !n.isHub && n.category !== 'CEX');

    const result: Array<NodeType & { x3d: number; y3d: number; z3d: number }> = [];

    // 1. Core Hubs: place near the center in a small cluster
    hubs.forEach((node, idx) => {
      const angle = (idx / hubs.length) * Math.PI * 2;
      result.push({
        ...node,
        x3d: Math.cos(angle) * 5,
        y3d: Math.sin(angle) * 3,
        z3d: (idx % 2 === 0 ? 1 : -1) * 2
      });
    });

    // 2. CEX nodes: place in an intermediate shell
    cex.forEach((node, idx) => {
      const u = idx / cex.length;
      const theta = u * Math.PI * 2.0;
      const phi = Math.acos(2.0 * u - 1.0) - Math.PI / 2.0;
      const radius = 15;
      result.push({
        ...node,
        x3d: radius * Math.cos(phi) * Math.cos(theta),
        y3d: radius * Math.sin(phi),
        z3d: radius * Math.cos(phi) * Math.sin(theta)
      });
    });

    // 3. Others (Altcoins, Stablecoins, Protocols, AMMs): outer shell using a uniform Fibonacci sphere
    const count = others.length;
    const phiGold = Math.PI * (3.0 - Math.sqrt(5.0)); // golden angle in radians

    others.forEach((node, idx) => {
      const radius = 28 + (idx % 3) * 2; // subtle radial variance
      const y = 1.0 - (idx / (count - 1)) * 2.0; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1.0 - y * y); // radius at y
      const theta = phiGold * idx; // golden angle increment

      result.push({
        ...node,
        x3d: radius * radiusAtY * Math.cos(theta),
        y3d: radius * y,
        z3d: radius * radiusAtY * Math.sin(theta)
      });
    });

    return result;
  }, [nodes]);

  // Categories helper
  const categories = useMemo(() => {
    const cats = new Set(nodes.filter(n => !n.isHub).map(n => n.category));
    return ['All', ...Array.from(cats)].sort();
  }, [nodes]);

  // Filtered nodes in 3D
  const filteredNodes3D = useMemo(() => {
    return nodes3D.map(node => {
      const isVisible = categoryFilter === 'All' || node.category === categoryFilter || node.isHub;
      return {
        ...node,
        opacity3d: isVisible ? 1.0 : 0.15
      };
    });
  }, [nodes3D, categoryFilter]);

  const filteredNodes3DMap = useMemo(() => {
    return new Map(filteredNodes3D.map(n => [n.id, n]));
  }, [filteredNodes3D]);

  const selectedNodeData = useMemo(() => {
    return nodes.filter(n => selectedNodes.has(n.id));
  }, [nodes, selectedNodes]);

  const clearSelection = useCallback(() => {
    setSelectedNodes(new Set());
  }, []);

  const toggleComparison = useCallback((nodeId: string) => {
    setSelectedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        if (newSet.size >= 2) {
          const arr = Array.from(newSet);
          return new Set([arr[1], nodeId]);
        }
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Set up camera target animation state
  const cameraTargetRef = useRef<THREE.Vector3 | null>(null);
  const controlsTargetRef = useRef<THREE.Vector3 | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Focus on a particular node using cinematic camera lerp
  const focusOnNode = useCallback((nodeId: string | null) => {
    setFocusedNodeId(nodeId);
    if (!nodeId) {
      // Reset position to default view
      cameraTargetRef.current = new THREE.Vector3(0, 15, 55);
      controlsTargetRef.current = new THREE.Vector3(0, 0, 0);
      setAmbientColor('#3b82f6'); // default blue
      return;
    }

    const node = filteredNodes3DMap.get(nodeId);
    if (!node) return;

    // Set cinematic camera target position (with offset to look from side)
    const targetCam = new THREE.Vector3(node.x3d, node.y3d, node.z3d).add(new THREE.Vector3(0, 5, 15));
    cameraTargetRef.current = targetCam;
    controlsTargetRef.current = new THREE.Vector3(node.x3d, node.y3d, node.z3d);

    // Dynamic glow transition
    setAmbientColor(node.color);
  }, [filteredNodes3DMap]);

  // Set up three.js scene inside useEffect
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || filteredNodes3D.length === 0) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create scene with deep background and subtle fog
    const scene = new THREE.Scene();
    scene.background = null; // transparent background so we can see the ambient glow gradient overlay div

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 15, 55);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    // Lights
    const ambientLight = new THREE.AmbientLight('#1e293b', 1.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight('#ffffff', 2.5, 120);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    const dirLight1 = new THREE.DirectionalLight('#3b82f6', 1.2);
    dirLight1.position.set(30, 20, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight('#8b5cf6', 1.2);
    dirLight2.position.set(-30, -20, -20);
    scene.add(dirLight2);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 150;
    controls.minDistance = 5;
    controlsRef.current = controls;

    // Shared sphere geometry
    const sphereGeo = new THREE.SphereGeometry(1, 32, 32);

    // Hold refs to meshes for direct color, scale, and structure updates
    const nodeMeshes: THREE.Group[] = [];
    const nodeIdToMesh = new Map<string, THREE.Group>();

    const getNodeRadius = (size: number) => size / 22;

    // Render Node Spheres
    filteredNodes3D.forEach(node => {
      const nodeGroup = new THREE.Group();
      nodeGroup.position.set(node.x3d, node.y3d, node.z3d);
      nodeGroup.userData = { nodeId: node.id, nodeData: node };

      const r = getNodeRadius(node.size);

      // Sphere Material: Wireframe Mode support (`isStructure`)
      const sphereMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(node.color),
        roughness: 0.15,
        metalness: 0.2,
        transparent: true,
        wireframe: isStructure,
        opacity: node.opacity3d,
        emissive: new THREE.Color(node.color),
        emissiveIntensity: node.isHub ? 0.35 : 0.15
      });

      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.scale.setScalar(r);
      nodeGroup.add(sphereMesh);

      scene.add(nodeGroup);
      nodeMeshes.push(nodeGroup);
      nodeIdToMesh.set(node.id, nodeGroup);
    });

    // Create Connection Lines
    const lineMaterial = new THREE.LineBasicMaterial({
      color: '#475569',
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    });

    interface ConnectionRef {
      line: THREE.Line;
      particle: THREE.Mesh;
      speed: number;
      progress: number;
      start: THREE.Vector3;
      end: THREE.Vector3;
      sourceId: string;
      targetId: string;
      flow: number;
    }

    const connectionRefs: ConnectionRef[] = [];
    const particleGeo = new THREE.SphereGeometry(0.12, 16, 16);

    connections.forEach(conn => {
      const srcNode = filteredNodes3DMap.get(conn.source);
      const tgtNode = filteredNodes3DMap.get(conn.target);
      if (!srcNode || !tgtNode) return;

      const p1 = new THREE.Vector3(srcNode.x3d, srcNode.y3d, srcNode.z3d);
      const p2 = new THREE.Vector3(tgtNode.x3d, tgtNode.y3d, tgtNode.z3d);

      const vector = new THREE.Vector3().subVectors(p2, p1);
      const totalLen = vector.length();

      const r1 = getNodeRadius(srcNode.size) * 1.20;
      const r2 = getNodeRadius(tgtNode.size) * 1.20;

      if (totalLen <= r1 + r2) return;

      const p1Offset = p1.clone().addScaledVector(vector.clone().normalize(), r1);
      const p2Offset = p2.clone().addScaledVector(vector.clone().normalize(), -(r2));

      // Line
      const lineGeo = new THREE.BufferGeometry().setFromPoints([p1Offset, p2Offset]);
      const line = new THREE.Line(lineGeo, lineMaterial);
      scene.add(line);

      // Particle
      const flowColor = conn.direction === 'in' ? '#22c55e' : '#f43f5e';
      const particleMat = new THREE.MeshBasicMaterial({
        color: flowColor,
        transparent: true,
        opacity: 0.9
      });
      const particle = new THREE.Mesh(particleGeo, particleMat);
      particle.position.copy(p1Offset);
      scene.add(particle);

      connectionRefs.push({
        line,
        particle,
        speed: 0.003 * animationSettings.particleSpeed * (Math.random() * 0.5 + 0.75),
        progress: Math.random(),
        start: p1Offset,
        end: p2Offset,
        sourceId: conn.source,
        targetId: conn.target,
        flow: conn.flow
      });
    });

    // Raycasting for interactive click/hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let localHoveredId: string | null = null;

    const getRaycastIntersect = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const targets = nodeMeshes.map(group => group.children[0]);
      const intersects = raycaster.intersectObjects(targets);

      if (intersects.length > 0) {
        return intersects[0].object.parent as THREE.Group;
      }
      return null;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const intersectedGroup = getRaycastIntersect(e.clientX, e.clientY);

      if (intersectedGroup) {
        const nodeData = intersectedGroup.userData.nodeData as NodeType;
        if (localHoveredId !== nodeData.id) {
          localHoveredId = nodeData.id;
          setHoveredNodeId(nodeData.id);

          setTooltip({
            node: nodeData,
            x: e.clientX,
            y: e.clientY - 15,
            visible: true
          });
          document.body.style.cursor = 'pointer';
        } else {
          setTooltip(prev => ({
            ...prev,
            x: e.clientX,
            y: e.clientY - 15
          }));
        }
      } else {
        if (localHoveredId !== null) {
          localHoveredId = null;
          setHoveredNodeId(null);
          setTooltip(prev => ({ ...prev, visible: false }));
          document.body.style.cursor = 'default';
        }
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const clickedGroup = getRaycastIntersect(e.clientX, e.clientY);
      if (clickedGroup) {
        const nodeData = clickedGroup.userData.nodeData as NodeType;

        // Focus on node with cinematic glide
        focusOnNode(nodeData.id);

        if (nodeData.isHub) {
          toggleComparison(nodeData.id);
        } else {
          setActiveChartNode(nodeData);
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerDown);

    // Grid Helper
    const gridHelper = new THREE.GridHelper(80, 40, '#1e293b', '#0f172a');
    gridHelper.position.y = -18;
    scene.add(gridHelper);

    // Animation loop variables
    let animationFrameId: number;
    const clock = new THREE.Clock();
    const tempV = new THREE.Vector3();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Cinematic Glide: smoothly interpolate camera position & controls target
      if (cameraTargetRef.current) {
        camera.position.lerp(cameraTargetRef.current, 0.05);
        if (camera.position.distanceTo(cameraTargetRef.current) < 0.01) {
          cameraTargetRef.current = null; // stop lerp when close enough
        }
      }
      if (controlsTargetRef.current) {
        controls.target.lerp(controlsTargetRef.current, 0.05);
        if (controls.target.distanceTo(controlsTargetRef.current) < 0.01) {
          controlsTargetRef.current = null;
        }
      }

      controls.update();

      const time = clock.getElapsedTime();
      const widthHalf = width / 2;
      const heightHalf = height / 2;

      // Determine active focus neighborhood filter
      const activeFilterId = focusedNodeId || localHoveredId;

      // Calculate directly connected neighborhood ids if Isolation Mode is on
      const connectedNeighbors = new Set<string>();
      if (activeFilterId) {
        connectedNeighbors.add(activeFilterId);
        connections.forEach(c => {
          if (c.source === activeFilterId) connectedNeighbors.add(c.target);
          if (c.target === activeFilterId) connectedNeighbors.add(c.source);
        });
      }

      // 1. Update Node Spheres (LOD, Breathing, Isolate, Structure)
      const labelUpdates: typeof projectedLabels = [];

      nodeMeshes.forEach(group => {
        const node = group.userData.nodeData as Node3D;
        const sphereMesh = group.children[0] as THREE.Mesh;
        const sphereMat = sphereMesh.material as THREE.MeshStandardMaterial;

        // Isolate & hover fading calculation
        let targetOpacity = node.opacity3d;
        if (isIsolated && activeFilterId) {
          const isNeighbor = connectedNeighbors.has(node.id);
          targetOpacity = isNeighbor ? node.opacity3d : 0.12;
        }
        sphereMat.opacity = THREE.MathUtils.lerp(sphereMat.opacity, targetOpacity, 0.1);

        // Subtly update wireframe setting in real time
        sphereMat.wireframe = isStructure;

        // Subtle float
        const floatOffset = Math.sin(time * 0.8 + node.size) * 0.05;
        group.position.y = node.y3d + floatOffset;

        // Distance LOD & projection
        const distToCam = group.position.distanceTo(camera.position);
        const isFar = distToCam > 60;

        // PROJECT node position to screen coordinate space
        tempV.copy(group.position);
        tempV.project(camera);

        const isBehindCamera = tempV.z > 1;
        const screenX = (tempV.x * widthHalf) + widthHalf;
        const screenY = -(tempV.y * heightHalf) + heightHalf;

        // Build list of labels to project into DOM overlay
        labelUpdates.push({
          id: node.id,
          name: node.name,
          category: node.category,
          color: node.color,
          isHub: !!node.isHub,
          x: screenX,
          y: screenY,
          visible: !isBehindCamera && !isFar,
          opacity: targetOpacity
        });

        // Glowing Emissive breathing
        const baseEmissive = selectedNodes.has(node.id) ? 1.0 : (node.isHub ? 0.35 : 0.15);
        const emissiveDimFactor = isFar ? 0.4 : 1.0;

        if (animationSettings.enabled) {
          const breathe = Math.sin(time * 1.5 + node.size) * 0.5 + 0.5;
          sphereMat.emissiveIntensity = (baseEmissive + breathe * 0.15 * animationSettings.breathingIntensity) * emissiveDimFactor;
        } else {
          sphereMat.emissiveIntensity = baseEmissive * emissiveDimFactor;
        }
      });

      // Update projected labels in React state
      setProjectedLabels(labelUpdates);

      // 2. Update connection lines and flow indicators
      connectionRefs.forEach(ref => {
        // Line connection highlighted state
        let targetLineOpacity = 0.3;
        const isHighlighted = selectedNodes.size === 0 || selectedNodes.has(ref.sourceId) || selectedNodes.has(ref.targetId);

        if (isIsolated && activeFilterId) {
          const isDirectLine = (ref.sourceId === activeFilterId && connectedNeighbors.has(ref.targetId)) ||
                               (ref.targetId === activeFilterId && connectedNeighbors.has(ref.sourceId));
          targetLineOpacity = isDirectLine ? 0.85 : 0.05;
        } else {
          targetLineOpacity = isHighlighted ? 0.55 : 0.12;
        }

        const lineMat = ref.line.material as THREE.LineBasicMaterial;
        lineMat.opacity = THREE.MathUtils.lerp(lineMat.opacity, targetLineOpacity, 0.1);
        lineMat.color.set(targetLineOpacity > 0.5 ? '#3b82f6' : '#475569');

        // Particle update
        if (animationSettings.enabled) {
          ref.particle.visible = targetLineOpacity > 0.1;
          ref.progress += ref.speed;
          if (ref.progress > 1) ref.progress = 0;
          ref.particle.position.lerpVectors(ref.start, ref.end, ref.progress);
        } else {
          ref.particle.visible = false;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize
    const handleResize = () => {
      if (!container || !canvas) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.clear();
      document.body.style.cursor = 'default';
    };
  }, [filteredNodes3D, filteredNodes3DMap, connections, selectedNodes, animationSettings, toggleComparison, isStructure, isIsolated, focusOnNode, focusedNodeId]);

  if (loading && nodes.length === 0) {
    return <LoadingSpinner />;
  }

  if (error && nodes.length === 0) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  return (
    <div className="h-screen h-[100dvh] bg-slate-950 overflow-hidden flex flex-col relative">
      {/* Ambient Dynamic Background Glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000 ease-out"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${ambientColor}22 0%, #020617 80%)`,
          zIndex: 0
        }}
      />

      <Header
        lastUpdate={lastUpdate}
        onOpenSettings={() => setIsSettingsOpen(true)}
        selectedCount={selectedNodes.size}
        onClearSelection={clearSelection}
        viewMode={viewMode}
        onViewModeSwitch={onViewModeSwitch}
      />

      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 w-full z-10"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block focus:outline-none bg-transparent"
        />

        {/* Imperative HTML projection labels overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          {projectedLabels.map(label => {
            if (!label.visible) return null;

            // Highlight label on hover or search focus
            const isHovered = hoveredNodeId === label.id;
            const isFocused = focusedNodeId === label.id;

            return (
              <div
                key={label.id}
                className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-all duration-300"
                style={{
                  transform: `translate3d(${label.x}px, ${label.y - 25}px, 0) scale(${isHovered || isFocused ? 1.05 : 0.85})`,
                  opacity: label.opacity,
                  zIndex: isHovered || isFocused ? 50 : 10
                }}
              >
                <div
                  onClick={() => focusOnNode(label.id)}
                  className="bg-slate-900 bg-opacity-80 backdrop-blur-md border border-slate-700/80 px-3 py-1 rounded-lg flex flex-col items-center shadow-lg hover:border-blue-500 cursor-pointer select-none"
                  style={{
                    boxShadow: isHovered || isFocused ? `0 0 15px ${label.color}44` : 'none',
                    borderColor: isHovered || isFocused ? label.color : 'rgba(71, 85, 105, 0.8)'
                  }}
                >
                  <span className="text-white text-[11px] font-bold tracking-wide whitespace-nowrap">
                    {label.name}
                  </span>
                  <span className="text-gray-400 text-[8px] uppercase tracking-wider font-semibold">
                    {label.isHub ? 'Primary Hub' : label.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {loading && nodes.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white px-4 py-1 rounded-full text-xs font-bold animate-pulse z-20">
            UPDATING LIVE DATA...
          </div>
        )}

        {/* Anatomy Inspired Floating Interactive Tools */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {/* Instructions */}
          <div className="bg-slate-900 bg-opacity-90 backdrop-blur-md border border-slate-800 rounded-xl p-3 max-w-[200px] shadow-xl">
            <p className="text-white text-[11px] font-bold mb-2 flex items-center gap-1">
              <Compass size={13} className="text-blue-400" />
              3D VIEWPORT TOOLS
            </p>
            <div className="space-y-1 text-gray-400 text-[10px] font-medium leading-relaxed">
              <p>• Rotate: Left-click + Drag</p>
              <p>• Zoom: Scroll / Zoom button</p>
              <p>• Pan: Right-click + Drag</p>
              <p>• Click node labels to fly & focus</p>
            </div>
          </div>

          {/* Quick Action Button Drawer */}
          <div className="flex gap-1.5 bg-slate-900 bg-opacity-90 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 shadow-xl">
            {/* Isolate Toggle */}
            <button
              onClick={() => setIsIsolated(!isIsolated)}
              title={isIsolated ? "Show All Nodes" : "Isolate Selected/Hovered Cluster"}
              className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium ${
                isIsolated
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800'
              }`}
            >
              {isIsolated ? <EyeOff size={15} /> : <Eye size={15} />}
              <span>Isolate</span>
            </button>

            {/* Wireframe Structure Toggle */}
            <button
              onClick={() => setIsStructure(!isStructure)}
              title={isStructure ? "Show Solid Nodes" : "Show Mesh Wireframes"}
              className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium ${
                isStructure
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800'
              }`}
            >
              <Layers size={15} />
              <span>Structure</span>
            </button>

            {/* Reset Camera Focus */}
            <button
              onClick={() => focusOnNode(null)}
              title="Reset Viewport Camera"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs font-medium"
            >
              <RefreshCw size={15} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Floating Controls Overlays */}
        <LiveStatus
          nodeCount={nodes.length}
          connectionCount={connections.length}
          className="absolute top-4 right-4 z-10"
        />

        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 max-w-[calc(100%-32px)]">
          <Legend
            className="bg-gray-900 bg-opacity-90 backdrop-blur-sm border border-gray-700 rounded-lg p-3 w-full"
          />
          {/* Category Filter positioned vertically below the Legend panel */}
          <div className="flex items-center gap-1 sm:gap-2 bg-gray-900 bg-opacity-95 backdrop-blur-sm p-1.5 rounded-lg border border-gray-700 overflow-x-auto max-w-full">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 text-[10px] sm:text-xs rounded-md transition-all whitespace-nowrap font-medium ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Tooltip data={tooltip} />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
        animationSettings={animationSettings}
        setAnimationSettings={setAnimationSettings}
        onResetLayout={() => {}}
        onExportJson={() => {}}
        onExportPng={() => {}}
      />

      <ComparisonPanel
        selectedNodes={selectedNodeData}
        onClear={clearSelection}
      />

      <ChartModal
        node={activeChartNode}
        onClose={() => setActiveChartNode(null)}
        onAddToComparison={toggleComparison}
      />
    </div>
  );
};
