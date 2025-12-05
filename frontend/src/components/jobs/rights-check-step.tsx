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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

interface RightsCheckStepProps {
  form: UseFormReturn<JobFormValues>;
  onValidationChange: (isValid: boolean) => void;
}

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | null;

export const RightsCheckStep = ({ form, onValidationChange }: RightsCheckStepProps) => {
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkedTitle, setCheckedTitle] = useState("");
  const { t } = useTranslation();

  const performRightsCheck = async () => {
    const title = form.getValues("title");
    const artist = form.getValues("artist");

    if (!title || !artist) {
      form.trigger(["title", "artist"]);
      return;
    }

    setIsChecking(true);

    // Simulate API call
    setTimeout(() => {
      setIsChecking(false);
      setCheckedTitle(title);

      // Mock logic
      if (title.toLowerCase().includes("copyright")) {
        setRiskLevel("HIGH");
        onValidationChange(false);
      } else if (title.toLowerCase().includes("free")) {
        setRiskLevel("LOW");
        onValidationChange(true);
      } else {
        setRiskLevel("MEDIUM");
        onValidationChange(true); // Allow medium with warning? SRS says only HIGH blocks or requires checklist.
      }
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('job.title')}</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Let It Go" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="artist"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('job.artist')}</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Idina Menzel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="rightsOwned"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                {t('rights.own_rights')}
              </FormLabel>
              <FormDescription>
                You are responsible for ensuring you have the necessary rights.
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      <Button
        type="button"
        onClick={performRightsCheck}
        disabled={isChecking}
        className="w-full"
        variant="secondary"
      >
        {isChecking ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('rights.checking')}
          </>
        ) : (
          t('rights.check_risk')
        )}
      </Button>

      {riskLevel && (
        <Card className={cn(
          "border-2",
          riskLevel === "LOW" ? "border-green-200 bg-green-50" :
          riskLevel === "MEDIUM" ? "border-yellow-200 bg-yellow-50" :
          "border-red-200 bg-red-50"
        )}>
          <CardContent className="pt-6 flex items-start gap-4">
            {riskLevel === "LOW" && <CheckCircle className="h-6 w-6 text-green-600 mt-1" />}
            {riskLevel === "MEDIUM" && <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1" />}
            {riskLevel === "HIGH" && <XCircle className="h-6 w-6 text-red-600 mt-1" />}

            <div>
              <h4 className={cn("font-semibold text-lg",
                riskLevel === "LOW" ? "text-green-800" :
                riskLevel === "MEDIUM" ? "text-yellow-800" :
                "text-red-800"
              )}>
                Risk Level: {riskLevel === "LOW" ? t('rights.low_risk') : riskLevel === "MEDIUM" ? t('rights.medium_risk') : t('rights.high_risk')}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {riskLevel === "LOW" && "Low risk of copyright strike. Safe to proceed."}
                {riskLevel === "MEDIUM" && "Moderate risk. Please ensure you have fair use justification."}
                {riskLevel === "HIGH" && "High risk! This content is likely to be blocked or monetized by the owner."}
              </p>

              {riskLevel === "HIGH" && (
                 <div className="mt-4 p-3 bg-white rounded border border-red-100 text-sm text-red-700">
                   <strong>Warning:</strong> Processing may be blocked by the platform.
                   Please confirm you have explicit permission.
                 </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
