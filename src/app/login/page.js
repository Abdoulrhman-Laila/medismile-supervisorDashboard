'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { login, clearError, initializeAuth, updateLockoutRemaining } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import ThemeToggle from '@/components/Layout/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated, initialized, lockoutRemaining } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // تجنب مشاكل Hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // تهيئة المصادقة
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // إعادة توجيه إذا كان المستخدم مسجل دخول بالفعل
  useEffect(() => {
    if (initialized && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [initialized, isAuthenticated, router]);

  // مسح الأخطاء عند تغيير القيم
  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [formData, dispatch]);

  // تحديث عداد الحظر كل ثانية
  useEffect(() => {
    if (lockoutRemaining !== null && lockoutRemaining > 0) {
      const interval = setInterval(() => {
        dispatch(updateLockoutRemaining());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutRemaining, dispatch]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'البريد الإلكتروني غير صحيح';
    }
    
    if (!formData.password) {
      errors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 6) {
      errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // منع الإرسال إذا كان الحساب محظوراً
    if (lockoutRemaining !== null && lockoutRemaining > 0) {
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    try {
      // إرسال email و password إلى API
      const result = await dispatch(login({ email: formData.email, password: formData.password }));
      
      if (login.fulfilled.match(result)) {
        toast.success('تم تسجيل الدخول بنجاح', {
          icon: '✅',
          duration: 2000,
        });
        // التوجيه إلى الصفحة الرئيسية للداشبورد
        router.replace('/dashboard');
      } else if (login.rejected.match(result)) {
        // معالجة الأخطاء من API
        const errorPayload = result.payload;
        let errorMessage = 'فشل تسجيل الدخول. يرجى التحقق من البيانات';
        
        // معالجة البنية الجديدة للأخطاء
        if (errorPayload?.message) {
          errorMessage = errorPayload.message;
        } else if (errorPayload?.detail) {
          errorMessage = errorPayload.detail;
        } else if (errorPayload?.error) {
          errorMessage = typeof errorPayload.error === 'string' 
            ? errorPayload.error 
            : errorPayload.error?.message || errorMessage;
        } else if (typeof errorPayload === 'string') {
          errorMessage = errorPayload;
        }
        
        toast.error(errorMessage, {
          duration: 4000,
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('حدث خطأ أثناء تسجيل الدخول', {
        duration: 4000,
      });
    }
  };

  const fieldClass = (hasError) =>
    `w-full rounded-xl border px-4 py-3.5 pr-12 text-base text-text placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-ring ${
      hasError ? 'border-danger-400 bg-danger-50' : 'border-border-strong bg-background'
    }`;

  return (
    <div dir="ltr" className="flex min-h-screen bg-background">
      <section dir="rtl" className="relative flex w-full items-center justify-center overflow-hidden bg-background px-4 py-16 text-text sm:px-8 lg:w-1/2">
        <div className="pointer-events-none absolute -left-16 top-24 h-48 w-48 rounded-full bg-sky-500/10" />
        <div className="pointer-events-none absolute -bottom-20 right-10 h-56 w-56 rounded-full bg-sky-400/10" />

        <div className="absolute left-5 top-5 z-10">
          <ThemeToggle variant="onDark" />
        </div>

        <div className="relative w-full max-w-md rounded-2xl border border-border-strong bg-surface p-7 shadow-xl sm:p-8">
          <h1 className="text-3xl font-bold text-text" style={{ fontFamily: 'inherit' }}>أهلاً بك</h1>
          <p className="mt-2 text-sm text-text-secondary" style={{ fontFamily: 'inherit' }}>
            سجّل الدخول للمتابعة إلى لوحة التحكم
          </p>

          {error && (
            <p className="mt-5 text-sm text-danger-600" style={{ fontFamily: 'inherit' }}>
              {error.message || error.error || error.detail || 'حدث خطأ أثناء تسجيل الدخول'}
            </p>
          )}

          {lockoutRemaining !== null && lockoutRemaining > 0 && (
            <div className="mt-5 rounded-xl border border-danger-200 bg-danger-50 p-4">
              <p className="text-sm font-semibold text-danger-700" style={{ fontFamily: 'inherit' }}>
                تم الحظر بسبب 5 محاولات فاشلة
              </p>
              <p className="mt-1 text-sm text-danger-600" style={{ fontFamily: 'inherit' }}>
                يرجى المحاولة مرة أخرى بعد {lockoutRemaining} ثانية
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-text-secondary" style={{ fontFamily: 'inherit' }}>
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (formErrors.email) {
                      setFormErrors({ ...formErrors, email: '' });
                    }
                  }}
                  className={fieldClass(formErrors.email)}
                  style={{ fontFamily: 'inherit' }}
                  placeholder="name@example.com"
                  disabled={loading || (lockoutRemaining !== null && lockoutRemaining > 0)}
                  suppressHydrationWarning
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                  <svg className="h-5 w-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              {formErrors.email && (
                <p className="mt-2 text-sm text-danger-600" style={{ fontFamily: 'inherit' }}>{formErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm text-text-secondary" style={{ fontFamily: 'inherit' }}>
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (formErrors.password) {
                      setFormErrors({ ...formErrors, password: '' });
                    }
                  }}
                  className={`${fieldClass(formErrors.password)} !pl-12`}
                  style={{ fontFamily: 'inherit' }}
                  placeholder="••••••••"
                  disabled={loading || (lockoutRemaining !== null && lockoutRemaining > 0)}
                  suppressHydrationWarning
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-text-secondary">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-secondary hover:text-text focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-2 text-sm text-danger-600" style={{ fontFamily: 'inherit' }}>{formErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (lockoutRemaining !== null && lockoutRemaining > 0)}
              className="w-full rounded-xl bg-primary px-4 py-3.5 text-base font-semibold text-primary-foreground hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              style={{ fontFamily: 'inherit' }}
              suppressHydrationWarning
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>جاري تسجيل الدخول...</span>
                </span>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>
        </div>
      </section>

      <section dir="rtl" className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-sky-500 px-10 py-8 text-light lg:flex xl:px-16">
        <div className="pointer-events-none absolute -left-16 top-16 h-56 w-56 rounded-full bg-sky-400/40" />
        <div className="pointer-events-none absolute bottom-10 right-8 h-64 w-64 rounded-full bg-sky-300/30" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-sky-600/30" />

        <div className="relative flex items-center gap-3">
          <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/30 bg-light">
            <Image
              src="/Screenshot_٢٠٢٥٠٩٠٨-١٢٣٢٥٥.jpg"
              alt="MediSmile Logo"
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="text-lg font-bold leading-none">MediSmile</p>
            <p className="mt-1 text-sm text-sky-100">لوحة المشرف</p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-sm">
            مشرف
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 2 8l10 5 10-5-10-5Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 10.5V16c0 1.5 2.7 3.5 6 3.5s6-2 6-3.5v-5.5" />
            </svg>
          </span>
          <h2 className="mt-6 text-4xl font-bold leading-snug xl:text-5xl" style={{ fontFamily: 'inherit' }}>
            إدارة التعليم السريري في مكان واحد
          </h2>
          <p className="mt-4 max-w-md text-base leading-7 text-sky-50" style={{ fontFamily: 'inherit' }}>
            الوصول إلى رعاية الأسنان التقنية والتعليم عبر لوحة تحكم آمنة للمشرفين.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {['حالات', 'تقييمات', 'تقارير'].map((item) => (
              <span key={item} className="rounded-full border border-white/40 bg-white/10 px-5 py-2 text-sm">
                {item}
              </span>
            ))}
          </div>
        </div>

        <p className="relative text-right text-sm text-sky-100" dir="ltr">MediSmile 2026 ©</p>
      </section>
    </div>
  );
}
