'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchCaseById,
  updateCase,
  supervisorDecision,
  updateCaseStatus,
  assignSupervisor,
} from '@/store/slices/casesSlice';
import { fetchSessions, reviewSession, fetchSessionById } from '@/store/slices/sessionsSlice';
import {
  ArrowRightIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const statusLabels = {
  new: 'جديدة',
  pending_assignment: 'في انتظار الإسناد',
  assigned: 'مسندة',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتملة',
  closed: 'مغلقة',
};

const priorityLabels = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة',
};

const priorityColors = {
  low: 'bg-primary-muted text-on-tint',
  medium: 'bg-tint text-on-tint-strong',
  high: 'bg-accent-soft text-on-tint-deep',
  urgent: 'bg-primary text-light',
};

const statusColors = {
  new: 'bg-primary-muted text-on-tint',
  accepted: 'bg-success-100 text-success-800',
  rejected: 'bg-danger-100 text-danger-800',
  needs_assignment_approval: 'bg-warning-100 text-warning-800',
  assigned: 'bg-tint-strong text-on-tint-strong',
  in_progress: 'bg-accent text-light',
  completed: 'bg-primary text-light',
  closed: 'bg-dark-lighter text-light',
};

export default function CaseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentCase, loading } = useAppSelector((state) => state.cases);
  const { sessions, currentSession } = useAppSelector((state) => state.sessions);

  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: '',
    is_public: false,
    status: '',
  });
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionFeedback, setSessionFeedback] = useState('');
  const [showSupervisorDecisionModal, setShowSupervisorDecisionModal] = useState(false);
  const [supervisorDecisionType, setSupervisorDecisionType] = useState('accept'); // 'accept' or 'reject'
  const [supervisorDecisionNote, setSupervisorDecisionNote] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    if (params.id) {
      dispatch(fetchCaseById(params.id));
      dispatch(fetchSessions({ caseId: params.id }));
    }
  }, [params.id, dispatch]);

  useEffect(() => {
    if (currentCase) {
      setEditForm({
        title: currentCase.title || '',
        description: currentCase.description || '',
        priority: currentCase.priority || '',
        is_public: currentCase.is_public || false,
        status: currentCase.status || '',
      });
    }
  }, [currentCase]);

  const handleUpdateCase = async () => {
    try {
      const result = await dispatch(
        updateCase({ caseId: params.id, data: editForm })
      );
      // التحقق من أن العملية نجحت
      if (updateCase.fulfilled.match(result)) {
        toast.success('تم تحديث الحالة بنجاح');
        setIsEditing(false);
        // تحديث البيانات من API
        dispatch(fetchCaseById(params.id));
      } else if (updateCase.rejected.match(result)) {
        // معالجة الخطأ بشكل أفضل
        const errorPayload = result.payload;
        const errorMessage = errorPayload?.detail || 
                           errorPayload?.message || 
                           errorPayload?.error ||
                           errorPayload?.status ||
                           (typeof errorPayload === 'string' ? errorPayload : 'فشل تحديث الحالة');
        toast.error(errorMessage);
      }
    } catch (error) {
      // معالجة الأخطاء غير المتوقعة
      console.error('Error updating case:', error);
      toast.error('حدث خطأ أثناء تحديث الحالة');
    }
  };


  const handleReviewSession = async (sessionId, status) => {
    try {
      const result = await dispatch(
        reviewSession({
          sessionId,
          status,
          supervisor_feedback: sessionFeedback,
        })
      );
      if (reviewSession.fulfilled.match(result)) {
        toast.success(
          status === 'approved' ? 'تمت الموافقة على الجلسة' : 'تم رفض الجلسة'
        );
        setShowSessionModal(false);
        setSelectedSession(null);
        setSessionFeedback('');
        dispatch(fetchCaseById(params.id));
        dispatch(fetchSessions({ caseId: params.id }));
      } else {
        toast.error(result.payload?.message || 'فشل مراجعة الجلسة');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء مراجعة الجلسة');
    }
  };

  const getNextStatus = (currentStatus) => {
    // حسب التوثيق الجديد
    const transitions = {
      new: null, // يحتاج قرار المشرف أولاً
      accepted: 'needs_assignment_approval',
      needs_assignment_approval: 'assigned',
      assigned: 'in_progress',
      in_progress: 'completed',
      completed: 'closed',
    };
    return transitions[currentStatus];
  };

  const handleStatusChange = async (status) => {
    try {
      const result = await dispatch(
        updateCaseStatus({ caseId: params.id, status })
      );
      
      // التحقق من أن العملية نجحت
      if (updateCaseStatus.fulfilled.match(result)) {
        toast.success('تم تحديث حالة الحالة بنجاح');
        dispatch(fetchCaseById(params.id));
        setShowStatusModal(false);
        setNewStatus('');
      } else if (updateCaseStatus.rejected.match(result)) {
        // معالجة الخطأ بشكل أفضل
        const errorPayload = result.payload;
        const errorMessage = errorPayload?.detail || 
                           errorPayload?.message || 
                           errorPayload?.error ||
                           errorPayload?.status ||
                           (typeof errorPayload === 'string' ? errorPayload : 'فشل تحديث حالة الحالة');
        toast.error(errorMessage);
      }
    } catch (error) {
      // معالجة الأخطاء غير المتوقعة
      console.error('Error updating case status:', error);
      toast.error('حدث خطأ أثناء تحديث حالة الحالة');
    }
  };

  const handleSupervisorDecision = async () => {
    try {
      const result = await dispatch(
        supervisorDecision({
          caseId: params.id,
          decision: supervisorDecisionType, // 'accept' or 'reject'
          note: supervisorDecisionNote || undefined,
        })
      );
      if (supervisorDecision.fulfilled.match(result)) {
        toast.success(
          supervisorDecisionType === 'accept' ? 'تم قبول الحالة' : 'تم رفض الحالة'
        );
        setShowSupervisorDecisionModal(false);
        setSupervisorDecisionNote('');
        dispatch(fetchCaseById(params.id));
      } else {
        const errorMessage = result.payload?.detail || 
                             result.payload?.message || 
                             result.payload?.error ||
                             'فشل معالجة القرار';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء معالجة القرار');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-sm font-semibold text-text-secondary leading-relaxed" style={{ fontFamily: 'inherit' }}>
            جاري تحميل الحالة...
          </p>
        </div>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div className="text-center py-12">
        <p className="text-base font-semibold text-text mb-2" style={{ fontFamily: 'inherit' }}>
          الحالة غير موجودة
        </p>
        <button
          onClick={() => router.push('/dashboard/cases')}
          className="mt-4 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-light hover:bg-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
          style={{ fontFamily: 'inherit' }}
        >
          العودة إلى قائمة الحالات
        </button>
      </div>
    );
  }

  
  const sessionsNeedingReview = Array.isArray(sessions)
    ? sessions.filter((s) => s.status === 'completed' || s.status === 'needs_review')
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/cases')}
              className="flex items-center justify-center h-10 w-10 rounded-lg border border-border-strong bg-surface text-text-secondary hover:text-text hover:bg-primary-muted hover:border-border-hover transition-all focus:outline-none focus:ring-2 focus:ring-ring/20"
            >
              <ArrowRightIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2" style={{ fontFamily: 'inherit' }}>
                {isEditing ? 'تعديل الحالة' : currentCase.title}
              </h1>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed" style={{ fontFamily: 'inherit' }}>
                {currentCase.patient?.first_name} {currentCase.patient?.last_name}
              </p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-light hover:bg-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
              style={{ fontFamily: 'inherit' }}
            >
              <PencilIcon className="h-5 w-5" />
              تعديل
            </button>
          )}
        </div>
      </div>

      {/* Status and Priority Badges */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
            statusColors[currentCase.status] || statusColors.new
          }`}
          style={{ fontFamily: 'inherit' }}
        >
          {statusLabels[currentCase.status] || currentCase.status}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
            priorityColors[currentCase.priority] || priorityColors.medium
          }`}
          style={{ fontFamily: 'inherit' }}
        >
          {priorityLabels[currentCase.priority] || currentCase.priority}
        </span>
        {currentCase.is_public && (
          <span className="rounded-full bg-tint px-3 py-1 text-xs font-semibold text-on-tint whitespace-nowrap" style={{ fontFamily: 'inherit' }}>
            عامة
          </span>
        )}
        {sessionsNeedingReview.length > 0 && (
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-on-tint-deep whitespace-nowrap" style={{ fontFamily: 'inherit' }}>
            {sessionsNeedingReview.length} جلسة تحتاج مراجعة
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-6 overflow-x-auto">
          {[
            { id: 'details', label: 'التفاصيل' },
            { id: 'sessions', label: 'الجلسات', badge: sessionsNeedingReview.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-link'
                  : 'text-text-secondary hover:text-text'
              }`}
              style={{ fontFamily: 'inherit' }}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span className="rounded-full bg-tint px-2 py-0.5 text-xs font-semibold text-on-tint">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'details' && (
          <div className="space-y-6">
            {isEditing ? (
              <div className="rounded-lg bg-surface border border-border p-5 sm:p-6 shadow-sm space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-text mb-2.5" style={{ fontFamily: 'inherit' }}>
                    العنوان
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="w-full rounded-lg border border-border-strong bg-primary-muted px-4 py-2.5 text-sm text-text placeholder-text-secondary/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                    style={{ fontFamily: 'inherit' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text mb-2.5" style={{ fontFamily: 'inherit' }}>
                    الوصف
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={6}
                    className="w-full rounded-lg border border-border-strong bg-primary-muted px-4 py-2.5 text-sm text-text placeholder-text-secondary/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all resize-none"
                    style={{ fontFamily: 'inherit' }}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-text mb-2.5" style={{ fontFamily: 'inherit' }}>
                      الأولوية
                    </label>
                    <select
                      value={editForm.priority}
                      onChange={(e) =>
                        setEditForm({ ...editForm, priority: e.target.value })
                      }
                      className="w-full rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-sm text-text focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                      style={{ fontFamily: 'inherit' }}
                    >
                      {Object.entries(priorityLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text mb-2.5" style={{ fontFamily: 'inherit' }}>
                      حالة الحالة
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm({ ...editForm, status: e.target.value })
                      }
                      className="w-full rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-sm text-text focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                      style={{ fontFamily: 'inherit' }}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={editForm.is_public}
                    onChange={(e) =>
                      setEditForm({ ...editForm, is_public: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-border-hover text-primary focus:ring-ring"
                  />
                  <label htmlFor="is_public" className="text-sm font-medium text-text" style={{ fontFamily: 'inherit' }}>
                    جعل الحالة عامة (متاحة للطلاب)
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleUpdateCase}
                    className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-light hover:bg-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                    style={{ fontFamily: 'inherit' }}
                  >
                    حفظ التغييرات
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        title: currentCase.title || '',
                        description: currentCase.description || '',
                        priority: currentCase.priority || '',
                        is_public: currentCase.is_public || false,
                        status: currentCase.status || '',
                      });
                    }}
                    className="rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-sm font-medium text-text hover:bg-primary-muted hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                    style={{ fontFamily: 'inherit' }}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <div className="rounded-lg bg-surface border border-border p-5 sm:p-6 shadow-sm">
                    <h2 className="text-lg sm:text-xl font-bold text-text mb-4" style={{ fontFamily: 'inherit' }}>
                      وصف الحالة
                    </h2>
                    <p className="text-sm sm:text-base text-text-secondary leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'inherit' }}>
                      {currentCase.description || 'لا يوجد وصف'}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  {currentCase.status !== 'closed' && (
                    <div className="rounded-lg bg-surface border border-border p-5 sm:p-6 shadow-sm">
                      <h2 className="text-lg sm:text-xl font-bold text-text mb-4" style={{ fontFamily: 'inherit' }}>
                        إجراءات سريعة
                      </h2>
                      <div className="flex flex-wrap gap-3">
                        {/* قرار المشرف على حالة جديدة */}
                        {currentCase.status === 'new' && (
                          <>
                            <button
                              onClick={() => {
                                setSupervisorDecisionType('accept');
                                setShowSupervisorDecisionModal(true);
                              }}
                              className="flex items-center gap-2 rounded-lg bg-success-500 px-4 py-2.5 text-sm font-semibold text-light hover:bg-success-600 focus:outline-none focus:ring-2 focus:ring-success-400 focus:ring-offset-2 transition-colors"
                              style={{ fontFamily: 'inherit' }}
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                              قبول الحالة
                            </button>
                            <button
                              onClick={() => {
                                setSupervisorDecisionType('reject');
                                setShowSupervisorDecisionModal(true);
                              }}
                              className="flex items-center gap-2 rounded-lg bg-danger-500 px-4 py-2.5 text-sm font-semibold text-light hover:bg-danger-600 focus:outline-none focus:ring-2 focus:ring-danger-400 focus:ring-offset-2 transition-colors"
                              style={{ fontFamily: 'inherit' }}
                            >
                              <XCircleIcon className="h-5 w-5" />
                              رفض الحالة
                            </button>
                          </>
                        )}
                        {/* تغيير الحالة */}
                        {getNextStatus(currentCase.status) && (
                          <button
                            onClick={() => {
                              setNewStatus(getNextStatus(currentCase.status));
                              setShowStatusModal(true);
                            }}
                            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-light hover:bg-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                            style={{ fontFamily: 'inherit' }}
                          >
                            <ClockIcon className="h-5 w-5" />
                            تغيير إلى {statusLabels[getNextStatus(currentCase.status)]}
                          </button>
                        )}
                        {currentCase.status === 'completed' && (
                          <button
                            onClick={() => {
                              setNewStatus('closed');
                              setShowStatusModal(true);
                            }}
                            className="flex items-center gap-2 rounded-lg bg-dark-lighter px-4 py-2.5 text-sm font-semibold text-light hover:bg-dark focus:outline-none focus:ring-2 focus:ring-dark-lighter focus:ring-offset-2 transition-colors"
                            style={{ fontFamily: 'inherit' }}
                          >
                            إغلاق الحالة
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="rounded-lg bg-surface border border-border p-5 sm:p-6 shadow-sm">
                    <h2 className="text-lg sm:text-xl font-bold text-text mb-4" style={{ fontFamily: 'inherit' }}>
                      معلومات الحالة
                    </h2>
                    <div className="space-y-4 text-sm">
                      <div className="border-b border-border pb-3">
                        <span className="block text-xs font-medium text-text-secondary mb-1.5" style={{ fontFamily: 'inherit' }}>
                          المريض:
                        </span>
                        <p className="text-sm font-semibold text-text leading-relaxed" style={{ fontFamily: 'inherit' }}>
                          {currentCase.patient?.first_name} {currentCase.patient?.last_name}
                        </p>
                      </div>
                      {currentCase.student && (
                        <div className="border-b border-border pb-3">
                          <span className="block text-xs font-medium text-text-secondary mb-1.5" style={{ fontFamily: 'inherit' }}>
                            الطالب المسند:
                          </span>
                          <p className="text-sm font-semibold text-text leading-relaxed" style={{ fontFamily: 'inherit' }}>
                            {currentCase.student?.first_name} {currentCase.student?.last_name}
                          </p>
                        </div>
                      )}
                      <div className="border-b border-border pb-3">
                        <span className="block text-xs font-medium text-text-secondary mb-1.5" style={{ fontFamily: 'inherit' }}>
                          تاريخ الإنشاء:
                        </span>
                        <p className="text-sm font-semibold text-text leading-relaxed" style={{ fontFamily: 'inherit' }}>
                          {new Date(currentCase.created_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      {currentCase.updated_at && (
                        <div>
                          <span className="block text-xs font-medium text-text-secondary mb-1.5" style={{ fontFamily: 'inherit' }}>
                            آخر تحديث:
                          </span>
                          <p className="text-sm font-semibold text-text leading-relaxed" style={{ fontFamily: 'inherit' }}>
                            {new Date(currentCase.updated_at).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="rounded-lg bg-surface border border-border overflow-hidden shadow-sm">
            {!Array.isArray(sessions) || sessions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-base font-semibold text-text" style={{ fontFamily: 'inherit' }}>
                  لا توجد جلسات علاج
                </p>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed" style={{ fontFamily: 'inherit' }}>
                  لم يتم إضافة أي جلسات علاج لهذه الحالة بعد
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sessions.map((session) => (
                  <div key={session.id} className="p-5 sm:p-6 hover:bg-primary-muted transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                          <ClipboardDocumentCheckIcon className="h-5 w-5 text-primary flex-shrink-0" />
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                              session.status === 'approved'
                                ? 'bg-primary text-light'
                                : session.status === 'rejected'
                                ? 'bg-dark-lighter text-light'
                                : 'bg-tint-strong text-on-tint-strong'
                            }`}
                            style={{ fontFamily: 'inherit' }}
                          >
                            {session.status === 'approved'
                              ? 'موافق عليها'
                              : session.status === 'rejected'
                              ? 'مرفوضة'
                              : 'تحتاج مراجعة'}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary mb-4 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'inherit' }}>
                          {session.notes}
                        </p>
                        {session.supervisor_feedback && (
                          <div className="mt-4 p-4 rounded-lg bg-primary-muted border border-border-strong">
                            <p className="text-xs font-semibold text-on-tint-strong mb-2" style={{ fontFamily: 'inherit' }}>
                              ملاحظات المشرف:
                            </p>
                            <p className="text-sm text-on-tint-deep leading-relaxed" style={{ fontFamily: 'inherit' }}>
                              {session.supervisor_feedback}
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-text-secondary mt-4" style={{ fontFamily: 'inherit' }}>
                          {new Date(session.created_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      {(session.status === 'completed' || session.status === 'needs_review') && (
                        <button
                          onClick={async () => {
                            setSelectedSession(session);
                            setSessionFeedback('');
                            // جلب تفاصيل الجلسة الكاملة
                            await dispatch(fetchSessionById(session.id));
                            setShowSessionModal(true);
                          }}
                          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-light hover:bg-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors flex-shrink-0"
                          style={{ fontFamily: 'inherit' }}
                        >
                          مراجعة
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>


      {/* Session Review Modal */}
      {showSessionModal && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-surface border border-border p-5 sm:p-6 max-h-[90vh] overflow-y-auto shadow-lg">
            <h3 className="text-lg sm:text-xl font-bold text-text mb-5" style={{ fontFamily: 'inherit' }}>
              مراجعة الجلسة
            </h3>
            
            {/* Session Details */}
            <div className="space-y-4 mb-5">
              {/* Status */}
              <div className="p-4 rounded-lg bg-primary-muted border border-border">
                <p className="text-xs font-semibold text-text-secondary mb-2.5" style={{ fontFamily: 'inherit' }}>
                  حالة الجلسة:
                </p>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    (currentSession?.status || selectedSession.status) === 'approved'
                      ? 'bg-primary text-light'
                      : (currentSession?.status || selectedSession.status) === 'rejected'
                      ? 'bg-dark-lighter text-light'
                      : 'bg-tint-strong text-on-tint-strong'
                  }`}
                  style={{ fontFamily: 'inherit' }}
                >
                  {(currentSession?.status || selectedSession.status) === 'approved'
                    ? 'موافق عليها'
                    : (currentSession?.status || selectedSession.status) === 'rejected'
                    ? 'مرفوضة'
                    : 'تحتاج مراجعة'}
                </span>
              </div>

              {/* Notes */}
              <div className="p-4 rounded-lg bg-primary-muted border border-border">
                <p className="text-xs font-semibold text-text-secondary mb-2.5" style={{ fontFamily: 'inherit' }}>
                  ملاحظات الطالب:
                </p>
                <p className="text-sm text-text leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'inherit' }}>
                  {currentSession?.notes || selectedSession.notes || 'لا توجد ملاحظات'}
                </p>
              </div>

              {/* Attachments */}
              {currentSession?.attachments && currentSession.attachments.length > 0 && (
                <div className="p-4 rounded-lg bg-primary-muted border border-border">
                  <p className="text-xs font-semibold text-text-secondary mb-2.5" style={{ fontFamily: 'inherit' }}>
                    المرفقات:
                  </p>
                  <div className="space-y-2">
                    {currentSession.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url || attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-link hover:text-on-tint transition-colors"
                        style={{ fontFamily: 'inherit' }}
                      >
                        <span>📎</span>
                        <span>{attachment.name || attachment.filename || `مرفق ${index + 1}`}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Treatment Sequence */}
              {currentSession?.treatment_sequence && (
                <div className="p-4 rounded-lg bg-primary-muted border border-border">
                  <p className="text-xs font-semibold text-text-secondary mb-2.5" style={{ fontFamily: 'inherit' }}>
                    التسلسل العلاجي:
                  </p>
                  <p className="text-sm text-text leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'inherit' }}>
                    {currentSession.treatment_sequence}
                  </p>
                </div>
              )}
            </div>

            {/* Supervisor Feedback */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-text mb-2.5" style={{ fontFamily: 'inherit' }}>
                ملاحظات المشرف
              </label>
              <textarea
                value={sessionFeedback}
                onChange={(e) => setSessionFeedback(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-border-strong bg-primary-muted px-4 py-2.5 text-sm text-text placeholder-text-secondary/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all resize-none"
                placeholder="أضف ملاحظاتك على الجلسة..."
                style={{ fontFamily: 'inherit' }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => handleReviewSession(selectedSession.id, 'approved')}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-light hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                style={{ fontFamily: 'inherit' }}
              >
                <CheckCircleIcon className="h-5 w-5" />
                موافقة
              </button>
              <button
                onClick={() => handleReviewSession(selectedSession.id, 'rejected')}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-dark-lighter px-4 py-2.5 text-sm font-semibold text-light hover:bg-dark focus:outline-none focus:ring-2 focus:ring-dark-lighter focus:ring-offset-2 transition-colors"
                style={{ fontFamily: 'inherit' }}
              >
                <XCircleIcon className="h-5 w-5" />
                رفض
              </button>
              <button
                onClick={() => {
                  setShowSessionModal(false);
                  setSelectedSession(null);
                  setSessionFeedback('');
                }}
                className="flex-1 rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-sm font-medium text-text hover:bg-primary-muted hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                style={{ fontFamily: 'inherit' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supervisor Decision Modal - قرار المشرف على حالة جديدة */}
      {showSupervisorDecisionModal && (
        <div className="fixed inset-0 bg-dark/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-text mb-4" style={{ fontFamily: 'inherit' }}>
              {supervisorDecision === 'accept' ? 'قبول الحالة' : 'رفض الحالة'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-text mb-2" style={{ fontFamily: 'inherit' }}>
                ملاحظة (اختياري)
              </label>
              <textarea
                value={supervisorDecisionNote}
                onChange={(e) => setSupervisorDecisionNote(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border-strong bg-primary-muted px-4 py-2.5 text-sm text-text placeholder-text-secondary/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all resize-none"
                placeholder="أضف ملاحظة حول القرار..."
                style={{ fontFamily: 'inherit' }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSupervisorDecision}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-light transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  supervisorDecision === 'accept'
                    ? 'bg-success-500 hover:bg-success-600 focus:ring-success-400'
                    : 'bg-danger-500 hover:bg-danger-600 focus:ring-danger-400'
                }`}
                style={{ fontFamily: 'inherit' }}
              >
                {supervisorDecision === 'accept' ? 'قبول' : 'رفض'}
              </button>
              <button
                onClick={() => {
                  setShowSupervisorDecisionModal(false);
                  setSupervisorDecisionNote('');
                }}
                className="flex-1 rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-sm font-medium text-text hover:bg-primary-muted hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                style={{ fontFamily: 'inherit' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal - تغيير حالة الحالة */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-dark/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-text mb-4" style={{ fontFamily: 'inherit' }}>
              تغيير حالة الحالة
            </h3>
            <p className="text-sm text-text-secondary mb-4" style={{ fontFamily: 'inherit' }}>
              هل أنت متأكد من تغيير حالة الحالة إلى <strong>{statusLabels[newStatus]}</strong>؟
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleStatusChange(newStatus)}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-light hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                style={{ fontFamily: 'inherit' }}
              >
                تأكيد
              </button>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setNewStatus('');
                }}
                className="flex-1 rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-sm font-medium text-text hover:bg-primary-muted hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                style={{ fontFamily: 'inherit' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


