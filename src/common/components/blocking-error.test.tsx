import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BlockingError } from "@common/components/blocking-error";
import { RATE_LIMIT_ERROR_MESSAGE } from "@common/constants/rate-limit.constants";

describe("BlockingError", () => {
  it("does not present an edge rejection as an outage or probe backend health", () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch");

    try {
      render(<BlockingError error={new Error(RATE_LIMIT_ERROR_MESSAGE)} retry={jest.fn()} />);
      expect(screen.getByText("Demasiadas solicitudes")).toBeInTheDocument();
      expect(screen.queryByText("No pudimos cargar esta página")).not.toBeInTheDocument();
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("offers a retry and the institutional home when a page fails", async () => {
    const user = userEvent.setup();
    const retry = jest.fn();
    render(<BlockingError retry={retry} />);

    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/");
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
