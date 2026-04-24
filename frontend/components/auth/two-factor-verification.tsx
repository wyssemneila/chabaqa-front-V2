"use client"

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck } from 'lucide-react';

interface TwoFactorVerificationProps {
  userId: string;
  onVerify: (userId: string, code: string) => Promise<void>;
  onResend: () => Promise<void>;
  error?: string | null;
  successMessage?: string | null;
}

export function TwoFactorVerification({ userId, onVerify, onResend, error, successMessage }: TwoFactorVerificationProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Auto-focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6 || isVerifying) return;
    setIsVerifying(true);
    try {
      await onVerify(userId, fullCode);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      await onResend();
      // Clear code and reset focus
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setTimeout(() => setIsResending(false), 10000);
    } catch {
      setIsResending(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input when a digit is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (value && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        setTimeout(() => {
          handleSubmit();
        }, 100);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('');
        const newCode = [...code];
        digits.forEach((digit, i) => {
          if (index + i < 6) {
            newCode[index + i] = digit;
          }
        });
        setCode(newCode);
        const nextIndex = Math.min(index + digits.length, 5);
        inputRefs.current[nextIndex]?.focus();
      });
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const digits = pastedData.split('');
    const newCode = [...code];
    digits.forEach((digit, i) => {
      if (i < 6) {
        newCode[i] = digit;
      }
    });
    setCode(newCode);
    const nextIndex = Math.min(digits.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="backdrop-blur-xl bg-white/30 border border-white/50 p-5 sm:p-7 md:p-9 rounded-2xl sm:rounded-3xl shadow-2xl animate-fade-in-delay-600 w-full max-w-lg mx-auto">
      <div className="text-center mb-7 sm:mb-9">
        <div className="flex justify-center mb-3 sm:mb-4">
          <ShieldCheck className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h2>
        <p className="text-sm sm:text-base text-gray-600 px-2">Enter the 6-digit verification code sent to your email.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-7">
        {/* 6 Individual Digit Inputs */}
        <div className="flex justify-center gap-2.5 sm:gap-3 mb-1 px-1 sm:px-2">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              maxLength={1}
              disabled={isVerifying}
              className="w-11 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 text-center text-xl sm:text-2xl font-bold text-gray-900 bg-white/90 backdrop-blur-sm border-2 rounded-lg sm:rounded-xl transition-all duration-300 focus:border-[#8e78fb] focus:ring-2 sm:focus:ring-4 focus:ring-[#8e78fb]/20 focus:scale-105 sm:focus:scale-110 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex-shrink-0"
              autoComplete="off"
            />
          ))}
        </div>
        <p className="text-center text-xs text-gray-600">Tip: you can paste the full code.</p>

        {/* Error Message */}
        {error && (
          <div className="p-2 sm:p-3 bg-red-100/80 backdrop-blur-sm border border-red-200 rounded-xl sm:rounded-2xl">
            <p className="text-xs sm:text-sm text-red-700 text-center px-2">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="p-2 sm:p-3 bg-green-100/80 backdrop-blur-sm border border-green-200 rounded-xl sm:rounded-2xl">
            <p className="text-xs sm:text-sm text-green-700 text-center px-2">{successMessage}</p>
          </div>
        )}

        {/* Verify Button */}
        <Button
          type="submit"
          disabled={isVerifying || code.join('').length !== 6}
          className="w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#8e78fb] to-[#47c7ea] text-white font-semibold text-base sm:text-lg shadow-lg hover:shadow-2xl transition-all duration-300 border-0 relative overflow-hidden group active:scale-95 sm:hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span className="relative z-10">Verify</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#7c66e9] to-[#3bb5d6] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </>
          )}
        </Button>
      </form>

      {/* Resend Code Link */}
      <div className="mt-6 sm:mt-8 text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="text-xs sm:text-sm text-[#86e4fd] hover:text-[#74d4f0] font-medium transition-all duration-200 hover:underline disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        >
          {isResending ? 'Code sent!' : 'Resend Code'}
        </button>
      </div>
    </div>
  );
}
