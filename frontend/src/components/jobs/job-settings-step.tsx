"use client";

import { UseFormReturn } from "react-hook-form";
import { JobFormValues } from "./create-job-schema";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from 'react-i18next';

interface JobSettingsStepProps {
  form: UseFormReturn<JobFormValues>;
}

const TARGET_LANGUAGES = [
  { id: "en", label: "English" },
  { id: "ko", label: "Korean" },
  { id: "ja", label: "Japanese" },
  { id: "es", label: "Spanish" },
  { id: "zh", label: "Chinese (Simplified)" },
];

export const JobSettingsStep = ({ form }: JobSettingsStepProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="platform"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>{t('job.platform')}</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-1"
              >
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="YOUTUBE" />
                  </FormControl>
                  <FormLabel className="font-normal">
                    YouTube (Landscape 16:9)
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="TIKTOK" />
                  </FormControl>
                  <FormLabel className="font-normal">
                    TikTok (Portrait 9:16)
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="SHORTS" />
                  </FormControl>
                  <FormLabel className="font-normal">
                    YouTube Shorts (Portrait 9:16)
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="sourceLanguage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('job.source_lang')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('job.source_lang')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetLanguages"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>{t('job.languages')}</FormLabel>
                <FormDescription>
                  Select languages for translation
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {TARGET_LANGUAGES.map((lang) => (
                  <FormField
                    key={lang.id}
                    control={form.control}
                    name="targetLanguages"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={lang.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(lang.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), lang.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== lang.id
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {lang.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="template"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('job.template')}</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="standard">Standard (Original + Trans)</SelectItem>
                <SelectItem value="bilingual">Bilingual Education</SelectItem>
                <SelectItem value="triple">Triple (Orig + Trans + Pronunciation)</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Triple subtitles include phonetic guides (e.g., Romanization).
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
