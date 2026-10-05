'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchAppointmentById } from '@/store/slices/appointmentsSlice';
import {
  ArrowRightIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  LinkIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const statusLabels = {
  scheduled: 'مجدولة',
  rescheduled: 'أعيد جدولتها',
  completed: 'مكتملة',
  cancelled: 'ملغاة',
  no_show: 'لم يحضر',
};

const statusColors = {
  scheduled: 'bg-tint text-on-tint-strong',
  rescheduled: 'bg-warning-100 text-warning-800',
  completed: 'bg-success-100 text-success-800',
  cancelled: 'bg-danger-100 text-danger-800',
  no_show: 'bg-dark-lighter/10 text-text',
};

export default function AppointmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentAppointment, loading, error } = useAppSelector((state) => state.appointments);

  useEffect(() => {
    if (params.id) {
      dispatch(fetchAppointmentById(params.id));
    }
  }, [params.id, dispatch]);

  useEffect(() => {
    if (error) {
      const errorMessage = error?.message || error?.detail || 'حدث خطأ أثناء جلب تفاصيل الموعد';
      toast.error(errorMessage);
      // إعادة توجيه إلى قائمة المواعيد بعد 2 ثانية
      setTimeout(() => {
        router.push('/dashboard/appointments');
      }, 2000);
    }
  }, [error, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-sm text-text-secondary" style={{ fontFamily: 'inherit' }}>
            جاري تحميل تفاصيل الموعد...
          </p>
        </div>
      </div>
    );
  }

  if (!currentAppointment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-text-secondary mb-4" />
          <p className="text-base font-semibold text-text" style={{ fontFamily: 'inherit' }}>
            الموعد غير موجود
          </p>
          <p className="mt-2 text-sm text-text-secondary" style={{ fontFamily: 'inherit' }}>
            لا يمكن العثور على الموعد المطلوب
          </p>
          <button
            onClick={() => router.push('/dashboard/appointments')}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-light hover:bg-primary-hover transition-colors"
            style={{ fontFamily: 'inherit' }}
          >
            العودة إلى قائمة المواعيد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/appointments')}
            className="flex items-center gap-2 rounded-lg bg-primary-muted px-4 py-2 text-sm font-medium text-on-tint hover:bg-tint-hover transition-colors"
            style={{ fontFamily: 'inherit' }}
          >
            <ArrowRightIcon className="h-5 w-5" />
            العودة
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text" style={{ fontFamily: 'inherit' }}>
              تفاصيل الموعد
            </h1>
            <p className="mt-1 text-sm text-text-secondary" style={{ fontFamily: 'inherit' }}>
              معلومات تفصيلية عن الموعد
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap ${
            statusColors[currentAppointment.status] || statusColors.scheduled
          }`}
          style={{ fontFamily: 'inherit' }}
        >
          {statusLabels[currentAppointment.status] || currentAppointment.status}
        </span>
      </div>

      {/* Appointment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="rounded-lg bg-surface border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-text mb-4" style={{ fontFamily: 'inherit' }}>
              معلومات الموعد
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <CalendarIcon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-secondary mb-1" style={{ fontFamily: 'inherit' }}>
                    التاريخ والوقت
                  </p>
                  <p className="text-base font-semibold text-text" style={{ fontFamily: 'inherit' }}>
                    {currentAppointment.scheduled_at
                      ? new Date(currentAppointment.scheduled_at).toLocaleString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'غير محدد'}
                  </p>
                </div>
              </div>

              {currentAppointment.duration_minutes && (
                <div className="flex items-start gap-4">
                  <ClockIcon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-secondary mb-1" style={{ fontFamily: 'inherit' }}>
                      المدة
                    </p>
                    <p className="text-base font-semibold text-text" style={{ fontFamily: 'inherit' }}>
                      {currentAppointment.duration_minutes} دقيقة
                    </p>
                  </div>
                </div>
              )}

              {currentAppointment.location && (
                <div className="flex items-start gap-4">
                  <BuildingOfficeIcon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-secondary mb-1" style={{ fontFamily: 'inherit' }}>
                      الموقع
                    </p>
                    <p className="text-base font-semibold text-text" style={{ fontFamily: 'inherit' }}>
                      {currentAppointment.location}
                    </p>
                  </div>
                </div>
              )}

              {currentAppointment.telehealth_link && (
                <div className="flex items-start gap-4">
                  <LinkIcon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-secondary mb-1" style={{ fontFamily: 'inherit' }}>
                      رابط الاستشارة عن بُعد
                    </p>
                    <a
                      href={currentAppointment.telehealth_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-semibold text-link hover:text-on-tint hover:underline break-all"
                      style={{ fontFamily: 'inherit' }}
                    >
                      {currentAppointment.telehealth_link}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <ClipboardDocumentCheckIcon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-secondary mb-1" style={{ fontFamily: 'inherit' }}>
                    نوع الموعد
                  </p>
                  <p className="text-base font-semibold text-text" style={{ fontFamily: 'inherit' }}>
                    {currentAppointment.is_follow_up ? 'موعد متابعة' : 'موعد جديد'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {currentAppointment.notes && (
            <div className="rounded-lg bg-surface border border-border p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-text mb-4" style={{ fontFamily: 'inherit' }}>
                ملاحظات
              </h2>
              <div className="flex items-start gap-4">
                <DocumentTextIcon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <p className="text-sm text-text-secondary leading-relaxed flex-1" style={{ fontFamily: 'inherit' }}>
                  {currentAppointment.notes}
                </p>
              </div>
            </div>
          )}

          {/* Case Information */}
          {currentAppointment.case && (
            <div className="rounded-lg bg-surface border border-border p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-text mb-4" style={{ fontFamily: 'inherit' }}>
                الحالة المرتبطة
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary mb-1" style={{ fontFamily: 'inherit' }}>
                    عنوان الحالة
                  </p>
                  <p className="text-base font-semibold text-text" style={{ fontFamily: 'inherit' }}>
                    {typeof currentAppointment.case === 'object'
                      ? currentAppointment.case.title || 'حالة سريرية'
                      : 'حالة سريرية'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const caseId = typeof currentAppointment.case === 'object'
                      ? currentAppointment.case.id
                      : currentAppointment.case;
                    if (caseId) {
                      router.push(`/dashboard/cases/${caseId}`);
                    }
                  }}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-light hover:bg-primary-hover transition-colors"
                  style={{ fontFamily: 'inherit' }}
                >
                  عرض الحالة
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Participants */}
          <div className="rounded-lg bg-surface border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-text mb-4" style={{ fontFamily: 'inherit' }}>
              المشاركون
            </h2>
            <div className="space-y-4">
              {currentAppointment.patient && (
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-tint flex items-center justify-center flex-shrink-0">
                    <UserIcon className="h-6 w-6 text-link" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-secondary mb-1" style={{ fontFamily: 'inherit' }}>
                      المريض
                    </p>
                    <p className="text-sm font-semibold text-text" style={{ fontFamily: 'inherit' }}>
                      {typeof currentAppointment.patient === 'object'
                        ? `${currentAppointment.patient.first_name || ''} ${currentAppointment.patient.last_name || ''}`.trim() || 'مريض'
                        : 'مريض'}
                    </p>
                  </div>
                </div>
              )}

              {currentAppointment.student && (
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-tint flex items-center justify-center flex-shrink-0">
                    <UserIcon className="h-6 w-6 text-link" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-secondary mb-1" style={{ fontFamily: 'inherit' }}>
                      الطالب
                    </p>
                    <p className="text-sm font-semibold text-text" style={{ fontFamily: 'inherit' }}>
                      {typeof currentAppointment.student === 'object'
                        ? `${currentAppointment.student.first_name || ''} ${currentAppointment.student.last_name || ''}`.trim() || 'طالب'
                        : 'طالب'}
                    </p>
                  </div>
                </div>
              )}

              {currentAppointment.supervisor && (
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-tint flex items-center justify-center flex-shrink-0">
                    <UserIcon className="h-6 w-6 text-link" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-secondary mb-1" style={{ fontFamily: 'inherit' }}>
                      المشرف
                    </p>
                    <p className="text-sm font-semibold text-text" style={{ fontFamily: 'inherit' }}>
                      {typeof currentAppointment.supervisor === 'object'
                        ? `${currentAppointment.supervisor.first_name || ''} ${currentAppointment.supervisor.last_name || ''}`.trim() || 'مشرف'
                        : 'مشرف'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded-lg bg-surface border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-text mb-4" style={{ fontFamily: 'inherit' }}>
              معلومات إضافية
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-text-secondary mb-1" style={{ fontFamily: 'inherit' }}>
                  تاريخ الإنشاء
                </p>
                <p className="font-medium text-text" style={{ fontFamily: 'inherit' }}>
                  {currentAppointment.created_at
                    ? new Date(currentAppointment.created_at).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'غير محدد'}
                </p>
              </div>
              <div>
                <p className="text-text-secondary mb-1" style={{ fontFamily: 'inherit' }}>
                  آخر تحديث
                </p>
                <p className="font-medium text-text" style={{ fontFamily: 'inherit' }}>
                  {currentAppointment.updated_at
                    ? new Date(currentAppointment.updated_at).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'غير محدد'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

