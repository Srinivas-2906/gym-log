import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPhoneDisplay, hasUser, normalizePhone, verifyOtp, verifyPin } from "@/lib/auth";

type Step = "phone" | "otp" | "set-pin" | "pin" | "forgot";

interface LoginScreenProps {
  onLogin: (phone: string, pin?: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const normalizedPhone = normalizePhone(phone);
  const isPhoneValid = normalizedPhone.length === 10;

  const handlePhoneContinue = () => {
    if (!isPhoneValid) {
      toast.error("Enter a valid 10-digit phone number.");
      return;
    }
    if (hasUser(normalizedPhone)) {
      setStep("pin");
      return;
    }
    setStep("otp");
  };

  const handleOtpContinue = () => {
    if (!verifyOtp(otp)) {
      toast.error("Invalid OTP. Use 1234 for now.");
      return;
    }
    setStep("set-pin");
  };

  const handleSetPin = () => {
    if (pin.length < 4) {
      toast.error("PIN must be at least 4 digits.");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("PINs do not match.");
      return;
    }
    onLogin(normalizedPhone, pin);
    toast.success("PIN set. You're in!");
  };

  const handlePinLogin = () => {
    if (!verifyPin(normalizedPhone, pin)) {
      toast.error("Wrong PIN. Try again.");
      return;
    }
    onLogin(normalizedPhone);
    toast.success("Welcome back.");
  };

  const goBack = () => {
    if (step === "otp" || step === "pin") {
      setStep("phone");
      setOtp("");
      setPin("");
      return;
    }
    if (step === "set-pin") {
      setStep("otp");
      setPin("");
      setConfirmPin("");
      return;
    }
    if (step === "forgot") {
      setStep("pin");
    }
  };

  const inputClass =
    "h-12 rounded-xl border-border bg-background text-base focus-visible:ring-primary";

  return (
    <div className="app-scroll flex h-[100dvh] flex-col bg-background px-5 pb-8 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <header className="mb-8 text-center slide-up">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">Daylog</p>
          <h1 className="mt-2 font-serif text-[40px] leading-[0.95]">Sign in</h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            {step === "phone" && "Enter your phone number to continue."}
            {step === "otp" && "We sent a code — use 1234 for now."}
            {step === "set-pin" && "Create a PIN you'll use next time."}
            {step === "pin" && "Enter your PIN to open your journal."}
            {step === "forgot" && "Need help signing in?"}
          </p>
        </header>

        <div className="rounded-2xl border border-border paper p-5 slide-up-1">
          {step !== "phone" && step !== "forgot" ? (
            <button
              type="button"
              onClick={goBack}
              className="mb-4 inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" /> Back
            </button>
          ) : null}

          {step === "phone" ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
                  Phone number
                </label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className={inputClass}
                />
              </div>
              <Button
                type="button"
                className="h-12 w-full rounded-xl"
                disabled={!isPhoneValid}
                onClick={handlePhoneContinue}
              >
                Continue
              </Button>
            </div>
          ) : null}

          {step === "otp" ? (
            <div className="space-y-4">
              <p className="font-mono text-[12px] text-muted-foreground">
                {formatPhoneDisplay(normalizedPhone)}
              </p>
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
                  OTP
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="1234"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className={`${inputClass} text-center font-mono tracking-[0.3em]`}
                />
              </div>
              <Button type="button" className="h-12 w-full rounded-xl" onClick={handleOtpContinue}>
                Verify
              </Button>
            </div>
          ) : null}

          {step === "set-pin" ? (
            <div className="space-y-4">
              <p className="font-mono text-[12px] text-muted-foreground">
                {formatPhoneDisplay(normalizedPhone)}
              </p>
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
                  New PIN
                </label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className={`${inputClass} text-center font-mono tracking-[0.3em]`}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
                  Confirm PIN
                </label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className={`${inputClass} text-center font-mono tracking-[0.3em]`}
                />
              </div>
              <Button
                type="button"
                className="h-12 w-full rounded-xl"
                disabled={pin.length < 4 || confirmPin.length < 4}
                onClick={handleSetPin}
              >
                Save PIN & continue
              </Button>
            </div>
          ) : null}

          {step === "pin" ? (
            <div className="space-y-4">
              <p className="font-mono text-[12px] text-muted-foreground">
                {formatPhoneDisplay(normalizedPhone)}
              </p>
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
                  PIN
                </label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePinLogin();
                  }}
                  className={`${inputClass} text-center font-mono tracking-[0.3em]`}
                />
              </div>
              <Button type="button" className="h-12 w-full rounded-xl" onClick={handlePinLogin}>
                Sign in
              </Button>
              <button
                type="button"
                onClick={() => setStep("forgot")}
                className="w-full text-center text-[12px] text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
              >
                Forgot PIN?
              </button>
            </div>
          ) : null}

          {step === "forgot" ? (
            <div className="space-y-4 text-center">
              <p className="text-[14px] leading-relaxed text-muted-foreground">
                Contact admin to reset your PIN.
              </p>
              <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={goBack}>
                Back to sign in
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
