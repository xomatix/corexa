import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
} from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from "reactflow";
import "reactflow/dist/style.css";

import MathNode from "./nodes/MathNode";
import VarNode from "./nodes/VarNode";

const nodeTypes = {
  math: MathNode,
  var: VarNode,
};

function topologicalSort(nodes, edges) {
  // Build adjacency and in-degree
  const idToNode = new Map(nodes.map((n) => [n.id, n]));
  const incoming = new Map(nodes.map((n) => [n.id, 0]));
  const adj = new Map(nodes.map((n) => [n.id, []]));

  edges.forEach((e) => {
    const from = e.source;
    const to = e.target;
    if (!incoming.has(to)) incoming.set(to, 0);
    incoming.set(to, (incoming.get(to) || 0) + 1);
    if (!adj.has(from)) adj.set(from, []);
    adj.get(from).push(to);
  });

  const queue = [];
  incoming.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const order = [];
  while (queue.length) {
    const id = queue.shift();
    order.push(id);
    const neighbors = adj.get(id) || [];
    neighbors.forEach((nbr) => {
      incoming.set(nbr, incoming.get(nbr) - 1);
      if (incoming.get(nbr) === 0) queue.push(nbr);
    });
  }
  return order.map((id) => idToNode.get(id)).filter(Boolean);
}

function evaluateGraph(nodes, edges, initialStore) {
  // Execution context
  const store = JSON.parse(JSON.stringify(initialStore || {}));
  const values = new Map(); // nodeId -> output value (single)

  // Build port mapping: targetHandle => source node id
  const inbound = new Map(); // targetNodeId -> { handleId: sourceNodeId }
  edges.forEach((e) => {
    const map = inbound.get(e.target) || {};
    map[e.targetHandle || "default"] = {
      nodeId: e.source,
      handle: e.sourceHandle || "default",
    };
    inbound.set(e.target, map);
  });

  //   const byId = new Map(nodes.map((n) => [n.id, n]));
  const sorted = topologicalSort(nodes, edges);

  const evalNode = (node) => {
    if (node.type === "var") {
      const mode = node.data?.mode || "read"; // read: output from store; write: write from input to store
      const key = node.data?.key || "";
      if (mode === "read") {
        const val = store[key];
        values.set(node.id, val);
      } else {
        // write mode expects an input connected providing a value
        const inboundMap = inbound.get(node.id) || {};
        const input = inboundMap["in"]
          ? values.get(inboundMap["in"].nodeId)
          : undefined;
        if (key) store[key] = input;
        values.set(node.id, input);
      }
      return;
    }

    if (node.type === "math") {
      const op = node.data?.op || "+";
      const inboundMap = inbound.get(node.id) || {};
      const a = inboundMap["a"]
        ? values.get(inboundMap["a"].nodeId)
        : node.data?.a ?? 0;
      const b = inboundMap["b"]
        ? values.get(inboundMap["b"].nodeId)
        : node.data?.b ?? 0;
      let out = NaN;
      const na = Number(a);
      const nb = Number(b);
      switch (op) {
        case "+":
          out = na + nb;
          break;
        case "-":
          out = na - nb;
          break;
        case "*":
          out = na * nb;
          break;
        case "/":
          out = nb === 0 ? NaN : na / nb;
          break;
        default:
          out = NaN;
      }
      values.set(node.id, out);
      return;
    }

    // default passthrough
    values.set(node.id, undefined);
  };

  // Evaluate nodes in order
  sorted.forEach((n) => evalNode(n));

  return store;
}

const FlowCanvas = forwardRef(function FlowCanvas(_, ref) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params }, eds)),
    []
  );

  const addMathNode = (op = "+") => {
    const id = crypto.randomUUID();
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "math",
        position: { x: 250, y: 100 },
        data: { op, a: 0, b: 0 },
      },
    ]);
  };

  const addVarNode = (mode = "read") => {
    const id = crypto.randomUUID();
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "var",
        position: { x: 100, y: 100 },
        data: { key: "", mode },
      },
    ]);
  };

  // API for parent
  useImperativeHandle(ref, () => ({
    execute(store) {
      return Promise.resolve(evaluateGraph(nodes, edges, store));
    },
    exportLogic() {
      return { nodes, edges };
    },
    importLogic(data) {
      if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
        alert("Invalid logic JSON");
        return;
      }
      setNodes(data.nodes);
      setEdges(data.edges);
    },
  }));

  const nodeTypesMemo = useMemo(() => nodeTypes, []);

  return (
    <div style={{ height: "100%" }}>
      <div
        style={{
          padding: 8,
          borderBottom: "1px solid #ddd",
          display: "flex",
          gap: 8,
        }}
      >
        <span>Add:</span>
        <button onClick={() => addVarNode("read")}>Var Read ➜</button>
        <button onClick={() => addVarNode("write")}>➜ Var Write</button>
        <button onClick={() => addMathNode("+")}>Math +</button>
        <button onClick={() => addMathNode("-")}>Math -</button>
        <button onClick={() => addMathNode("*")}>Math *</button>
        <button onClick={() => addMathNode("/")}>Math /</button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypesMemo}
        fitView
      >
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
});

export default FlowCanvas;
