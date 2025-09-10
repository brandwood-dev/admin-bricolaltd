import React from "react";
import { cn } from "@/lib/utils";
import { Check, Clock, X, AlertTriangle } from "lucide-react";

interface StepperStep {
  id: string;
  label: string;
  status: "completed" | "current" | "pending" | "cancelled" | "failed";
  date?: string;
  description?: string;
}

interface StepperProps {
  steps: StepperStep[];
  className?: string;
}

const getStepIcon = (status: StepperStep["status"]) => {
  switch (status) {
    case "completed":
      return <Check className="h-4 w-4 text-white" />;
    case "current":
      return <Clock className="h-4 w-4 text-white" />;
    case "cancelled":
      return <X className="h-4 w-4 text-white" />;
    case "failed":
      return <AlertTriangle className="h-4 w-4 text-white" />;
    default:
      return <div className="w-2 h-2 bg-white rounded-full" />;
  }
};

const getStepStyles = (status: StepperStep["status"]) => {
  switch (status) {
    case "completed":
      return "bg-success border-success";
    case "current":
      return "bg-primary border-primary";
    case "cancelled":
      return "bg-destructive border-destructive";
    case "failed":
      return "bg-destructive border-destructive";
    default:
      return "bg-muted border-muted-foreground/20";
  }
};

const getConnectorStyles = (currentStatus: StepperStep["status"], nextStatus?: StepperStep["status"]) => {
  if (currentStatus === "completed" && nextStatus && ["completed", "current"].includes(nextStatus)) {
    return "bg-success";
  }
  return "bg-muted";
};

export const Stepper: React.FC<StepperProps> = ({ steps, className }) => {
  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const nextStep = steps[index + 1];
          
          return (
            <div key={step.id} className="relative flex items-start pb-8 last:pb-0">
              {/* Connector line */}
              {!isLast && (
                <div 
                  className={cn(
                    "absolute left-4 top-8 w-0.5 h-full -ml-px",
                    getConnectorStyles(step.status, nextStep?.status)
                  )}
                />
              )}
              
              {/* Step circle */}
              <div className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-full border-2 shrink-0",
                getStepStyles(step.status)
              )}>
                {getStepIcon(step.status)}
              </div>
              
              {/* Step content */}
              <div className="ml-4 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={cn(
                    "text-sm font-medium",
                    step.status === "current" ? "text-primary" : 
                    step.status === "completed" ? "text-success" :
                    step.status === "cancelled" || step.status === "failed" ? "text-destructive" :
                    "text-muted-foreground"
                  )}>
                    {step.label}
                  </h3>
                  {step.date && (
                    <time className="text-xs text-muted-foreground">
                      {step.date}
                    </time>
                  )}
                </div>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};