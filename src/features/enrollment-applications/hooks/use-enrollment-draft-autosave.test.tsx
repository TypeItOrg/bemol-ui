import type { SetStateAction } from "react";

import { act, renderHook, waitFor } from "@testing-library/react";

import { updateEnrollmentDraftAction } from "@features/enrollment-applications/actions/enrollment-application.actions";
import { useEnrollmentDraftAutosave } from "@features/enrollment-applications/hooks/use-enrollment-draft-autosave";
import { CONFIGURED_APPLICATION, formTestId } from "@features/enrollment-applications/test-utils/enrollment-form-fixtures";
import type { ChangeEnrollmentCareerResult } from "@features/enrollment-applications/types/change-enrollment-career-result.types";
import type { EnrollmentApplicationResponse } from "@features/enrollment-applications/types/enrollment-application-response.types";

jest.mock("@features/enrollment-applications/actions/enrollment-application.actions", () => ({ updateEnrollmentDraftAction: jest.fn() }));
const update = jest.mocked(updateEnrollmentDraftAction);

const props = {
  application: CONFIGURED_APPLICATION,
  readOnly: false,
  isSubmitDialogOpen: false,
  isCancelDialogOpen: false,
  structuredData: CONFIGURED_APPLICATION.data,
  selectedTrainingPathId: CONFIGURED_APPLICATION.data.careerSelection!.trainingPathId!,
  setApplication: jest.fn(),
};

describe("revision-aware enrollment draft persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("serializes in-flight writes and uses the revision returned by each preceding save", async () => {
    let resolveFirst!: (result: ChangeEnrollmentCareerResult) => void;
    update.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
    );
    update.mockResolvedValueOnce({ application: { ...CONFIGURED_APPLICATION, draftRevision: 6 } });
    const { result } = renderHook(() => useEnrollmentDraftAutosave(props));
    let first!: ReturnType<typeof result.current.persistDraft>;
    let second!: ReturnType<typeof result.current.persistDraft>;
    const nextData = { ...props.structuredData, customAnswers: { ...props.structuredData.customAnswers, [formTestId(101)]: "Piano" } };
    await act(async () => {
      first = result.current.persistDraft(props.structuredData);
      second = result.current.persistDraft(nextData);
    });
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][1].expectedRevision).toBe(4);
    await act(async () => {
      resolveFirst({ application: { ...CONFIGURED_APPLICATION, draftRevision: 5 } });
      await Promise.all([first, second]);
    });
    expect(update).toHaveBeenCalledTimes(2);
    expect(update.mock.calls[1][1]).toEqual({ data: nextData, expectedRevision: 5 });
  });

  it("preserves refreshed documentation when an earlier autosave response arrives late", async () => {
    let finishSave!: (value: ChangeEnrollmentCareerResult) => void;
    update.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishSave = resolve;
        }),
    );
    let current: EnrollmentApplicationResponse = CONFIGURED_APPLICATION;
    const setApplication = jest.fn((next: SetStateAction<EnrollmentApplicationResponse>) => {
      current = typeof next === "function" ? next(current) : next;
    });
    const { result } = renderHook(() => useEnrollmentDraftAutosave({ ...props, setApplication }));
    let pending!: ReturnType<typeof result.current.persistDraft>;
    await act(async () => {
      pending = result.current.persistDraft(props.structuredData);
    });
    const refreshed: EnrollmentApplicationResponse = {
      ...current,
      documents: [
        {
          id: formTestId(601),
          name: "DNI actualizado",
          instructions: "",
          level: "AT_SUBMISSION",
          allowedFormats: ["application/pdf"],
          displayOrder: 0,
          status: "ACCEPTED",
        },
      ],
      documentRequests: [
        {
          id: formTestId(602),
          reason: "Documentación adicional",
          createdAt: "2026-01-01T11:00:00Z",
          actorId: formTestId(603),
          accountType: "INSTITUTIONAL",
          actorName: "Secretaría",
        },
      ],
    };
    current = refreshed;
    await act(async () => {
      finishSave({ application: { ...CONFIGURED_APPLICATION, draftRevision: 5, documents: [], documentRequests: [] } });
      await pending;
    });
    expect(current.draftRevision).toBe(5);
    expect(current.documents).toBe(refreshed.documents);
    expect(current.documentRequests).toBe(refreshed.documentRequests);
    expect(current.data).toBe(refreshed.data);
  });

  it("pauses all writes after a conflict and never replaces edited values with server data", async () => {
    update.mockResolvedValue({ error: "La revisión cambió", status: 409 });
    const setApplication = jest.fn();
    const { result } = renderHook(() => useEnrollmentDraftAutosave({ ...props, setApplication }));
    await act(async () => {
      await expect(result.current.persistDraft(props.structuredData)).rejects.toMatchObject({ status: 409 });
    });
    expect(result.current.saveConflict).toBe(true);
    await expect(result.current.persistDraft({ ...props.structuredData, customAnswers: {} })).rejects.toMatchObject({ status: 409 });
    expect(update).toHaveBeenCalledTimes(1);
    expect(setApplication).not.toHaveBeenCalled();
  });

  it("does not send malformed partial custom answers", async () => {
    const { result } = renderHook(() => useEnrollmentDraftAutosave(props));
    await expect(result.current.persistDraft({ ...props.structuredData, customAnswers: { [formTestId(103)]: "abc" } })).rejects.toThrow(
      "número válido",
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("debounces changes without discarding the full answers snapshot", async () => {
    jest.useFakeTimers({ doNotFake: ["queueMicrotask", "nextTick"] });
    update.mockResolvedValue({ application: { ...CONFIGURED_APPLICATION, draftRevision: 5 } });
    const { rerender } = renderHook((input) => useEnrollmentDraftAutosave(input), { initialProps: props });
    const changed = { ...props.structuredData, customAnswers: { ...props.structuredData.customAnswers, [formTestId(103)]: 12 } };
    rerender({ ...props, structuredData: changed });
    await act(async () => {
      jest.advanceTimersByTime(799);
    });
    expect(update).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update.mock.calls[0][1]).toEqual({ data: changed, expectedRevision: 4 });
  });
});
