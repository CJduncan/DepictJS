import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, { 
  ReactFlowProvider, 
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  useReactFlow,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

const CustomNode = ({ data }) => (
  <div style={data.style}>
    <Handle type="target" position={Position.Top} />
    <div>{data.label}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const nodeTypes = {
  custom: CustomNode,
};

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 172;
  const nodeHeight = 36;

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 70, ranksep: 70 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
      style: {
        width: nodeWidth,
        height: nodeHeight,
        backgroundColor: '#f0f0f0',
        border: '1px solid #999',
        borderRadius: '5px',
        padding: '5px',
        fontSize: '12px',
      },
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
    };
  });

  const layoutedEdges = edges.map((edge) => ({
    ...edge,
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#555' },
  }));

  return { nodes: layoutedNodes, edges: layoutedEdges };
};

const Flow = ({ nodes, edges, onNodesChange, onEdgesChange, onInit }) => {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      onInit={onInit}
    >
      <Controls />
      <Background color="#aaa" gap={16} />
    </ReactFlow>
  );
};

const UIFlowGenerator = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [maxDepth, setMaxDepth] = useState(1);
  const [currentDepth, setCurrentDepth] = useState(1);
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDragEnter = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
    setDebugInfo('Repository entered the drop zone');
  }, []);

  const onDragLeave = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);
    setDebugInfo('Repository left the drop zone');
  }, []);

  const isRelevantFile = useCallback((filename) => {
    const relevantExtensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.php', '.rb', '.py'];
    return relevantExtensions.some(ext => filename.endsWith(ext));
  }, []);

  const shouldIgnoreDirectory = useCallback((dirName) => {
    const ignoredDirectories = ['node_modules', '.git', 'build', 'dist', 'public'];
    return ignoredDirectories.includes(dirName);
  }, []);

  const parseRepository = useCallback(async (entry, path = '') => {
    const components = {};
    const stack = [[entry, path]];

    while (stack.length > 0) {
      const [currentEntry, currentPath] = stack.pop();

      if (currentEntry.kind === 'file') {
        if (isRelevantFile(currentEntry.name)) {
          const file = await currentEntry.getFile();
          const content = await file.text();
          const imports = Array.from(content.matchAll(/import\s+(?:(?:\{[^}]+\}|\S+)\s+from\s+)?['"]([^'"]+)['"]/g)).map(match => match[1]);
          const exports = Array.from(content.matchAll(/export\s+(default\s+)?(?:function|class|const)\s+(\w+)/g)).map(match => match[2]);
          const filePath = `${currentPath}/${currentEntry.name}`;
          components[filePath] = { imports, exports };
        }
      } else if (currentEntry.kind === 'directory' && !shouldIgnoreDirectory(currentEntry.name)) {
        for await (const handle of currentEntry.values()) {
          stack.push([handle, `${currentPath}/${currentEntry.name}`]);
        }
      }
    }

    setDebugInfo(`Parsed ${Object.keys(components).length} components`);
    return components;
  }, [isRelevantFile, shouldIgnoreDirectory]);

  const calculateDepth = useCallback((nodes, edges) => {
    const nodeDepths = {};
    const rootNodes = nodes.filter(node => !edges.some(edge => edge.target === node.id));

    const assignDepth = (nodeId, depth) => {
      if (!nodeDepths[nodeId] || depth < nodeDepths[nodeId]) {
        nodeDepths[nodeId] = depth;
        const childEdges = edges.filter(edge => edge.source === nodeId);
        childEdges.forEach(edge => assignDepth(edge.target, depth + 1));
      }
    };

    rootNodes.forEach(node => assignDepth(node.id, 1));

    return { maxDepth: Math.max(...Object.values(nodeDepths)), nodeDepths };
  }, []);

  const generateGraph = useCallback((components) => {
    setDebugInfo('Generating graph...');
    let newNodes = [];
    let newEdges = [];
    const componentMap = new Map();
  
    // Create nodes
    Object.entries(components).forEach(([file, data], index) => {
      const fileName = file.split('/').pop();
      const node = {
        id: index.toString(),
        type: 'custom',
        data: { 
          label: fileName,
          fullPath: file,
        },
        position: { x: 0, y: 0 }
      };
      newNodes.push(node);
      componentMap.set(file, node);
    });
  
    // Create edges
    Object.entries(components).forEach(([file, data], sourceIndex) => {
      data.imports.forEach((imp, importIndex) => {
        const targetNode = Array.from(componentMap.entries()).find(([key, value]) => {
          const importName = imp.replace(/^\.\//, '').replace(/^\.\.\//, '');
          return key.includes(importName) || importName.includes(key.replace(/\.(js|jsx|ts|tsx|vue|php|rb|py)$/, ''));
        });
        
        if (targetNode) {
          const edgeId = `e${sourceIndex}-${targetNode[1].id}-${importIndex}`;
          newEdges.push({
            id: edgeId,
            source: sourceIndex.toString(),
            target: targetNode[1].id,
          });
        }
      });
    });
  
    // Filter out isolated nodes
    const connectedNodeIds = new Set(newEdges.flatMap(edge => [edge.source, edge.target]));
    newNodes = newNodes.filter(node => connectedNodeIds.has(node.id));
  
    // Recalculate node IDs to be consecutive
    const oldToNewIdMap = {};
    newNodes = newNodes.map((node, index) => {
      oldToNewIdMap[node.id] = index.toString();
      return {
        ...node,
        id: index.toString()
      };
    });
  
    // Update edge references to use new node IDs
    newEdges = newEdges.filter(edge => 
      oldToNewIdMap[edge.source] !== undefined && 
      oldToNewIdMap[edge.target] !== undefined
    ).map(edge => ({
      ...edge,
      source: oldToNewIdMap[edge.source],
      target: oldToNewIdMap[edge.target]
    }));
  
    // Calculate depth for each node
    const { maxDepth, nodeDepths } = calculateDepth(newNodes, newEdges);
    setMaxDepth(maxDepth);
    setCurrentDepth(maxDepth);
  
    newNodes = newNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        depth: nodeDepths[node.id] || 1
      }
    }));
  
    // Apply layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);
  
    setDebugInfo(`Generated ${layoutedNodes.length} nodes and ${layoutedEdges.length} edges`);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [calculateDepth, setNodes, setEdges, getLayoutedElements]);

  const processRepository = useCallback(async (folderHandle) => {
    setDebugInfo(`Repository found: ${folderHandle.name}`);
    const components = await parseRepository(folderHandle);
    generateGraph(components);
  }, [parseRepository, generateGraph]);

  const onDrop = useCallback(async (event) => {
    event.preventDefault();
    setIsDragging(false);
    setDebugInfo('Repository dropped');

    const items = event.dataTransfer.items;
    if (items) {
      setDebugInfo(`Number of items: ${items.length}`);
      const entries = await Promise.all(
        Array.from(items).map(item => item.getAsFileSystemHandle())
      );
      setDebugInfo(`Entries: ${entries.map(e => e.name).join(', ')}`);
      const folderEntry = entries.find(entry => entry.kind === 'directory');
      if (folderEntry) {
        await processRepository(folderEntry);
      } else {
        setDebugInfo('No repository folder found in the dropped items');
      }
    }
  }, [processRepository]);

  const handleFileSelect = useCallback(async () => {
    try {
      const dirHandle = await window.showDirectoryPicker();
      await processRepository(dirHandle);
    } catch (error) {
      console.error('Error selecting directory:', error);
      setDebugInfo('Error selecting directory. Please try again.');
    }
  }, [processRepository]);

  const updateNodesVisibility = useCallback((depth) => {
    setNodes(prevNodes => prevNodes.map(node => ({
      ...node,
      hidden: node.data.depth > depth,
    })));

    setEdges(prevEdges => prevEdges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      return {
        ...edge,
        hidden: sourceNode.data.depth > depth || targetNode.data.depth > depth,
      };
    }));
  }, [setNodes, setEdges, nodes]);

  useEffect(() => {
    if (nodes.length > 0) {
      updateNodesVisibility(currentDepth);
    }
  }, [currentDepth, nodes, updateNodesVisibility]);

  const onInit = useCallback((instance) => {
  setReactFlowInstance(instance);
}, []);

  const exportImage = useCallback(() => {
    if (!reactFlowInstance) {
      console.error('React Flow instance is not available');
      setDebugInfo('Error: React Flow instance is not available');
      return;
    }
  
    const { nodes, edges, viewport } = reactFlowInstance.toObject();
    const visibleNodes = nodes.filter(node => !node.hidden);
    const visibleEdges = edges.filter(edge => !edge.hidden);
  
    if (visibleNodes.length === 0) {
      console.error('No visible nodes to export');
      setDebugInfo('Error: No visible nodes to export');
      return;
    }
  
    // Calculate the bounding box
    const padding = 40;
    const bbox = visibleNodes.reduce(
      (acc, node) => ({
        minX: Math.min(acc.minX, node.position.x),
        minY: Math.min(acc.minY, node.position.y),
        maxX: Math.max(acc.maxX, node.position.x + (node.width || 172)),
        maxY: Math.max(acc.maxY, node.position.y + (node.height || 36)),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );
  
    const width = bbox.maxX - bbox.minX + padding * 2;
    const height = bbox.maxY - bbox.minY + padding * 2;
  
    // Create SVG
    const svgNS = "http://www.w3.org/2000/svg";
    const svgElement = document.createElementNS(svgNS, "svg");
    svgElement.setAttribute("width", width);
    svgElement.setAttribute("height", height);
    svgElement.setAttribute("viewBox", `${bbox.minX - padding} ${bbox.minY - padding} ${width} ${height}`);
  
    // Add edges
    visibleEdges.forEach(edge => {
      const path = document.createElementNS(svgNS, "path");
      const sourceNode = visibleNodes.find(n => n.id === edge.source);
      const targetNode = visibleNodes.find(n => n.id === edge.target);
      if (sourceNode && targetNode) {
        const sx = sourceNode.position.x + (sourceNode.width || 172) / 2;
        const sy = sourceNode.position.y + (sourceNode.height || 36);
        const tx = targetNode.position.x + (targetNode.width || 172) / 2;
        const ty = targetNode.position.y;
        path.setAttribute("d", `M${sx},${sy} C${sx},${(sy + ty) / 2} ${tx},${(sy + ty) / 2} ${tx},${ty}`);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#555");
        svgElement.appendChild(path);
      }
    });
  
    // Add nodes
    visibleNodes.forEach(node => {
      const group = document.createElementNS(svgNS, "g");
      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("x", node.position.x);
      rect.setAttribute("y", node.position.y);
      rect.setAttribute("width", node.width || 172);
      rect.setAttribute("height", node.height || 36);
      rect.setAttribute("fill", "#f0f0f0");
      rect.setAttribute("stroke", "#999");
      rect.setAttribute("rx", "5");
  
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", node.position.x + (node.width || 172) / 2);
      text.setAttribute("y", node.position.y + (node.height || 36) / 2);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("font-size", "12px");
      text.textContent = node.data.label;
  
      group.appendChild(rect);
      group.appendChild(text);
      svgElement.appendChild(group);
    });
  
    // Convert to SVG string and download
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(svgBlob);
    link.download = "flow-diagram.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  
    setDebugInfo('SVG exported successfully');
  }, [reactFlowInstance]);

  return (
    <div className="ui-flow-generator">
      <ReactFlowProvider>
        <div className="controls">
          <div className="depth-slider">
            <label htmlFor="depthSlider">Hierarchy Level: {currentDepth}</label>
            <input 
              id="depthSlider"
              type="range"
              min="1"
              max={maxDepth}
              value={currentDepth}
              onChange={(e) => setCurrentDepth(parseInt(e.target.value))}
            />
          </div>
          {nodes.length > 0 && (
            <button onClick={exportImage} className="export-button">
            Export as SVG
            </button>
          )}
        </div>
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={handleFileSelect}
          ref={reactFlowWrapper}
          style={{ width: '100%', height: '500px' }}
        >
          {nodes.length === 0 ? (
            <>
              <p>Click here or drag and drop your repository folder here</p>
              <p className="debug-info">{debugInfo}</p>
            </>
          ) : (
            <Flow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onInit={onInit}
            />
          )}
        </div>
        <div className="debug-info">{debugInfo}</div>
      </ReactFlowProvider>
    </div>
  );
};

export default UIFlowGenerator;