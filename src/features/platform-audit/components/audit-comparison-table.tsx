import type { ReactElement } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@common/components/ui/table";

import type { AuditComparisonRow } from "@features/platform-audit/types/audit-comparison-row.types";

export function AuditComparisonTable({ label, rows }: { label: string; rows: AuditComparisonRow[] }): ReactElement {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table aria-label={label} className="table-fixed">
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[30%] whitespace-normal">Campo</TableHead>
            <TableHead className="whitespace-normal">Valor anterior</TableHead>
            <TableHead className="whitespace-normal">Valor nuevo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              <TableHead scope="row" className="py-3 align-top break-words whitespace-normal">
                {row.label}
              </TableHead>
              <TableCell className="py-3 align-top break-words whitespace-pre-wrap">{row.before}</TableCell>
              <TableCell className="py-3 align-top break-words whitespace-pre-wrap">{row.after}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
