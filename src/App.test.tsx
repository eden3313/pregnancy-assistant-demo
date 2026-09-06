import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it } from "vitest";
import App from "./App";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("App", () => {
  it("renders the requested three-tab demo flow", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    let root: Root | undefined;

    act(() => {
      root = createRoot(container);
      root.render(<App />);
    });

    expect(container.textContent).toContain("26w+3d");
    expect(container.textContent).toContain("糖耐筛查");

    clickButton(container, "时间排程");
    expect(container.textContent).toContain("补剂时间排程");
    expect(container.textContent).toContain("与钙片间隔至少 2 小时");
    expect(container.textContent).toContain("导出日历");

    clickButton(container, "报告归档");
    expect(container.textContent).toContain("报告归档与指标分析");
    expect(container.textContent).toContain("血红蛋白");
    expect(container.textContent).toContain("给医生的问题");

    act(() => {
      root?.unmount();
    });
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
