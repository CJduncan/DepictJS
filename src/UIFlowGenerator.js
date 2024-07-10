import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { 
  ReactFlowProvider, 
  useNodesState, 
  useEdgesState,
  Controls,
  Handle,
  Position
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

const CustomNode = ({ data }) => (
  <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', background: 'white' }}>
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
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      }
    };
  });
};

const UIFlowGenerator = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDragEnter = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
    setDebugInfo('Folder entered the drop zone');
  }, []);

  const onDragLeave = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);
    setDebugInfo('Folder left the drop zone');
  }, []);

  const parseNextJSFiles = async (entry) => {
    setDebugInfo('Parsing files...');
    const components = {};
    const stack = [entry];

    while (stack.length > 0) {
      const entry = stack.pop();
      if (entry.kind === 'file') {
        if (entry.name.match(/\.(js|jsx|ts|tsx)$/)) {
          const file = await entry.getFile();
          const content = await file.text();
          const imports = Array.from(content.matchAll(/import\s+(?:(?:\{[^}]+\}|\S+)\s+from\s+)?['"]([^'"]+)['"]/g)).map(match => match[1]);
          const exports = Array.from(content.matchAll(/export\s+(default\s+)?(?:function|class|const)\s+(\w+)/g)).map(match => match[2]);
          components[entry.name] = { imports, exports };
          console.log(`Parsed ${entry.name}:`, { imports, exports });
        }
      } else if (entry.kind === 'directory') {
        for await (const handle of entry.values()) {
          stack.push(handle);
        }
      }
    }

    setDebugInfo(`Parsed ${Object.keys(components).length} components`);
    console.log('Parsed components:', components);
    return components;
  };

  const generateGraph = (components) => {
    setDebugInfo('Generating graph...');
    let newNodes = [];
    let newEdges = [];
    const componentMap = new Map();

    // Create nodes
    Object.entries(components).forEach(([file, data], index) => {
      const node = {
        id: index.toString(),
        type: 'custom',
        data: { label: file },
        position: { x: 0, y: 0 }
      };
      newNodes.push(node);
      componentMap.set(file, node);
    });

    // Create edges
    Object.entries(components).forEach(([file, data], sourceIndex) => {
      data.imports.forEach((imp, importIndex) => {
        const targetNode = Array.from(componentMap.entries()).find(([key, value]) => {
          const importName = imp.replace(/^\.\//, '');
          return key.includes(importName) || importName.includes(key.replace(/\.(js|jsx|ts|tsx)$/, ''));
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

    // Apply layout
    const layoutedNodes = getLayoutedElements(newNodes, newEdges);

    setDebugInfo(`Generated ${layoutedNodes.length} nodes and ${newEdges.length} edges`);
    setNodes(layoutedNodes);
    setEdges(newEdges);
  };

  const onDrop = useCallback(async (event) => {
    event.preventDefault();
    setIsDragging(false);
    setDebugInfo('Folder dropped');

    const items = event.dataTransfer.items;
    if (items) {
      setDebugInfo(`Number of items: ${items.length}`);
      const entries = await Promise.all(
        Array.from(items).map(item => item.getAsFileSystemHandle())
      );
      setDebugInfo(`Entries: ${entries.map(e => e.name).join(', ')}`);
      const folderEntry = entries.find(entry => entry.kind === 'directory');
      if (folderEntry) {
        setDebugInfo(`Folder found: ${folderEntry.name}`);
        const components = await parseNextJSFiles(folderEntry);
        generateGraph(components);
      } else {
        setDebugInfo('No folder found in the dropped items');
      }
    }
  }, []);

  useEffect(() => {
    if (nodes.length > 0 && edges.length > 0) {
      const layoutedNodes = getLayoutedElements(nodes, edges);
      setNodes(layoutedNodes);
    }
  }, []); // Only run once on mount

  return (
    <div style={{ width: '100vw', height: '100vh', padding: '20px' }}>
      <ReactFlowProvider>
        <div
          style={{
            width: '100%',
            height: '100%',
            border: isDragging ? '2px dashed #4a90e2' : '2px solid #ccc',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '20px',
            color: '#666',
            background: isDragging ? '#e6f7ff' : '#f5f5f5',
            transition: 'all 0.3s ease'
          }}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {nodes.length === 0 ? (
            <>
              <p>Drag and drop your Next.js project folder here</p>
              <p style={{ fontSize: '14px', marginTop: '10px' }}>{debugInfo}</p>
            </>
          ) : (
            <>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
              >
                <Controls />
              </ReactFlow>
              <div style={{ position: 'absolute', bottom: 10, left: 10, fontSize: '12px' }}>
                {debugInfo}
              </div>
            </>
          )}
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default UIFlowGenerator;