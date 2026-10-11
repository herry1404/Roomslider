const { z } = require("zod");

const ownerUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100, "Name is too long").optional(),
    propertyName: z.string().trim().max(100, "Property name is too long").optional(),
    bio: z.string().trim().max(150, "Bio must be 150 characters or fewer").optional(),
    photo: z
      .string()
      .trim()
      .max(2048, "Photo URL is too long")
      .url("Enter a valid photo URL")
      .or(z.literal(""))
      .optional(),
    area: z.string().trim().max(100, "Area is too long").optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

module.exports = { ownerUpdateSchema };
