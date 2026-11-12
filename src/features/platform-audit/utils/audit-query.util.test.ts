import { parseAuditFilters } from "@features/platform-audit/utils/audit-query.util";

it("acepta códigos nuevos sin agregar acciones ni módulos al frontend", () => {
  expect(parseAuditFilters({ module: "NEW_MODULE", action: "NEW_OPERATION" })).toMatchObject({ module: "NEW_MODULE", action: "NEW_OPERATION" });
});

it("rechaza códigos malformados y mantiene separados los correos", () => {
  expect(parseAuditFilters({ module: "x<script>", action: "invalid action" })).toMatchObject({ module: undefined, action: undefined });
  expect(parseAuditFilters({ module: "EMAILS", action: "EMAIL_SENT" })).toMatchObject({ module: undefined, action: undefined });
});
