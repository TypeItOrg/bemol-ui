import { createEvent, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Popover, PopoverContent, PopoverTrigger } from "@common/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@common/components/ui/sheet";

describe("Sheet", () => {
  it("allows scrolling portaled popovers without unlocking the background or losing focus restoration", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <Sheet>
        <SheetTrigger>Filtros avanzados</SheetTrigger>
        <SheetContent>
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription>Seleccioná una acción.</SheetDescription>
          <Popover>
            <PopoverTrigger>Acción</PopoverTrigger>
            <PopoverContent>
              <div data-testid="options" style={{ overflowY: "auto" }}>
                <button>Usuario creado</button>
              </div>
            </PopoverContent>
          </Popover>
        </SheetContent>
      </Sheet>,
    );

    await user.click(screen.getByRole("button", { name: "Filtros avanzados" }));
    const trigger = screen.getByRole("button", { name: "Acción" });
    await user.click(trigger);
    const options = screen.getByTestId("options");
    Object.defineProperties(options, {
      scrollHeight: { value: 600 },
      clientHeight: { value: 200 },
      scrollTop: { value: 100 },
    });

    expect(document.querySelector('[data-slot="sheet-content"]')).not.toContainElement(options);
    const option = screen.getByRole("button", { name: "Usuario creado" });
    const optionsWheel = createEvent.wheel(option, { deltaY: 80, cancelable: true });
    fireEvent(option, optionsWheel);
    expect(optionsWheel.defaultPrevented).toBe(false);

    const overlay = document.querySelector('[data-slot="sheet-overlay"]') as HTMLElement;
    const overlayWheel = createEvent.wheel(overlay, { deltaY: 80, cancelable: true });
    fireEvent(overlay, overlayWheel);
    expect(overlayWheel.defaultPrevented).toBe(true);

    const backgroundWheel = createEvent.wheel(document.body, { deltaY: 80, cancelable: true });
    fireEvent(document.body, backgroundWheel);
    expect(backgroundWheel.defaultPrevented).toBe(true);

    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByTestId("options")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.getByRole("button", { name: "Filtros avanzados" })).toHaveFocus());
    unmount();

    render(
      <Sheet modal={false} defaultOpen>
        <SheetContent>
          <SheetTitle>Panel no modal</SheetTitle>
          <SheetDescription>El fondo sigue disponible.</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.getByRole("dialog", { name: "Panel no modal" })).toBeVisible();
    expect(document.querySelector('[data-slot="sheet-overlay"]')).not.toBeInTheDocument();
    await waitFor(() => expect(document.body).not.toHaveAttribute("data-scroll-locked"));
    const nonModalBackgroundWheel = createEvent.wheel(document.body, { deltaY: 80, cancelable: true });
    fireEvent(document.body, nonModalBackgroundWheel);
    expect(nonModalBackgroundWheel.defaultPrevented).toBe(false);
  });
});
