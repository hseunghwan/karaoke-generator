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
import { AlertTriangle, CheckCircle, XCircle, Loader2, ShieldCheck, HelpCircle } from "lucide-react";
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
        onValidationChange(true);
      }
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div className="bg-blue-50/50 p-4 rounded-lg flex items-start gap-3 border border-blue-100">
        <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Why do we check rights?</p>
          <p className="text-blue-700/80">To prevent platform strikes, we analyze your song metadata against known copyright databases.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('job.title')}</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Let It Go" {...field} className="h-11" />
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
                <Input placeholder="e.g. Idina Menzel" {...field} className="h-11" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex flex-col gap-4">
        <Button
          type="button"
          onClick={performRightsCheck}
          disabled={isChecking}
          className="w-full h-12 text-base font-medium"
          variant="secondary"
        >
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t('rights.checking')}
            </>
          ) : (
            t('rights.check_risk')
          )}
        </Button>

        {riskLevel && (
          <Card className={cn(
            "border shadow-sm animate-in fade-in slide-in-from-top-2 duration-300",
            riskLevel === "LOW" ? "border-green-200 bg-green-50/50" :
              riskLevel === "MEDIUM" ? "border-yellow-200 bg-yellow-50/50" :
                "border-red-200 bg-red-50/50"
          )}>
            <CardContent className="p-6 flex items-start gap-4">
              <div className={cn("p-2 rounded-full shrink-0",
                riskLevel === "LOW" ? "bg-green-100" :
                  riskLevel === "MEDIUM" ? "bg-yellow-100" : "bg-red-100"
              )}>
                {riskLevel === "LOW" && <CheckCircle className="h-6 w-6 text-green-600" />}
                {riskLevel === "MEDIUM" && <AlertTriangle className="h-6 w-6 text-yellow-600" />}
                {riskLevel === "HIGH" && <XCircle className="h-6 w-6 text-red-600" />}
              </div>

              <div className="space-y-1">
                <h4 className={cn("font-bold text-lg",
                  riskLevel === "LOW" ? "text-green-800" :
                    riskLevel === "MEDIUM" ? "text-yellow-800" :
                      "text-red-800"
                )}>
                  Risk Level: {riskLevel === "LOW" ? t('rights.low_risk') : riskLevel === "MEDIUM" ? t('rights.medium_risk') : t('rights.high_risk')}
                </h4>
                <p className={cn("text-sm",
                  riskLevel === "LOW" ? "text-green-700" :
                    riskLevel === "MEDIUM" ? "text-yellow-700" :
                      "text-red-700"
                )}>
                  {riskLevel === "LOW" && "Low risk of copyright strike. Safe to proceed."}
                  {riskLevel === "MEDIUM" && "Moderate risk. Please ensure you have fair use justification."}
                  {riskLevel === "HIGH" && "High risk! This content is likely to be blocked or monetized by the owner."}
                </p>

                {riskLevel === "HIGH" && (
                  <div className="mt-3 text-xs font-semibold text-red-600 bg-white/50 p-2 rounded border border-red-200 inline-block">
                    ⚠️ Processing blocked by safety policy.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <FormField
        control={form.control}
        name="rightsOwned"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-6 shadow-sm bg-card hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => field.onChange(!field.value)}>
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                className="mt-1"
                onClick={(e) => e.stopPropagation()}
              />
            </FormControl>
            <div className="space-y-1 leading-none cursor-pointer">
              <FormLabel className="text-base font-medium cursor-pointer" onClick={(e) => e.stopPropagation()}>
                {t('rights.own_rights')}
              </FormLabel>
              <FormDescription>
                I confirm that I own the rights to this content or have obtained necessary permissions.
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};
