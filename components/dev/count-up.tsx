/** The invisible final value reserves the exact space throughout the count. */
export default function CountUp({ value }: { value: number }) {
  return <span className="ds-counter">
    <span className="ds-counter-reserve">{value}</span>
    <span className="ds-counter-value" data-count-to={value} aria-hidden="true">{value}</span>
  </span>;
}
