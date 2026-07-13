"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TOTAL_STEPS, useOnboarding } from "./onboarding-context";
import { StepBasics, stepBasicsIsValid } from "./step-basics";
import { StepSpecialty, stepSpecialtyIsValid } from "./step-specialty";
import { StepPortfolio, stepPortfolioIsValid } from "./step-portfolio";
import { StepLinks } from "./step-links";
import { StepReview } from "./step-review";

const STEP_LABELS = [
  "The basics",
  "Your specialty",
  "Your portfolio",
  "Links & contact",
  "Review & submit",
];

export function OnboardingFlow() {
  const { step, setStep, data } = useOnboarding();

  const isCurrentStepValid = (() => {
    switch (step) {
      case 1:
        return stepBasicsIsValid(data);
      case 2:
        return stepSpecialtyIsValid(data);
      case 3:
        return stepPortfolioIsValid(data);
      default:
        return true;
    }
  })();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Step {step} of {TOTAL_STEPS}
          </span>
          <span>{STEP_LABELS[step - 1]}</span>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} />
      </div>

      {step === 1 && <StepBasics />}
      {step === 2 && <StepSpecialty />}
      {step === 3 && <StepPortfolio />}
      {step === 4 && <StepLinks />}
      {step === 5 && <StepReview />}

      {step < 5 && (
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
          >
            Back
          </Button>
          <Button
            type="button"
            disabled={!isCurrentStepValid}
            onClick={() => setStep(step + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
