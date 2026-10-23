import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { PwaRuntime } from "@common/components/pwa-runtime";

const originalOnline = Object.getOwnPropertyDescriptor(window.navigator, "onLine");
const originalWorker = Object.getOwnPropertyDescriptor(window.navigator, "serviceWorker");
const originalNodeEnvironment = process.env.NODE_ENV;
const register = jest.fn();

function setConnection(online: boolean): void {
  Object.defineProperty(window.navigator, "onLine", { configurable: true, value: online });
  act(() => window.dispatchEvent(new Event(online ? "online" : "offline")));
}

beforeEach(() => {
  register.mockReset().mockResolvedValue({});
  Object.defineProperty(window.navigator, "serviceWorker", { configurable: true, value: { register } });
  setConnection(true);
  jest.replaceProperty(process.env, "NODE_ENV", "production");
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(() => {
  for (const [object, key, descriptor] of [
    [window.navigator, "onLine", originalOnline],
    [window.navigator, "serviceWorker", originalWorker],
  ] as const) {
    if (descriptor) {
      Object.defineProperty(object, key, descriptor);
    } else {
      Reflect.deleteProperty(object, key);
    }
  }

  expect(process.env.NODE_ENV).toBe(originalNodeEnvironment);
});

it("registers only the root worker, without installation buttons or prompts", async () => {
  render(<PwaRuntime />);
  await waitFor(() => expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/", updateViaCache: "none" }));
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it.each(["development", "test"] as const)("does not install a worker in %s", (environment) => {
  jest.replaceProperty(process.env, "NODE_ENV", environment);
  render(<PwaRuntime />);
  expect(register).not.toHaveBeenCalled();
});

it("does not register when the API is absent, including in insecure contexts", () => {
  Reflect.deleteProperty(window.navigator, "serviceWorker");
  render(<PwaRuntime />);
  expect(register).not.toHaveBeenCalled();
});

it("keeps the web app usable when registration fails", async () => {
  const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  register.mockRejectedValueOnce(new Error("registration unavailable"));
  render(<PwaRuntime />);
  await waitFor(() => expect(warn).toHaveBeenCalledTimes(1));
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it("shows a polite offline hint without unmounting, disabling or resubmitting an open form", () => {
  const submit = jest.fn((event) => event.preventDefault());
  render(
    <>
      <PwaRuntime />
      <form onSubmit={submit}>
        <label>
          Nombre
          <input name="name" />
        </label>
        <button>Guardar</button>
      </form>
    </>,
  );
  const input = screen.getByRole("textbox", { name: "Nombre" });
  fireEvent.change(input, { target: { value: "Borrador local" } });
  setConnection(false);
  expect(screen.getByRole("status")).toHaveTextContent("Necesitás conexión para usar Bemol");
  expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  expect(input).toHaveValue("Borrador local");
  expect(input).not.toBeDisabled();
  setConnection(true);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByRole("textbox")).toBe(input);
  expect(input).toHaveValue("Borrador local");
  expect(submit).not.toHaveBeenCalled();
});

it("shows the hint when the app is already offline at mount", () => {
  setConnection(false);
  render(<PwaRuntime />);
  expect(screen.getByRole("status")).toBeVisible();
});
