"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobFormSchema, JobFormValues } from "./create-job-schema";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileUpload } from "./file-upload";
import { RightsCheckStep } from "./rights-check-step";
import { JobSettingsStep } from "./job-settings-step";
import { toast } from "sonner";
import { Check, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

export const JobCreationWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isRightsValid, setIsRightsValid] = useState(false);
  const { t } = useTranslation();

  const STEPS = [
    { id: 1, title: t('job.upload_media') },
    { id: 2, title: t('job.rights_check') },
    { id: 3, title: t('job.settings') },
    { id: 4, title: t('job.review') },
  ];

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      rightsOwned: false,
      targetLanguages: [],
      template: "standard",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: JobFormValues) => {
    console.log("Form Data:", data);
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: t('common.loading'),
        success: 'Job created successfully! Redirecting...',
        error: 'Failed to create job',
      }
    );
    // TODO: Call API to create job
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof JobFormValues)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ["mediaFile", "lyricsFile"];
    } else if (currentStep === 2) {
      if (!isRightsValid) {
        toast.error("Please resolve rights risks before proceeding.");
        return;
      }
      fieldsToValidate = ["title", "artist", "rightsOwned"];
    } else if (currentStep === 3) {
      fieldsToValidate = ["platform", "sourceLanguage", "targetLanguages", "template"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stepper Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex flex-col items-center bg-white px-2",
                currentStep >= step.id ? "text-primary" : "text-gray-400"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold transition-colors",
                  currentStep > step.id
                    ? "bg-green-500 border-green-500 text-white"
                    : currentStep === step.id
                    ? "bg-primary border-primary text-white"
                    : "bg-white border-gray-300 text-gray-400"
                )}
              >
                {currentStep > step.id ? <Check className="w-6 h-6" /> : step.id}
              </div>
              <span className="text-sm font-medium mt-2">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>
            Step {currentStep} of {STEPS.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* Step 1: Upload */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="mediaFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('job.video_audio')}</FormLabel>
                        <FormControl>
                          <FileUpload
                            value={field.value}
                            onChange={field.onChange}
                            accept={{
                              "video/*": [],
                              "audio/*": [],
                            }}
                            label={t('job.upload_media')}
                            description="MP4, MP3, WAV (Max 500MB)"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lyricsFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('job.lyrics')}</FormLabel>
                        <FormControl>
                          <FileUpload
                            value={field.value}
                            onChange={field.onChange}
                            accept={{
                              "text/plain": [".txt", ".lrc"],
                            }}
                            label={t('job.lyrics')}
                            description="TXT, LRC (Optional)"
                          />
                        </FormControl>
                        <FormDescription>
                          If skipped, we will attempt auto-transcription.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Rights Check */}
              {currentStep === 2 && (
                <RightsCheckStep form={form} onValidationChange={setIsRightsValid} />
              )}

              {/* Step 3: Settings */}
              {currentStep === 3 && (
                <JobSettingsStep form={form} />
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h3 className="font-semibold text-lg">Summary</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-500">File:</span>
                      <span>{form.getValues("mediaFile")?.name}</span>

                      <span className="text-gray-500">{t('job.title')}:</span>
                      <span>{form.getValues("title")}</span>

                      <span className="text-gray-500">{t('job.artist')}:</span>
                      <span>{form.getValues("artist")}</span>

                      <span className="text-gray-500">{t('job.platform')}:</span>
                      <span>{form.getValues("platform")}</span>

                      <span className="text-gray-500">{t('job.template')}:</span>
                      <span>{form.getValues("template")}</span>

                      <span className="text-gray-500">{t('job.languages')}:</span>
                      <span>{form.getValues("targetLanguages")?.join(", ")}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  {t('common.back')}
                </Button>

                {currentStep < STEPS.length ? (
                  <Button type="button" onClick={nextStep}>
                    {t('common.next')}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    {t('common.create_job')}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
