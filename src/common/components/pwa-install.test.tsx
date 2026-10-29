import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";

import { PwaInstallCard, PwaInstallProvider } from "@common/components/pwa-install";
import { SidebarProvider } from "@common/components/ui/sidebar";
import { TooltipProvider } from "@common/components/ui/tooltip";
import type { PwaInstallPromptEvent } from "@common/types/pwa-install-prompt-event.types";

jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));

const originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");
const listeners = jest.spyOn(window, "addEventListener");
let browserMode: MediaQueryList;

beforeEach(() => {
  browserMode = Object.assign(new EventTarget(), {
    matches: true,
    media: "(display-mode: browser)",
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  });

  Object.defineProperty(window, "matchMedia", { configurable: true, value: () => browserMode });
});

afterAll(() => {
  listeners.mockRestore();

  if (originalMatchMedia) {
    Object.defineProperty(window, "matchMedia", originalMatchMedia);
  } else {
    Reflect.deleteProperty(window, "matchMedia");
  }
});

function renderInstallation() {
  return render(
    <TooltipProvider>
      <SidebarProvider>
        <PwaInstallProvider>
          <PwaInstallCard />
        </PwaInstallProvider>
      </SidebarProvider>
    </TooltipProvider>,
  );
}

function offerInstallation(prompt = jest.fn().mockResolvedValue(undefined), isTrusted = true): PwaInstallPromptEvent {
  const listener = listeners.mock.calls.find(([name]) => name === "beforeinstallprompt")?.[1];
  expect(typeof listener).toBe("function");
  const event = { prompt, isTrusted, preventDefault: jest.fn() } as unknown as PwaInstallPromptEvent;

  act(() => (listener as EventListener)(event));

  return event;
}

it("stays hidden without a trusted browser prompt and inside an installed app", () => {
  renderInstallation();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(offerInstallation(undefined, false).preventDefault).not.toHaveBeenCalled();
  Object.defineProperty(browserMode, "matches", { value: false });
  expect(offerInstallation().preventDefault).not.toHaveBeenCalled();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it("disables a pending single-use prompt and preserves a newer offer", async () => {
  renderInstallation();
  let finish!: () => void;
  const prompt = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const first = offerInstallation(prompt);
  expect(first.preventDefault).toHaveBeenCalledTimes(1);
  const button = screen.getByRole("button", { name: "Instalar aplicación" });

  fireEvent.click(button);
  fireEvent.click(button);
  expect(prompt).toHaveBeenCalledTimes(1);
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");
  const next = offerInstallation();
  await act(async () => finish());
  expect(button).toBeEnabled();

  fireEvent.click(button);
  await waitFor(() => expect(screen.queryByRole("button")).not.toBeInTheDocument());
  expect(next.prompt).toHaveBeenCalledTimes(1);
});

it("reports a native prompt error without reusing the consumed event", async () => {
  renderInstallation();
  offerInstallation(jest.fn().mockRejectedValue(new Error("unavailable")));

  fireEvent.click(screen.getByRole("button", { name: "Instalar aplicación" }));

  await waitFor(() => expect(screen.queryByRole("button")).not.toBeInTheDocument());
  expect(toast.error).toHaveBeenCalledWith("No se pudo abrir la instalación. Intentá de nuevo más tarde.");
});

it.each(["appinstalled", "display-mode"])("clears the offer after %s", (event) => {
  renderInstallation();
  offerInstallation();
  expect(screen.getByRole("button", { name: "Instalar aplicación" })).toBeEnabled();

  act(() => {
    if (event === "appinstalled") {
      window.dispatchEvent(new Event("appinstalled"));
    } else {
      browserMode.dispatchEvent(new Event("change"));
    }
  });

  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
