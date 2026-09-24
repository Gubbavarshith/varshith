import Link from "next/link";
import { accentVars, guides } from "../_data/guides";

// h: the title's heading level, one below the page's section heading
export default function GuideList({ h: H = "h3" }: { h?: "h2" | "h3" }) {
  return (
    <ol className="guides">
      {guides.map((g) => (
        <li key={g.slug} className="guide" style={accentVars(g)}>
          <div className="cover-art" aria-hidden="true">
            <span className="cover-no">No. {g.no}</span>
            <span className="cover-a">
              {g.cover[0]}
              <span className="cover-b">{g.cover[1]}</span>
            </span>
          </div>
          <div>
            <p className="guide-meta">
              No. {g.no} · {g.parts} parts · {g.minutes} min read · {g.credit}
            </p>
            <H className="guide-title">
              <Link className="guide-link" href={`/guides/${g.slug}`}>
                {g.title}
              </Link>
            </H>
            <p className="guide-sum">{g.summary}</p>
            <ul className="tags" aria-label="Topics">
              {g.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <span className="guide-go" aria-hidden="true">
            Read →
          </span>
        </li>
      ))}
      <li className="guide-next">No. {String(guides.length + 1).padStart(3, "0")} · Next guide is being written</li>
    </ol>
  );
}
