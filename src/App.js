import React, { useState } from 'react';
import { Select, Button, Table, Slider, Checkbox, Typography } from 'antd';

const { Option } = Select;
const { Title } = Typography;

// Nodes (A–F) placed on a schematic canvas
const nodes = [
  { id: 'A', x: 100, y: 100 },
  { id: 'B', x: 300, y: 80 },
  { id: 'C', x: 200, y: 200 },
  { id: 'D', x: 400, y: 180 },
  { id: 'E', x: 350, y: 300 },
  { id: 'F', x: 500, y: 280 },
];

// Edges with terrain, material & labor cost, and distance
const edges = [
  { start: 'A', end: 'B', distance: 5, terrain: 1, materialCost: 70, laborCost: 40 },
  { start: 'A', end: 'C', distance: 7, terrain: 2, materialCost: 65, laborCost: 35 },
  { start: 'B', end: 'D', distance: 6, terrain: 1, materialCost: 80, laborCost: 45 },
  { start: 'C', end: 'D', distance: 3, terrain: 3, materialCost: 90, laborCost: 50 },
  { start: 'C', end: 'E', distance: 4, terrain: 2, materialCost: 55, laborCost: 25 },
  { start: 'D', end: 'F', distance: 8, terrain: 1, materialCost: 60, laborCost: 30 },
  { start: 'E', end: 'F', distance: 5, terrain: 2, materialCost: 75, laborCost: 40 },
];

// Calculate edge cost
const calculateEdgeCost = edge =>
  edge.distance * (edge.materialCost + edge.laborCost);

// Dijkstra's algorithm using edge cost
function dijkstra(nodes, edges, source, destination, terrainFilter, maxCost) {
  const graph = {};
  nodes.forEach(n => graph[n.id] = []);

  edges.forEach(edge => {
    if (terrainFilter(edge) && calculateEdgeCost(edge) <= maxCost) {
      graph[edge.start].push({ node: edge.end, cost: calculateEdgeCost(edge), edge });
      graph[edge.end].push({ node: edge.start, cost: calculateEdgeCost(edge), edge });
    }
  });

  const costs = {};
  const previous = {};
  const unvisited = new Set(nodes.map(n => n.id));

  nodes.forEach(n => costs[n.id] = Infinity);
  costs[source] = 0;

  while (unvisited.size > 0) {
    let current = null;
    let min = Infinity;

    unvisited.forEach(n => {
      if (costs[n] < min) {
        min = costs[n];
        current = n;
      }
    });

    if (current === null || current === destination) break;

    unvisited.delete(current);

    for (const neighbor of graph[current]) {
      if (!unvisited.has(neighbor.node)) continue;
      const newCost = costs[current] + neighbor.cost;
      if (newCost < costs[neighbor.node]) {
        costs[neighbor.node] = newCost;
        previous[neighbor.node] = { from: current, edge: neighbor.edge };
      }
    }
  }

  let path = [];
  let current = destination;
  while (previous[current]) {
    path.unshift(previous[current].edge);
    current = previous[current].from;
  }

  return { path, cost: costs[destination] };
}

export default function App() {
  const [source, setSource] = useState(null);
  const [destination, setDestination] = useState(null);
  const [terrainFilterEnabled, setTerrainFilterEnabled] = useState(false);
  const [maxTerrain, setMaxTerrain] = useState(3);
  const [maxCost, setMaxCost] = useState(10000);
  const [route, setRoute] = useState({ path: [], cost: 0 });

  const terrainFilter = edge =>
    !terrainFilterEnabled || edge.terrain <= maxTerrain;

  const calculateRoute = () => {
    if (!source || !destination) return;
    const result = dijkstra(nodes, edges, source, destination, terrainFilter, maxCost);
    setRoute(result);
  };

  const columns = [
    { title: 'Start', dataIndex: 'start', key: 'start' },
    { title: 'End', dataIndex: 'end', key: 'end' },
    { title: 'Distance', dataIndex: 'distance', key: 'distance' },
    { title: 'Terrain', dataIndex: 'terrain', key: 'terrain' },
    { title: 'Material Cost/km', dataIndex: 'materialCost', key: 'materialCost' },
    { title: 'Labor Cost/km', dataIndex: 'laborCost', key: 'laborCost' },
    {
      title: 'Edge Cost',
      key: 'cost',
      render: (_, record) => `₹ ${calculateEdgeCost(record).toFixed(2)*100}`
    }
  ];

  return (
    <div className="app-container">
      <Title level={2} style={{ textAlign: 'center' }}>
        Optimized Gas Pipeline Installation System
      </Title>

      <div className="controls">
        <Select
          placeholder="Source node"
          style={{ width: 150 }}
          onChange={setSource}
          value={source}
          options={nodes.map(n => ({ value: n.id, label: n.id }))}
        />
        <Select
          placeholder="Destination node"
          style={{ width: 150 }}
          onChange={setDestination}
          value={destination}
          options={nodes.map(n => ({ value: n.id, label: n.id }))}
        />
        <Button type="primary" onClick={calculateRoute}>
          Calculate Minimum Cost Route
        </Button>
      </div>

      <div className="filters">
        <Checkbox
          checked={terrainFilterEnabled}
          onChange={e => setTerrainFilterEnabled(e.target.checked)}
        >
          Filter by max terrain difficulty (≤ {maxTerrain})
        </Checkbox>
        {terrainFilterEnabled && (
          <Slider
            min={1}
            max={3}
            value={maxTerrain}
            onChange={setMaxTerrain}
            style={{ width: 200, marginLeft: 10 }}
          />
        )}
        <span style={{ marginLeft: 20 }}>Max edge cost: ₹ {maxCost*100}</span>
        <Slider
          min={0}
          max={2000}
          step={10}
          value={maxCost}
          onChange={setMaxCost}
          style={{ width: 200, marginLeft: 10 }}
        />
      </div>

      <div className="graph-container">
        <svg width={600} height={400}>
          {edges.map((edge, idx) => {
            const inRoute = route.path.find(
              e => (e.start === edge.start && e.end === edge.end) ||
                   (e.start === edge.end && e.end === edge.start)
            );
            const color = inRoute ? '#f5222d' : '#aaa';
            const width = inRoute ? 5 : 2;

            const start = nodes.find(n => n.id === edge.start);
            const end = nodes.find(n => n.id === edge.end);

            return (
              <line
                key={idx}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={color}
                strokeWidth={width}
              />
            );
          })}

          {nodes.map(node => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={20}
                fill={node.id === source ? '#1890ff' : node.id === destination ? '#52c41a' : '#ddd'}
                stroke="#555"
                strokeWidth={2}
              />
              <text
                x={node.x}
                y={node.y + 6}
                textAnchor="middle"
                fontSize="16"
                fontWeight="bold"
              >
                {node.id}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="route-info">
        <h3>Route Details</h3>
        {route.path.length === 0 ? (
          <p>No route calculated yet.</p>
        ) : (
          <>
            <p><b>Total Minimum Cost:</b> ₹ {route.cost.toFixed(2)*100}</p>
            <Table
              columns={columns}
              dataSource={route.path}
              rowKey={(r, idx) => idx}
              pagination={false}
              size="small"
            />
          </>
        )}
      </div>
    </div>
  );
}
