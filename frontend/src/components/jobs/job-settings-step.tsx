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
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Youtube, Smartphone, MonitorPlay, Type, Languages, Film, Mic } from "lucide-react";

interface JobSettingsStepProps {
  form: UseFormReturn<JobFormValues>;
}

const TARGET_LANGUAGES = [
  { id: "en", label: "English", flag: "🇺🇸" },
  { id: "ko", label: "Korean", flag: "🇰🇷" },
  { id: "ja", label: "Japanese", flag: "🇯🇵" },
  { id: "es", label: "Spanish", flag: "🇪🇸" },
  { id: "zh", label: "Chinese (Simp)", flag: "🇨🇳" },
];

export const JobSettingsStep = ({ form }: JobSettingsStepProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      {/* Platform Selection */}
      <FormField
        control={form.control}
        name="platform"
        render={({ field }) => (
          <FormItem className="space-y-4">
            <FormLabel className="text-base font-semibold flex items-center gap-2">
              <MonitorPlay className="w-4 h-4" />
              {t('job.platform')}
            </FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {[
                  { value: "YOUTUBE", label: "YouTube", desc: "Landscape 16:9", icon: Youtube },
                  { value: "TIKTOK", label: "TikTok", desc: "Portrait 9:16", icon: Smartphone },
                  { value: "SHORTS", label: "Shorts", desc: "Portrait 9:16", icon: Smartphone },
                ].map((option) => (
                  <FormItem key={option.value}>
                    <FormControl>
                      <RadioGroupItem value={option.value} className="sr-only" />
                    </FormControl>
                    <FormLabel className="cursor-pointer">
                      <Card className={cn(
                        "h-full transition-all hover:border-primary",
                        field.value === option.value ? "border-primary bg-primary/5 shadow-md" : "border-muted"
                      )}>
                        <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                          <option.icon className={cn(
                            "w-8 h-8",
                            field.value === option.value ? "text-primary" : "text-muted-foreground"
                          )} />
                          <div className="font-semibold">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.desc}</div>
                        </CardContent>
                      </Card>
                    </FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Source Language */}
        <FormField
          control={form.control}
          name="sourceLanguage"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold flex items-center gap-2">
                <Mic className="w-4 h-4" />
                {t('job.source_lang')}
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select audio language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ko">🇰🇷 Korean</SelectItem>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="ja">🇯🇵 Japanese</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Template */}
        <FormField
          control={form.control}
          name="template"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold flex items-center gap-2">
                <Type className="w-4 h-4" />
                {t('job.template')}
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select subtitle style" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="standard">Standard (Original + Trans)</SelectItem>
                  <SelectItem value="bilingual">Bilingual Education</SelectItem>
                  <SelectItem value="triple">Triple (Orig + Trans + Rom)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Triple subtitles include pronunciation guides.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Target Languages */}
      <FormField
        control={form.control}
        name="targetLanguages"
        render={() => (
          <FormItem>
            <div className="mb-4">
              <FormLabel className="text-base font-semibold flex items-center gap-2">
                <Languages className="w-4 h-4" />
                {t('job.languages')}
              </FormLabel>
              <FormDescription>
                Select languages you want to translate to
              </FormDescription>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TARGET_LANGUAGES.map((lang) => (
                <FormField
                  key={lang.id}
                  control={form.control}
                  name="targetLanguages"
                  render={({ field }) => {
                    const isChecked = field.value?.includes(lang.id);
                    return (
                      <FormItem
                        key={lang.id}
                      >
                        <FormControl>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), lang.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== lang.id
                                    )
                                  );
                            }}
                            className="sr-only"
                          />
                        </FormControl>
                        <FormLabel className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent",
                          isChecked ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-muted"
                        )}>
                          <span className="text-xl">{lang.flag}</span>
                          <span className="font-medium">{lang.label}</span>
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
  );
};
