import type { MouseEvent } from "react";

import Link from "next/link";

import { fireEvent, render, screen } from "@testing-library/react";

import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@common/components/ui/context-menu";
import { Table, TableBody, TableCell, TableRow } from "@common/components/ui/table";

it("conserva la selección nativa en filas con menú contextual, sin cambiar enlaces ni acciones", () => {
  const navigate = jest.fn((event: MouseEvent<HTMLAnchorElement>) => event.preventDefault());
  render(
    <Table>
      <TableBody>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <TableRow>
              <TableCell>
                <Link href="/people/persona" onClick={navigate}>
                  Ana Pérez
                </Link>
                <p>ana@example.test</p>
              </TableCell>
            </TableRow>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Ver detalle</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </TableBody>
    </Table>,
  );

  const row = screen.getByRole("row");
  expect(row).not.toHaveClass("select-none");
  expect(row).not.toHaveClass("select-all");
  expect(screen.getByRole("cell")).not.toHaveClass("select-none");
  expect(screen.getByRole("cell")).not.toHaveClass("select-all");
  expect(fireEvent.mouseDown(screen.getByText("ana@example.test"), { button: 0 })).toBe(true);
  expect(fireEvent.mouseMove(row, { buttons: 1 })).toBe(true);
  expect(fireEvent.mouseUp(row, { button: 0 })).toBe(true);
  expect(navigate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("link", { name: "Ana Pérez" }));
  expect(navigate).toHaveBeenCalledTimes(1);
  fireEvent.contextMenu(row);
  expect(screen.getByRole("menuitem", { name: "Ver detalle" })).toBeInTheDocument();
});
