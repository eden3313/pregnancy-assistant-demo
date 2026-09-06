import { ImagePlus, Mic, Upload } from "lucide-react";
import type { PregnancyOverview } from "../lib/pregnancy";

interface OverviewTabProps {
  overview: PregnancyOverview;
}

export function OverviewTab({ overview }: OverviewTabProps) {
  return (
    <section className="tab-panel overview-grid" aria-label="孕期状态">
      <div className="status-panel">
        <div className="status-topline">
          <span>{overview.profileName}</span>
          <strong>{overview.gestationalAge.label}</strong>
        </div>
        <div className="progress-track" aria-label={`孕期进度 ${overview.progressPercent}%`}>
          <span style={{ width: `${overview.progressPercent}%` }} />
        </div>
        <p className="baby-copy">{overview.babyDescription}</p>
      </div>

      <div className="section-block">
        <p className="section-kicker">下次产检任务</p>
        <h2>{overview.nextCheckup.title}</h2>
        <p className="checkup-window">{overview.nextCheckup.window}</p>
        <p>{overview.nextCheckup.detail}</p>
      </div>

      <div className="section-block">
        <p className="section-kicker">这段时间要注意</p>
        <ul className="advice-list">
          {overview.advice.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="input-strip" aria-label="输入入口">
        <button type="button">
          <Mic size={17} aria-hidden="true" />
          语音记录
        </button>
        <button type="button">
          <ImagePlus size={17} aria-hidden="true" />
          上传报告
        </button>
        <button type="button">
          <Upload size={17} aria-hidden="true" />
          药盒照片
        </button>
      </div>
    </section>
  );
}
