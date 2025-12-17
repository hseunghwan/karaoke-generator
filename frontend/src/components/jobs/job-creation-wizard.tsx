"use client";

import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobFormSchema, JobFormValues } from "./create-job-schema";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { FileUpload } from "./file-upload";
import { RightsCheckStep } from "./rights-check-step";
import { JobSettingsStep } from "./job-settings-step";
import { toast } from "sonner";
import { Check, ChevronRight, ChevronLeft, FileAudio, FileText, Music, Globe, Layers, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';
import { Separator } from "@/components/ui/separator";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export const JobCreationWizard = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [inputType, setInputType] = useState<'file' | 'url'>('file');
  const [isRightsValid, setIsRightsValid] = useState(false);
  const { t } = useTranslation();

  const STEPS = [
    { id: 1, title: t('job.upload_media'), description: "Video or Audio" },
    { id: 2, title: t('job.rights_check'), description: "Copyright" },
    { id: 3, title: t('job.settings'), description: "Preferences" },
    { id: 4, title: t('job.review'), description: "Confirmation" },
  ];

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      artist: "",
      rightsOwned: false,
      targetLanguages: [],
      template: "standard",
      platform: "YOUTUBE",
      sourceLanguage: "ko",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: JobFormValues) => {
    console.log("Form Data:", data);

    try {
      const payload = {
        title: data.title,
        artist: data.artist,
        platform: data.platform,
        sourceLanguage: data.sourceLanguage,
        targetLanguages: data.targetLanguages,
        template: data.template,
        mediaUrl: data.mediaUrl,
        useMockData: !data.mediaUrl || data.mediaUrl.trim() === "",
      };

      await api.post("/jobs", payload);

      toast.success('Job created successfully! Redirecting...', {
        duration: 2000,
      });

      // Delay navigation slightly to show toast
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);

    } catch (error) {
      console.error("Job creation failed:", error);
      toast.error('Failed to create job. Please try again.');
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof JobFormValues)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ["mediaFile", "mediaUrl", "lyricsFile"];
      // Clear error of the other type to avoid confusion and ensure correct validation
      if (inputType === 'file') {
        form.setValue("mediaUrl", "");
        form.clearErrors("mediaUrl");
      } else {
        form.setValue("mediaFile", undefined);
        form.clearErrors("mediaFile");
      }
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Enhanced Stepper */}
      <div className="relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full" />
        <div
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-primary transition-all duration-500 ease-in-out -z-10 rounded-full"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        <div className="flex justify-between">
          {STEPS.map((step) => (
            <div key={step.id} className="flex flex-col items-center group">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 bg-background z-10",
                  currentStep > step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : currentStep === step.id
                      ? "border-primary text-primary shadow-lg scale-110"
                      : "border-muted text-muted-foreground"
                )}
              >
                {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
              </div>
              <div className="mt-3 text-center">
                <p className={cn(
                  "text-sm font-semibold transition-colors duration-300",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card className="border shadow-lg">
        <CardHeader className="border-b bg-muted/30 pb-6">
          <CardTitle className="text-xl">{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>
            Step {currentStep} of {STEPS.length} - {STEPS[currentStep - 1].description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8 min-h-[400px]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* Step 1: Upload */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 gap-8">
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={inputType === 'file' ? 'default' : 'outline'}
                      onClick={() => setInputType('file')}
                      className="flex-1"
                    >
                      {t('job.file_upload')}
                    </Button>
                    <Button
                      type="button"
                      variant={inputType === 'url' ? 'default' : 'outline'}
                      onClick={() => setInputType('url')}
                      className="flex-1"
                    >
                      {t('job.url_input')}
                    </Button>
                  </div>

                  {inputType === 'file' ? (
                    <FormField
                      control={form.control}
                      name="mediaFile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">{t('job.video_audio')}</FormLabel>
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
                  ) : (
                    <FormField
                      control={form.control}
                      name="mediaUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">{t('job.enter_url')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('job.url_placeholder')}
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            YouTube, TikTok, or direct audio/video links supported.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Separator />

                  <FormField
                    control={form.control}
                    name="lyricsFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          {t('job.lyrics')}
                          <span className="ml-2 text-xs font-normal text-muted-foreground">(Optional)</span>
                        </FormLabel>
                        <FormControl>
                          <FileUpload
                            value={field.value}
                            onChange={field.onChange}
                            accept={{
                              "text/plain": [".txt", ".lrc"],
                            }}
                            label={t('job.lyrics')}
                            description="TXT, LRC (Drag & drop or click)"
                            compact
                          />
                        </FormControl>
                        <FormDescription>
                          If skipped, we will attempt auto-transcription from the audio.
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
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card className="bg-muted/30 border-0">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileAudio className="w-5 h-5 text-primary" />
                          Media & Rights
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                          <span className="text-muted-foreground">File Name:</span>
                          <span className="font-medium truncate">
                            {form.getValues("mediaFile")?.name || form.getValues("mediaUrl") || "N/A"}
                          </span>

                          <span className="text-muted-foreground">Title:</span>
                          <span className="font-medium">{form.getValues("title")}</span>

                          <span className="text-muted-foreground">Artist:</span>
                          <span className="font-medium">{form.getValues("artist")}</span>

                          <span className="text-muted-foreground">Rights:</span>
                          <span className="font-medium flex items-center gap-1 text-green-600">
                            <Check className="w-3 h-3" /> Confirmed
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/30 border-0">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Layers className="w-5 h-5 text-primary" />
                          Output Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                          <span className="text-muted-foreground">Platform:</span>
                          <span className="font-medium">{form.getValues("platform")}</span>

                          <span className="text-muted-foreground">Template:</span>
                          <span className="font-medium capitalize">{form.getValues("template")}</span>

                          <span className="text-muted-foreground">Source:</span>
                          <span className="font-medium uppercase">{form.getValues("sourceLanguage")}</span>

                          <span className="text-muted-foreground">Target:</span>
                          <span className="font-medium">
                            {form.getValues("targetLanguages")?.map(l => l.toUpperCase()).join(", ")}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3 text-sm">
                    <Music className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Ready to generate?</p>
                      <p>This process will deduct 1 credit from your account. The generation typically takes 2-3 minutes.</p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/10 py-6">
          <Button
            type="button"
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="pl-0 hover:pl-2 transition-all"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </Button>

          {currentStep < STEPS.length ? (
            <Button type="button" onClick={nextStep} className="pr-4 hover:pr-6 transition-all">
              {t('common.next')}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button type="button" onClick={form.handleSubmit(onSubmit, (e) => console.error(e))} className="bg-green-600 hover:bg-green-700 min-w-[140px]">
              {t('common.create_job')}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
