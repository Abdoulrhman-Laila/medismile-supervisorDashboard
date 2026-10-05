'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { createSupportTicket, clearError, clearSuccess } from '@/store/slices/supportSlice';
import {
  LifebuoyIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function SupportPage() {
  const dispatch = useAppDispatch();
  const { loading, error, success, ticketId } = useAppSelector((state) => state.support);

  const [formData, setFormData] = useState({
    category: 'technical',
    subject: '',
    description: '',
    priority: 'medium',
    related_app: 'attachments',
  });

  const categories = ['technical', 'billing', 'other'];
  const priorities = ['low', 'medium', 'high'];
  const apps = ['attachments', 'cases', 'appointments', 'community', 'notifications'];

  useEffect(() => {
    dispatch(clearError());
    dispatch(clearSuccess());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      toast.success('تم إرسال تذكرة الدعم بنجاح');
      setFormData({
        category: 'technical',
        subject: '',
        description: '',
        priority: 'medium',
        related_app: 'attachments',
      });
      setTimeout(() => dispatch(clearSuccess()), 3000);
    }
  }, [success, dispatch]);

  useEffect(() => {
    if (error) {
      const errorMessage = error?.detail || error?.message || error?.error || 'حدث خطأ أثناء إرسال تذكرة الدعم';
      toast.error(errorMessage);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject.trim()) {
      toast.error('الرجاء إدخال عنوان المشكلة');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('الرجاء إدخال وصف المشكلة');
      return;
    }

    // التحقق من صحة الأولوية
    if (!priorities.includes(formData.priority.toLowerCase())) {
      toast.error('الأولوية يجب أن تكون: low أو medium أو high');
      return;
    }

    try {
      const result = await dispatch(createSupportTicket(formData));
      if (createSupportTicket.fulfilled.match(result)) {
        // النجاح سيتم التعامل معه في useEffect
      }
    } catch (err) {
      // الأخطاء سيتم التعامل معها في useEffect
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-surface rounded-lg border border-border shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary-muted">
            <LifebuoyIcon className="h-6 w-6 text-link" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text" style={{ fontFamily: 'inherit' }}>
              الدعم الفني
            </h1>
            <p className="text-sm text-text-secondary mt-1" style={{ fontFamily: 'inherit' }}>
              أرسل مشكلتك أو استفسارك وسنقوم بالرد عليك في أقرب وقت ممكن
            </p>
          </div>
        </div>
      </div>

      {/* Support Form */}
      <div className="bg-surface rounded-lg border border-border shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-text mb-2">
              فئة المشكلة
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-sm text-text focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              disabled={loading}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-semibold text-text mb-2">
              عنوان المشكلة <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="مثال: مشكلة في رفع الملفات"
              className="w-full rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-sm text-text placeholder-text-secondary focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-text mb-2">
              وصف المشكلة <span className="text-danger-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              placeholder="يرجى وصف المشكلة بالتفصيل..."
              className="w-full rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-sm text-text placeholder-text-secondary focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring transition-colors resize-none"
              disabled={loading}
            />
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-semibold text-text mb-2">
              الأولوية
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-sm text-text focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              disabled={loading}
            >
              {priorities.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Related App */}
          <div>
            <label htmlFor="related_app" className="block text-sm font-semibold text-text mb-2">
              التطبيق المرتبط
            </label>
            <select
              id="related_app"
              name="related_app"
              value={formData.related_app}
              onChange={handleChange}
              className="w-full rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-sm text-text focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              disabled={loading}
            >
              {apps.map((app) => (
                <option key={app} value={app}>{app}</option>
              ))}
            </select>
          </div>

          {/* Success Message */}
          {success && (
            <div className="rounded-lg bg-primary-muted border border-border-strong p-4 flex items-start gap-3">
              <CheckCircleIcon className="h-5 w-5 text-link flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-on-tint-deep">تم إرسال تذكرة الدعم بنجاح</p>
                {ticketId && <p className="text-xs text-on-tint mt-1">رقم التذكرة: {ticketId}</p>}
                <p className="text-xs text-on-tint mt-1">سيتم الرد عليك في أقرب وقت ممكن</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !success && (
            <div className="rounded-lg bg-danger-50 border border-danger-200 p-4 flex items-start gap-3">
              <XCircleIcon className="h-5 w-5 text-danger-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-danger-900">حدث خطأ أثناء إرسال التذكرة</p>
                <p className="text-xs text-danger-700 mt-1">{error?.detail || error?.message || 'يرجى المحاولة مرة أخرى'}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-light hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-light border-t-transparent"></div>
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4" />
                  <span>إرسال تذكرة الدعم</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}









