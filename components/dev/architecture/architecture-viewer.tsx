"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { DevArchitecture } from "@/data/dev";
import ArchitectureDetails from "./architecture-details";
import ArchitectureIcon from "./architecture-icon";

type View = { x: number; y: number; scale: number };
type Line = { path: string; x: number; y: number };

export default function ArchitectureViewer({ architecture }: { architecture: DevArchitecture }) {
  const columns = Math.max(...architecture.nodes.map(node => node.column));
  const rows = Math.max(...architecture.nodes.map(node => node.row));
  const WIDTH = columns * 194 + 30;
  const HEIGHT = rows * 127 + 30;
  const [selected, setSelected] = useState(architecture.defaultNode);
  const [mobileView, setMobileView] = useState("canvas");
  const [view, setView] = useState<View>({ x: 0, y: 0, scale: 1 });
  const [lines, setLines] = useState<Line[]>([]);
  const viewport = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const drag = useRef<{ x: number; y: number; view: View } | null>(null);
  const marker = useId().replace(/:/g, "");
  const current = architecture.nodes.find(node => node.id === selected) ?? architecture.nodes[0];

  function fit() {
    if (!viewport.current) return;
    const { clientWidth: width, clientHeight: height } = viewport.current;
    const scale = Math.min(width / WIDTH, height / HEIGHT, 1);
    setView({ x: (width - WIDTH * scale) / 2, y: (height - HEIGHT * scale) / 2, scale });
  }

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      const { clientWidth: width, clientHeight: height } = element;
      if (!width || !height) return;
      const narrow = width < 600;
      const scale = narrow ? .9 : Math.min(width / WIDTH, height / HEIGHT, 1);
      const initial = nodeRefs.current[architecture.defaultNode];
      setView({ x: narrow && initial ? width / 2 - (initial.offsetLeft + initial.offsetWidth / 2) * scale : (width - WIDTH * scale) / 2, y: narrow && initial ? height / 2 - (initial.offsetTop + initial.offsetHeight / 2) * scale : (height - HEIGHT * scale) / 2, scale });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [architecture.defaultNode, WIDTH, HEIGHT]);

  useEffect(() => {
    function measure() {
      setLines(architecture.edges.map(edge => {
        const from = nodeRefs.current[edge.from], to = nodeRefs.current[edge.to];
        if (!from || !to) return { path: "", x: 0, y: 0 };
        const a = { x: from.offsetLeft, y: from.offsetTop, w: from.offsetWidth, h: from.offsetHeight };
        const b = { x: to.offsetLeft, y: to.offsetTop, w: to.offsetWidth, h: to.offsetHeight };
        if (a.y === b.y) {
          const right = a.x < b.x;
          const start = right ? a.x + a.w + 2 : a.x - 2;
          const end = right ? b.x - 5 : b.x + b.w + 5;
          return { path: `M${start} ${a.y + a.h / 2}H${end}`, x: (start + end) / 2, y: a.y - 9 };
        }
        const down = a.y < b.y;
        const startY = down ? a.y + a.h + 2 : a.y - 2;
        const endY = down ? b.y - 5 : b.y + b.h + 5;
        const startX = a.x + a.w / 2, endX = b.x + b.w / 2;
        if (edge.kind === "support") {
          const gutterX = a.x + a.w + 14;
          const bendY = down ? b.y - 15 : b.y + b.h + 15;
          return { path: `M${a.x + a.w + 2} ${a.y + a.h / 2}H${gutterX}V${bendY}H${endX}V${endY}`, x: (gutterX + endX) / 2, y: bendY - 7 };
        }
        const bendY = (startY + endY) / 2;
        return { path: `M${startX} ${startY}V${bendY}H${endX}V${endY}`, x: (startX + endX) / 2, y: bendY - 7 };
      }));
    }
    const observer = new ResizeObserver(measure);
    if (board.current) observer.observe(board.current);
    Object.values(nodeRefs.current).forEach(node => { if (node) observer.observe(node); });
    measure();
    return () => observer.disconnect();
  }, [architecture]);

  function zoom(factor: number) {
    const element = viewport.current;
    if (!element) return;
    setView(previous => {
      const scale = Math.max(.25, Math.min(2, previous.scale * factor));
      const ratio = scale / previous.scale;
      return { scale, x: element.clientWidth / 2 - (element.clientWidth / 2 - previous.x) * ratio, y: element.clientHeight / 2 - (element.clientHeight / 2 - previous.y) * ratio };
    });
  }

  function startPan(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button") || event.button !== 0) return;
    drag.current = { x: event.clientX, y: event.clientY, view };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function revealNode(id: string) {
    const node = nodeRefs.current[id], element = viewport.current;
    if (!node || !element) return;
    const scale = Math.max(view.scale, .85);
    setView({ scale, x: element.clientWidth / 2 - (node.offsetLeft + node.offsetWidth / 2) * scale, y: element.clientHeight / 2 - (node.offsetTop + node.offsetHeight / 2) * scale });
  }

  return <div className="av-viewer" data-mobile-view={mobileView} style={{ "--av-diagram-height": `${Math.min(340, HEIGHT)}px` } as CSSProperties}>
    <div className="av-mobile-switch" aria-label="Architecture view">
      <button type="button" aria-pressed={mobileView === "canvas"} onClick={() => setMobileView("canvas")}>Canvas</button>
      <button type="button" aria-pressed={mobileView === "details"} onClick={() => setMobileView("details")}>Details</button>
    </div>
    <section className="av-canvas" aria-label="System architecture">
      <div className="av-canvas-heading"><div><h3>System architecture</h3><p>{architecture.description}</p></div><div className="av-controls" aria-label="Diagram controls"><button type="button" onClick={() => zoom(.8)} aria-label="Zoom out">−</button><button type="button" onClick={fit}>Fit</button><button type="button" onClick={() => zoom(1.25)} aria-label="Zoom in">+</button></div></div>
      <div className="av-viewport" ref={viewport} onPointerDown={startPan} onPointerMove={event => { if (drag.current) setView({ ...drag.current.view, x: drag.current.view.x + event.clientX - drag.current.x, y: drag.current.view.y + event.clientY - drag.current.y }); }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
        <div className="av-board" ref={board} style={{ width: WIDTH, height: HEIGHT, gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0,1fr))`, transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
          <svg className="av-edges" width={WIDTH} height={HEIGHT} aria-hidden="true"><defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10Z" fill="currentColor"/></marker></defs>{architecture.edges.map((edge, index) => {
            const line = lines[index];
            const active = edge.from === selected || edge.to === selected;
            if (!line || (edge.kind === "support" && !active)) return null;
            return <g key={`${edge.from}-${edge.to}`} className={`av-edge av-edge-${edge.kind}${active ? " is-active" : ""}`}><path d={line.path} fill="none" markerEnd={`url(#${marker})`}/>{edge.label && <text x={line.x} y={line.y} textAnchor="middle">{edge.label}</text>}</g>;
          })}</svg>
          {architecture.nodes.map(node => <button key={node.id} ref={element => { nodeRefs.current[node.id] = element; }} type="button" className={`av-node av-node-${node.category}${node.id === selected ? " is-selected" : ""}`} style={{ gridColumn: node.column, gridRow: node.row }} aria-pressed={node.id === selected} aria-label={`${node.title}: ${node.subtitle}. Show details`} onFocus={event => { setSelected(node.id); if (event.currentTarget.matches(":focus-visible")) revealNode(node.id); }} onClick={() => setSelected(node.id)}><ArchitectureIcon name={node.icon}/><strong>{node.title}</strong><span>{node.subtitle}</span></button>)}
        </div>
      </div>
      <div className="av-legend"><span><i/>Runtime path</span>{architecture.edges.some(edge => edge.kind === "response") && <span><i className="av-dashed"/>Response</span>}{architecture.edges.some(edge => edge.kind === "support") && <span>Support connections appear on selection</span>}</div>
      <label className="av-node-picker">Select component<select value={selected} onChange={event => { setSelected(event.target.value); revealNode(event.target.value); }}>{architecture.nodes.map(node => <option key={node.id} value={node.id}>{node.title}</option>)}</select></label>
    </section>
    <ArchitectureDetails node={current}/>
    <p className="av-sr" aria-live="polite">Selected component: {current.title}</p>
  </div>;
}
