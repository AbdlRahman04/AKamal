import type { ArchitectureNode } from "@/data/dev";
import ArchitectureIcon from "./architecture-icon";

export default function ArchitectureDetails({ node }: { node: ArchitectureNode }) {
  return <aside className="av-details" aria-label="Selected component details" tabIndex={0}>
    <p className="av-detail-label">Architecture details</p>
    <div className="av-detail-heading"><ArchitectureIcon name={node.icon}/><h3>{node.title}</h3></div>
    <p className="av-technology">{node.technology}</p>
    <h4>Responsibilities</h4><ul>{node.responsibilities.map(item => <li key={item}>{item}</li>)}</ul>
    {node.endpoints?.length ? <><h4>API interface</h4><ul className="av-endpoints">{node.endpoints.map(item => <li key={item}><code>{item}</code></li>)}</ul></> : null}
    {node.notes?.length ? <><h4>Implementation notes</h4>{node.notes.map(item => <p className="av-note" key={item}>{item}</p>)}</> : null}
  </aside>;
}
