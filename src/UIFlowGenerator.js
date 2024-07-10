import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { 
  ReactFlowProvider, 
  useNodesState, 
  useEdgesState,
  Controls,
  Handle,
  Position,
  Background,
  MiniMap
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

const CustomNode = ({ data }) => (
  <div style={{ 
    padding: '10px', 
    border: '1px solid #ddd', 
    borderRadius: '5px', 
    background: data.isDirectory ? '#f0f0f0' : 'white',
    fontSize: data.isDirectory ? '14px' : '12px',
    fontWeight: data.isDirectory ? 'bold' : 'normal'
  }}>
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
    setDebugInfo('Repository entered the drop zone');
  }, []);

  const onDragLeave = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);
    setDebugInfo('Repository left the drop zone');
  }, []);

  const isRelevantFile = (filename) => {
    const relevantExtensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.php', '.rb', '.py'];
    return relevantExtensions.some(ext => filename.endsWith(ext));
  };

  const shouldIgnoreDirectory = (dirName) => {
    const ignoredDirectories = ['node_modules', '.git', 'build', 'dist', 'public'];
    return ignoredDirectories.includes(dirName);
  };

  const parseRepository = async (entry, path = '') => {
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
          console.log(`Parsed ${filePath}:`, { imports, exports });
        }
      } else if (currentEntry.kind === 'directory' && !shouldIgnoreDirectory(currentEntry.name)) {
        for await (const handle of currentEntry.values()) {
          stack.push([handle, `${currentPath}/${currentEntry.name}`]);
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
    const directoryMap = new Map();
  
    // Create nodes and group by directories
    Object.entries(components).forEach(([file, data], index) => {
      const parts = file.split('/');
      const fileName = parts.pop();
      const directory = parts.join('/');
      
      const node = {
        id: index.toString(),
        type: 'custom',
        data: { label: fileName, fullPath: file },
        position: { x: 0, y: 0 }
      };
  
      if (!directoryMap.has(directory)) {
        directoryMap.set(directory, []);
      }
      directoryMap.get(directory).push(node);
      componentMap.set(file, node);
      newNodes.push(node);
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
  
    // Apply hierarchical layout
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', nodesep: 70, ranksep: 50 });
    g.setDefaultEdgeLabel(() => ({}));
  
    // Add directory nodes
    let yOffset = 0;
    directoryMap.forEach((nodes, directory) => {
      const dirNode = {
        id: `dir-${directory}`,
        type: 'custom',
        data: { label: directory, isDirectory: true },
        position: { x: 0, y: yOffset },
        style: { width: 180, height: 40, backgroundColor: '#f0f0f0', borderRadius: 5 }
      };
      g.setNode(dirNode.id, { width: 180, height: 40 });
      newNodes.push(dirNode);
  
      nodes.forEach((node, i) => {
        g.setNode(node.id, { width: 150, height: 40 });
        g.setEdge(dirNode.id, node.id);
      });
  
      yOffset += (nodes.length + 1) * 60;
    });
  
    newEdges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });
  
    dagre.layout(g);
  
    // Apply calculated positions
    newNodes.forEach((node) => {
      const nodeWithPosition = g.node(node.id);
      node.position = {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2
      };
    });
  
    setDebugInfo(`Generated ${newNodes.length} nodes and ${newEdges.length} edges`);
    setNodes(newNodes);
    setEdges(newEdges);
  };

  const processRepository = async (folderHandle) => {
    setDebugInfo(`Repository found: ${folderHandle.name}`);
    const components = await parseRepository(folderHandle);
    generateGraph(components);
  };

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
  }, []);

  const handleFileSelect = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker();
      await processRepository(dirHandle);
    } catch (error) {
      console.error('Error selecting directory:', error);
      setDebugInfo('Error selecting directory. Please try again.');
    }
  };

  useEffect(() => {
    if (nodes.length > 0 && edges.length > 0) {
      const layoutedNodes = getLayoutedElements(nodes, edges);
      setNodes(layoutedNodes);
    }
  }, []); // Only run once on mount
  const handleReset = () => {
    setNodes([]);
    setEdges([]);
    setDebugInfo('Graph reset. You can now upload a new repository.');
  };

  return (
    <div className="ui-flow-generator">
      <h2>UI Flow Generator</h2>
      <div className="flow-container" style={{ height: '70vh', width: '100%' }}>
        <ReactFlowProvider>
          {nodes.length === 0 ? (
            <div
              className="drop-zone"
              style={{
                border: isDragging ? '2px dashed #4a90e2' : '2px solid #ccc',
                background: isDragging ? '#e6f7ff' : '#f5f5f5',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column'
              }}
              onDragOver={onDragOver}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={handleFileSelect}
            >
              <p>Click here or drag and drop your repository folder here</p>
              <p className="debug-info">{debugInfo}</p>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
            >
              <Controls />
              <MiniMap />
              <Background color="#aaa" gap={16} />
            </ReactFlow>
          )}
        </ReactFlowProvider>
      </div>
      <div className="debug-info">{debugInfo}</div>
      {nodes.length > 0 && (
        <button className="reset-button" onClick={handleReset}>
          Reset Graph
        </button>
      )}
    </div>
  );
};

export default UIFlowGenerator;