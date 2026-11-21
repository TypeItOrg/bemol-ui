import { courseEnrollmentGradeSchema } from "@features/course-enrollments/schemas/course-enrollment-grade.schema";

describe("courseEnrollmentGradeSchema", () => {
  it("accepts valid evaluation and grade with comma or dot decimals", () => {
    expect(courseEnrollmentGradeSchema.safeParse({ evaluation: "Parcial 1", value: "7,50" }).success).toBe(true);
    expect(courseEnrollmentGradeSchema.safeParse({ evaluation: "Parcial 1", value: "1" }).success).toBe(true);
    expect(courseEnrollmentGradeSchema.safeParse({ evaluation: "Parcial 1", value: "10" }).success).toBe(true);
  });

  it("rejects empty or overly long evaluation", () => {
    expect(courseEnrollmentGradeSchema.safeParse({ evaluation: "   ", value: 7 }).success).toBe(false);
    expect(courseEnrollmentGradeSchema.safeParse({ evaluation: "a".repeat(150), value: 7 }).success).toBe(true);
    expect(courseEnrollmentGradeSchema.safeParse({ evaluation: "a".repeat(151), value: 7 }).success).toBe(false);
  });

  it("rejects out of range grades", () => {
    expect(courseEnrollmentGradeSchema.safeParse({ evaluation: "Parcial 1", value: 0 }).success).toBe(false);
    expect(courseEnrollmentGradeSchema.safeParse({ evaluation: "Parcial 1", value: 10.01 }).success).toBe(false);
  });

  it("rejects non-decimal numeric literals", () => {
    expect(courseEnrollmentGradeSchema.safeParse({ evaluation: "Parcial 1", value: "0x7" }).success).toBe(false);
    expect(courseEnrollmentGradeSchema.safeParse({ evaluation: "Parcial 1", value: "0b111" }).success).toBe(false);
    expect(courseEnrollmentGradeSchema.safeParse({ evaluation: "Parcial 1", value: "1e1" }).success).toBe(false);
    expect(courseEnrollmentGradeSchema.safeParse({ evaluation: "Parcial 1", value: "+8" }).success).toBe(false);
  });

  it("rejects more than two decimals", () => {
    expect(courseEnrollmentGradeSchema.safeParse({ evaluation: "Parcial 1", value: 7.555 }).success).toBe(false);
    expect(courseEnrollmentGradeSchema.safeParse({ evaluation: "Parcial 1", value: "7,555" }).success).toBe(false);
  });
});
