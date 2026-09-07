import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { PROFILE_KEY } from "./lib/profile";
import App from "./App";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("App", () => {
  it("collects profile data, generates the overview, edits and restores it", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 6));
    localStorage.clear();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(<App />));
    expect(container.textContent).toContain("从了解你开始");
    const fill = (selector: string, value: string) => {
      const field = container.querySelector(selector) as HTMLInputElement;
      act(() => {
        const prototype = field.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(field, value);
        field.dispatchEvent(new Event("input", { bubbles: true }));
      });
    };
    fill('#last-period', '2026-03-05');
    act(() => (container.querySelector('input[value="twins"]') as HTMLInputElement).click());
    act(() => (container.querySelector('input[name="risk"][value="yes"]') as HTMLInputElement).click());
    fill('.risk-detail textarea', '测试病史');
    fill('div.form-section textarea', '测试药物');
    act(() => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(container.textContent).toContain("2026-12-10");
    expect(container.textContent).toContain("确认个体化产检计划");
    expect(container.textContent).toContain("测试病史");
    expect(container.textContent).toContain("测试药物");
    clickButton(container, "修改资料");
    expect((container.querySelector('#last-period') as HTMLInputElement).value).toBe('2026-03-05');
    fill('#last-period', '2026-04-05');
    act(() => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(container.textContent).toContain("2027-01-10");
    act(() => root.unmount());
    const restored = createRoot(container);
    act(() => restored.render(<App />));
    expect(container.textContent).toContain("2027-01-10");
    act(() => restored.unmount());
    container.remove();
    localStorage.clear();
    vi.useRealTimers();
  });
  it("renders the requested three-tab demo flow", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 6));
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ lastPeriod: "2026-03-05", babies: "single", risk: "no", riskDetails: "", medications: "叶酸" }));
    const container = document.createElement("div");
    document.body.appendChild(container);
    let root: Root | undefined;

    act(() => {
      root = createRoot(container);
      root.render(<App />);
    });

    expect(container.textContent).toContain("2026-12-10");
    expect(container.textContent).toContain("叶酸");
    expect(container.textContent).toContain("糖耐筛查");

    clickButton(container, "时间排程");
    expect(container.textContent).toContain("自动生成三餐与补剂排程");
    expect(container.textContent).toContain("全熟鸡蛋");
    expect(container.textContent).toContain("与钙片间隔至少 2 小时");
    expect(container.textContent).toContain("导出日历");

    clickButton(container, "报告归档");
    expect(container.textContent).toContain("报告归档与指标分析");
    expect(container.textContent).toContain("血红蛋白");
    expect(container.textContent).toContain("给医生的问题");

    act(() => {
      root?.unmount();
    });
    localStorage.clear();
    vi.useRealTimers();
  });
});

function clickButton(container: HTMLElement, label: string): void {
  const button = Array.from(container.querySelectorAll("button")).find((item) =>
    item.textContent?.includes(label),
  );

  if (!button) {
    throw new Error(`Button not found: ${label}`);
  }

  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}
