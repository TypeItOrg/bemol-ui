import { StrictMode } from "react";

import { render, screen } from "@testing-library/react";

import { GuardianDependentDocumentsField } from "@features/guardian-dependents/components/guardian-dependent-documents-field";

jest.mock("@features/enrollment-applications/components/document-file-preview", () => ({
  DocumentFilePreview: ({ src }: { src: string }) => <span data-testid="document-preview">{src}</span>,
}));

const createObjectUrl = jest.fn(() => "");
const revokeObjectUrl = jest.fn();

describe("GuardianDependentDocumentsField preview lifecycle", () => {
  beforeEach(() => {
    let index = 0;
    createObjectUrl.mockImplementation(() => `blob:preview-${++index}`);
    URL.createObjectURL = createObjectUrl;
    URL.revokeObjectURL = revokeObjectUrl;
  });

  it("replaces same-name file previews and revokes URLs when files are removed", () => {
    const file = new File(["first"], "document.png", { type: "image/png" });
    const replacement = new File(["second"], "document.png", { type: "image/png" });
    const onChange = jest.fn();
    const { rerender } = render(<GuardianDependentDocumentsField disabled={false} files={[file]} onChange={onChange} />);

    expect(createObjectUrl).toHaveBeenCalledWith(file);
    expect(screen.getAllByTestId("document-preview")[0]).toHaveTextContent("blob:preview-1");

    rerender(<GuardianDependentDocumentsField disabled={false} files={[replacement]} onChange={onChange} />);

    expect(createObjectUrl).toHaveBeenCalledTimes(2);
    expect(createObjectUrl).toHaveBeenLastCalledWith(replacement);
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:preview-1");
    expect(revokeObjectUrl).not.toHaveBeenCalledWith("blob:preview-2");
    expect(screen.getAllByTestId("document-preview")[0]).toHaveTextContent("blob:preview-2");

    rerender(<GuardianDependentDocumentsField disabled={false} files={[]} onChange={onChange} />);

    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:preview-2");
    expect(screen.queryByTestId("document-preview")).not.toBeInTheDocument();
  });

  it("keeps the current StrictMode preview live and releases every URL on unmount", () => {
    const file = new File(["content"], "document.png", { type: "image/png" });
    const { unmount } = render(
      <StrictMode>
        <GuardianDependentDocumentsField disabled={false} files={[file]} onChange={jest.fn()} />
      </StrictMode>,
    );
    const activeUrl = screen.getAllByTestId("document-preview")[0].textContent;

    expect(activeUrl).toMatch(/^blob:preview-/);
    expect(revokeObjectUrl).not.toHaveBeenCalledWith(activeUrl);

    unmount();

    for (const { value } of createObjectUrl.mock.results) {
      expect(revokeObjectUrl.mock.calls.filter(([url]) => url === value)).toHaveLength(1);
    }
  });
});
