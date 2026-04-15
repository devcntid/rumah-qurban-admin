"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { AlertCircle, Info } from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };

  const getErrorMessage = () => {
    switch (error) {
      case "EmailNotRegistered":
        return "Email Anda tidak terdaftar di sistem. Silakan hubungi administrator untuk mendaftar.";
      case "AccountInactive":
        return "Akun Anda tidak aktif. Silakan hubungi administrator.";
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
      case "EmailCreateAccount":
      case "Callback":
        return "Terjadi kesalahan saat login. Silakan coba lagi.";
      default:
        return null;
    }
  };

  const errorMessage = getErrorMessage();

  return (
    <div className="min-h-screen relative flex items-center justify-start">
      {/* Full Screen Background Image */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.pexels.com/photos/2148933/pexels-photo-2148933.jpeg?auto=compress&cs=tinysrgb&w=1920')",
          }}
        />
        <div className="absolute inset-0 bg-white/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800/40 via-slate-600/20 to-transparent" />
      </div>

      {/* Login Form - Left Side */}
      <div className="relative z-10 w-full max-w-md mx-6 lg:ml-20 xl:ml-32">
        {/* Logo */}
        <div className="mb-8">
          <div className="flex justify-start mb-4">
            <Image
              src="/logo-agro.png"
              alt="Rumah Qurban"
              width={220}
              height={60}
              className="h-14 w-auto drop-shadow-lg"
              priority
            />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
            Admin Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-white/20 bg-white/95 backdrop-blur-md shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Masuk ke Akun Anda</h2>
            <p className="mt-2 text-sm text-slate-600">
              Gunakan akun Google yang terdaftar
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                <span>Menghubungkan...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          <div className="mt-6 rounded-lg bg-amber-50 border border-amber-200 p-4 flex gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-amber-900 mb-1">
                Hanya email yang terdaftar dapat masuk
              </p>
              <p className="text-xs text-amber-700">
                Belum terdaftar?{" "}
                <a
                  href="mailto:admin@rumahqurban.com"
                  className="font-semibold underline hover:text-amber-900"
                >
                  Hubungi administrator
                </a>
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-white/60">
          &copy; {new Date().getFullYear()} Rumah Qurban. All rights reserved.
        </p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <div className="absolute inset-0 z-0 bg-slate-900" />
      <div className="relative z-10 w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginContent />
    </Suspense>
  );
}

