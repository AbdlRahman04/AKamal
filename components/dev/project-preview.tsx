import Image from "next/image";
import { projectPreviews } from "@/data/project-previews";

export type PreviewPhoto = { src: string; alt: string };
type IconName = "leaf" | "home" | "search" | "history" | "book" | "upload" | "check" | "cart";

function PreviewIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    leaf: "M20 4C10 3 3 7 4 14c1 7 10 7 14 1 2-3 2-7 2-11ZM4 20 16 8",
    home: "m3 10 9-7 9 7M5 9v11h5v-6h4v6h5V9",
    search: "M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-1 5 6 6",
    history: "M4 8a9 9 0 1 1-1 8M4 3v5h5m3-1v5l3 2",
    book: "M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Zm0 0v16",
    upload: "M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6",
    check: "m5 12 4 4L19 6",
    cart: "M3 3h3l3 13h10l2-9H7m3 13h.01M18 20h.01",
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}

export default function ProjectPreview({ kind, photos }: { kind: "plant" | "dine" | "portfolio"; photos?: PreviewPhoto[] }) {
  const description = kind === "plant"
    ? "Illustrative LeafAI interface with a tomato leaf photo and an image analysis panel"
    : kind === "dine"
      ? "Illustrative AURAK Dine menu with burger, chicken bowl, and pasta photography"
      : "Illustrative photography gallery using photos from my portfolio";

  return (
    <div className={`ds-preview ds-preview--${kind}`} role="img" aria-label={`${description}. ${projectPreviews.label}.`}>
      <div className="ds-preview-scene" aria-hidden="true">
        {kind === "plant" && <>
          <Image className="ds-preview-garden" src={projectPreviews.plant.image} alt="" fill sizes="(max-width: 700px) 100vw, 50vw" unoptimized />
          <div className="ds-preview-app ds-preview-plant-app">
            <aside className="ds-preview-sidebar">
              <strong className="ds-preview-brand"><PreviewIcon name="leaf" />{projectPreviews.plant.brand}</strong>
              <div className="ds-preview-side-nav">{projectPreviews.plant.navigation.map((label, index) => <span key={label} className={index === 0 ? "is-current" : undefined}><PreviewIcon name={(["home", "search", "history", "book"] as const)[index]} /><span>{label}</span></span>)}</div>
              <span className="ds-preview-sidebar-foot">Plant health, simplified.</span>
            </aside>
            <div className="ds-preview-leaf-input">
              <div className="ds-preview-leaf-photo"><Image src={projectPreviews.plant.image} alt="" fill sizes="(max-width: 700px) 40vw, 23vw" unoptimized /></div>
              <div className="ds-preview-upload"><PreviewIcon name="upload" /><strong>Upload leaf image</strong><span>JPG, PNG or WEBP</span></div>
            </div>
            <div className="ds-preview-analysis">
              <strong>{projectPreviews.plant.heading}</strong>
              <span className="ds-preview-analysis-status"><i />{projectPreviews.plant.status}</span>
              <div className="ds-preview-leaf-result"><div><Image src={projectPreviews.plant.image} alt="" fill sizes="64px" unoptimized /></div><span><strong>{projectPreviews.plant.subject}</strong><small>{projectPreviews.plant.observation}</small></span></div>
              <div className="ds-preview-features"><strong>Explore the workflow</strong>{projectPreviews.plant.features.map((feature) => <span key={feature}><PreviewIcon name="check" />{feature}</span>)}</div>
            </div>
          </div>
        </>}
        {kind === "dine" && <div className="ds-preview-app ds-preview-dine-app">
          <div className="ds-preview-topbar"><strong className="ds-preview-brand"><span className="ds-preview-dine-mark">A</span>{projectPreviews.dine.brand}</strong><div>{projectPreviews.dine.navigation.map((label, index) => <span key={label} className={index === 0 ? "is-current" : undefined}>{label}</span>)}</div><PreviewIcon name="cart" /></div>
          <div className="ds-preview-categories">{projectPreviews.dine.categories.map((category, index) => <span key={category} className={index === 0 ? "is-current" : undefined}>{category}</span>)}</div>
          <div className="ds-preview-food-photo"><Image src={projectPreviews.dine.image} alt="" fill sizes="(max-width: 700px) 100vw, 45vw" unoptimized /></div>
          <div className="ds-preview-dishes">{projectPreviews.dine.dishes.map((dish) => <strong key={dish}>{dish}</strong>)}</div>
        </div>}
        {kind === "portfolio" && <div className="ds-preview-app ds-preview-gallery-app">
          <div className="ds-preview-topbar"><strong className="ds-preview-brand ds-preview-monogram">A<span>K</span></strong><div>{projectPreviews.portfolio.navigation.map((label) => <span key={label} className={label === "Gallery" ? "is-current" : undefined}>{label}</span>)}</div></div>
          <div className="ds-preview-gallery">{photos?.map((photo) => <div key={photo.src}><Image src={photo.src} alt="" fill sizes="(max-width: 700px) 45vw, 23vw" unoptimized /></div>)}</div>
        </div>}
      </div>
      <span className="ds-preview-label" aria-hidden="true">{projectPreviews.label}</span>
    </div>
  );
}
