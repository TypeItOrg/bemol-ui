import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CourseEnrollmentAssignmentFields } from "@features/course-enrollments/components/course-enrollment-assignment-fields";
import type { CourseEnrollmentAssignmentOptions } from "@features/course-enrollments/types/course-enrollment-assignment-options.types";

const OPTIONS: CourseEnrollmentAssignmentOptions = {
  courseId: "00000000-0000-4000-8000-000000000005",
  format: "INDIVIDUAL",
  classes: [
    {
      id: "00000000-0000-4000-8000-000000000001",
      label: "Clase 1",
      teacherIds: ["00000000-0000-4000-8000-000000000006", "00000000-0000-4000-8000-000000000007"],
      teachers: [
        { personId: "00000000-0000-4000-8000-000000000006", fullName: "Ana Garcia" },
        { personId: "00000000-0000-4000-8000-000000000007", fullName: "Luis Perez" },
      ],
      days: [
        {
          id: "00000000-0000-4000-8000-000000000002",
          dayOfWeek: "MONDAY",
          capacity: 6,
          availableCapacity: 6,
          periodDurationMinutes: 60,
          schedules: [
            {
              id: "00000000-0000-4000-8000-000000000003",
              startTime: "10:00:00",
              endTime: "11:00:00",
              individualSlots: [
                {
                  id: "00000000-0000-4000-8000-000000000004",
                  startTime: "10:00:00",
                  endTime: "11:00:00",
                  available: true,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "00000000-0000-4000-8000-000000000008",
      label: "Clase 2",
      teacherIds: ["00000000-0000-4000-8000-000000000009"],
      teachers: [{ personId: "00000000-0000-4000-8000-000000000009", fullName: "Maria Lopez" }],
      days: [],
    },
  ],
};

describe("CourseEnrollmentAssignmentFields", () => {
  it("serializes an individual assignment and clears stale choices when a day or class changes", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <CourseEnrollmentAssignmentFields options={OPTIONS} />
      </form>,
    );
    const form = container.querySelector("form")!;
    const [courseClass] = OPTIONS.classes;
    const [day] = courseClass.days;
    const [schedule] = day.schedules;
    const [slot] = schedule.individualSlots;
    const assignments = () => JSON.parse(String(new FormData(form).get("assignments")));

    expect(assignments()).toEqual([]);
    await user.click(screen.getByRole("checkbox", { name: /lunes/i }));
    expect(screen.getByRole("combobox", { name: /período individual/i })).toBeDisabled();
    await user.click(screen.getByRole("combobox", { name: /horario/i }));
    await user.click(screen.getByRole("option", { name: "10:00 - 11:00" }));
    await user.click(screen.getByRole("combobox", { name: /período individual/i }));
    await user.click(screen.getByRole("option", { name: "10:00 - 11:00" }));

    expect(new FormData(form).get("courseClassId")).toBe(courseClass.id);
    expect(assignments()).toEqual([{ dayId: day.id, classScheduleId: schedule.id, individualSlotId: slot.id }]);
    await user.click(screen.getByRole("checkbox", { name: /lunes/i }));
    expect(assignments()).toEqual([]);
    expect(screen.queryByRole("combobox", { name: /horario/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /lunes/i }));
    expect(assignments()).toEqual([{ dayId: day.id, classScheduleId: "", individualSlotId: null }]);
    expect(screen.getByRole("combobox", { name: /período individual/i })).toBeDisabled();

    await user.click(screen.getByRole("combobox", { name: /clase/i }));
    await user.click(screen.getByRole("option", { name: /Clase 2/ }));

    expect(new FormData(form).get("courseClassId")).toBe(OPTIONS.classes[1].id);
    expect(assignments()).toEqual([]);
    expect(screen.queryByRole("checkbox", { name: /lunes/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Docentes: Maria Lopez/)).toBeInTheDocument();
  });

  it("marks an incomplete selected day accessibly and prevents selecting a day without capacity", async () => {
    const user = userEvent.setup();
    const day = OPTIONS.classes[0].days[0];
    const { rerender } = render(<CourseEnrollmentAssignmentFields options={OPTIONS} invalidDayIds={[day.id]} />);

    await user.click(screen.getByRole("checkbox", { name: /lunes/i }));

    expect(screen.getByRole("combobox", { name: /horario/i })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Completá el horario de este día.")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /período individual/i })).toHaveAttribute("aria-invalid", "true");
    rerender(
      <CourseEnrollmentAssignmentFields
        key="without-capacity"
        options={{
          ...OPTIONS,
          classes: [{ ...OPTIONS.classes[0], days: [{ ...day, availableCapacity: 0 }] }],
        }}
      />,
    );

    expect(screen.getByRole("checkbox", { name: /lunes/i })).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /lunes/i }));
    expect(screen.queryByRole("combobox", { name: /horario/i })).not.toBeInTheDocument();
  });
});
