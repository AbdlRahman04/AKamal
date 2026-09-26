const RATIO_PRESETS = [
  { value: "9/16", ratio: 9 / 16 },
  { value: "2/3", ratio: 2 / 3 },
  { value: "3/4", ratio: 3 / 4 },
  { value: "4/5", ratio: 4 / 5 },
  { value: "1/1", ratio: 1 },
  { value: "4/3", ratio: 4 / 3 },
  { value: "3/2", ratio: 3 / 2 },
  { value: "16/9", ratio: 16 / 9 },
];

function trimNumber(value) {
  return Number(value.toFixed(2)).toString();
}

/** Map an image's intrinsic dimensions to the closest editorial frame. */
export function inferAspectRatio(width, height) {
  if (!width || !height) return undefined;

  const ratio = width / height;
  const nearest = RATIO_PRESETS.reduce((best, preset) => (
    Math.abs(preset.ratio - ratio) < Math.abs(best.ratio - ratio) ? preset : best
  ));

  if (Math.abs(nearest.ratio - ratio) / nearest.ratio <= 0.08) return nearest.value;
  return `${trimNumber(ratio)}/1`;
}

export function inferOrientation(width, height) {
  if (!width || !height) return undefined;
  const ratio = width / height;
  if (ratio > 1.05) return "landscape";
  if (ratio < 0.95) return "portrait";
  return "square";
}

export function normalizeFocalPoint(value) {
  if (value === undefined || value === null || value === "") return undefined;

  let point = value;
  if (typeof point === "string") {
    try {
      point = JSON.parse(point);
    } catch {
      return undefined;
    }
  }

  const x = Number(point?.x);
  const y = Number(point?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;

  return {
    x: Math.min(100, Math.max(0, Math.round(x))),
    y: Math.min(100, Math.max(0, Math.round(y))),
  };
}
