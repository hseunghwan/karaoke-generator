import * as z from "zod";

export const jobFormSchema = z.object({
  // Step 1: Media
  mediaFile: z.instanceof(File, { message: "Media file is required" }).optional(),
  lyricsFile: z.instanceof(File, { message: "Lyrics file is required" }).optional(),

  // Step 2: Rights Meta
  title: z.string().min(1, "Song title is required"),
  artist: z.string().min(1, "Artist name is required"),
  rightsOwned: z.boolean(), // Removed default(false) to align with type inference or we adjust the inferred type

  // Step 3: Settings
  platform: z.enum(["YOUTUBE", "TIKTOK", "SHORTS"]),
  sourceLanguage: z.string().min(1, "Source language is required"),
  targetLanguages: z.array(z.string()).min(1, "Select at least one target language"),
  template: z.enum(["standard", "bilingual", "triple"]),
});

export type JobFormValues = z.infer<typeof jobFormSchema>;
