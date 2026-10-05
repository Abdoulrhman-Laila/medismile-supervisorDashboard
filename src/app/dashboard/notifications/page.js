'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchNotifications,
  fetchNotificationById,
  markNotificationAsRead,
  updateNotificationStatus,
  markAllAsRead,
  clearCurrentNotification,
  websocketNotificationReceived,
} from '@/store/slices/notificationsSlice';
import {
  BellIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const priorityLabels = {
  low: 'منخفضة',
  normal: 'عادية',
  high: 'عالية',
  critical: 'حرجة',
};

const priorityColors = {
  low: 'bg-primary-muted text-on-tint',
  normal: 'bg-tint text-on-tint-strong',
  high: 'bg-tint-strong text-on-tint-strong',
  critical: 'bg-primary text-light',
};

const statusLabels = {
  pending: 'قيد الانتظار',
  accepted: 'مقبولة',
  rejected: 'مرفوضة',
  info: 'معلوماتية',
};

const statusColors = {
  pending: 'bg-tint-strong text-on-tint-strong',
  accepted: 'bg-primary text-light',
  rejected: 'bg-dark-lighter text-light',
  info: 'bg-tint text-on-tint-strong',
};

const getNotificationIcon = (notificationType) => {
  if (notificationType?.includes('report')) return CheckCircleIcon;
  if (notificationType?.includes('session')) return ClockIcon;
  if (notificationType?.includes('case')) return InformationCircleIcon;
  if (notificationType?.includes('content')) return BellIcon;
  if (notificationType?.includes('evaluation')) return CheckCircleIcon;
  if (notificationType?.includes('system') || notificationType?.includes('security'))
    return ExclamationTriangleIcon;
  return BellIcon;
};

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { notifications = [], loading, unreadCount, currentNotification, pagination } = useAppSelector(
    (state) => state.notifications
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const [localFilters, setLocalFilters] = useState({
    is_read: '',
    priority: '',
    status: '',
    notification_type: '',
  });

  useEffect(() => {
    dispatch(fetchNotifications({ page_size: 20 }));
  }, [dispatch]);

  // تحديث تلقائي للإشعارات كل 30 ثانية (backup)
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchNotifications({ page_size: 20 })).catch((error) => {
        // لا نعرض toast للأخطاء في polling (لتجنب الإزعاج)
        console.error('Failed to refresh notifications:', error);
      });
    }, 30000); // 30 ثانية

    return () => clearInterval(interval);
  }, [dispatch]);

  // WebSocket connection للإشعارات
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // استخدام sessionStorage للـ access token (أكثر أماناً)
    const token = sessionStorage.getItem('access_token');
    if (!token) {
      console.warn('No access token found for WebSocket connection');
      return;
    }

    const apiURL = process.env.NEXT_PUBLIC_API_URL || 'https://api.medismile.xn--mgbaab0cxheq.tech/api';
    const wsURL = apiURL.replace(/^https?/, apiURL.startsWith('https') ? 'wss' : 'ws').replace(/\/api$/, '');
    const fullWSURL = `${wsURL}/ws/notifications/?token=${encodeURIComponent(token)}`;
    
    console.log('Attempting WebSocket connection to:', wsURL + '/ws/notifications/');
    
    let ws;
    try {
      ws = new WebSocket(fullWSURL);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      return;
    }

    ws.onopen = () => {
      console.log('WebSocket connected for notifications');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // معالجة أنواع الأحداث المختلفة
        if (data.event) {
          dispatch(websocketNotificationReceived({
            event: data.event,
            data: data.data || data,
          }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      // WebSocket error events don't contain much information
      // Log the WebSocket state and URL for debugging
      console.error('WebSocket error for notifications:', {
        readyState: ws?.readyState,
        url: fullWSURL.substring(0, 50) + '...', // Don't log full token
        error: error,
      });
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed for notifications:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
      // إعادة الاتصال بعد 5 ثوانٍ فقط إذا لم يكن إغلاقاً طوعياً
      if (event.code !== 1000 && event.code !== 1001) {
        setTimeout(() => {
          // استخدام sessionStorage للـ access token (أكثر أماناً)
          if (typeof window !== 'undefined' && sessionStorage.getItem('access_token')) {
            // سيتم إعادة الاتصال تلقائياً عند تحميل الصفحة مرة أخرى
            console.log('WebSocket will reconnect on next page load');
          }
        }, 5000);
      }
    };

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Component unmounting');
      }
    };
  }, [dispatch]);

  useEffect(() => {
    if (selectedNotificationId) {
      dispatch(fetchNotificationById(selectedNotificationId));
    }
  }, [selectedNotificationId, dispatch]);

  const filteredNotifications = Array.isArray(notifications)
    ? notifications.filter((notification) => {
        const matchesSearch =
          notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.message?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRead =
          localFilters.is_read === '' ||
          (localFilters.is_read === 'read' && notification.is_read) ||
          (localFilters.is_read === 'unread' && !notification.is_read);

        const matchesPriority =
          !localFilters.priority || notification.priority === localFilters.priority;

        const matchesStatus =
          !localFilters.status || notification.status === localFilters.status;

        const matchesType =
          !localFilters.notification_type ||
          notification.notification_type === localFilters.notification_type;

        return matchesSearch && matchesRead && matchesPriority && matchesStatus && matchesType;
      })
    : [];

  const handleMarkAsRead = async (notificationId) => {
    try {
      const result = await dispatch(markNotificationAsRead(notificationId));
      if (markNotificationAsRead.fulfilled.match(result)) {
        toast.success('تم تمييز الإشعار كمقروء');
        dispatch(fetchNotifications());
      } else {
        toast.error('فشل تحديث الإشعار');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الإشعار');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await dispatch(markAllAsRead());
      if (markAllAsRead.fulfilled.match(result)) {
        toast.success('تم تمييز جميع الإشعارات كمقروءة');
        dispatch(fetchNotifications());
      } else {
        // إذا لم يكن endpoint موجود، نقوم بتمييز كل إشعار على حدة
        const unreadNotifications = notifications.filter((n) => !n.is_read);
        for (const notification of unreadNotifications) {
          await dispatch(markNotificationAsRead(notification.id));
        }
        toast.success('تم تمييز جميع الإشعارات كمقروءة');
        dispatch(fetchNotifications());
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الإشعارات');
    }
  };

  const handleUpdateStatus = async (notificationId, status) => {
    try {
      const result = await dispatch(
        updateNotificationStatus({ notificationId, status, response_message: '' })
      );
      if (updateNotificationStatus.fulfilled.match(result)) {
        toast.success('تم تحديث حالة الإشعار');
        dispatch(fetchNotifications());
        if (selectedNotificationId === notificationId) {
          setShowDetailsModal(false);
        }
      } else {
        toast.error('فشل تحديث حالة الإشعار');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث حالة الإشعار');
    }
  };

  const handleNotificationClick = async (notification) => {
    setSelectedNotificationId(notification.id);
    setShowDetailsModal(true);

    // تمييز كمقروء إذا لم يكن مقروءاً
    if (!notification.is_read) {
      await dispatch(markNotificationAsRead(notification.id));
    }
  };

  const handleNavigateToTarget = (notification) => {
    if (notification.target_type && notification.target_object_id) {
      switch (notification.target_type) {
        case 'report':
          router.push(`/dashboard/reports`);
          break;
        case 'case':
          router.push(`/dashboard/cases/${notification.target_object_id}`);
          break;
        case 'session':
          router.push(`/dashboard/cases/${notification.case?.id || ''}`);
          break;
        case 'content':
          router.push(`/dashboard/content`);
          break;
        case 'evaluation':
          router.push(`/dashboard/evaluations`);
          break;
        default:
          break;
      }
    }
    setShowDetailsModal(false);
  };

  const stats = {
    total: Array.isArray(notifications) ? notifications.length : 0,
    unread: unreadCount,
    read: Array.isArray(notifications)
      ? notifications.filter((n) => n.is_read).length
      : 0,
    high: Array.isArray(notifications)
      ? notifications.filter((n) => n.priority === 'high' || n.priority === 'critical').length
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2" style={{ fontFamily: 'inherit' }}>
            الإشعارات
          </h1>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed" style={{ fontFamily: 'inherit' }}>
            عرض وإدارة جميع الإشعارات الخاصة بك
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-light hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <CheckCircleIcon className="h-5 w-5" />
            تمييز الكل كمقروء
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-surface border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-secondary mb-1">إجمالي الإشعارات</p>
              <p className="text-2xl font-bold text-text">{stats.total}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-tint flex items-center justify-center">
                <BellIcon className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-surface border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-secondary mb-1">غير مقروءة</p>
              <p className="text-2xl font-bold text-text">{stats.unread}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-tint-strong flex items-center justify-center">
                <div className="h-5 w-5 rounded-full bg-primary-hover"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-surface border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-secondary mb-1">مقروءة</p>
              <p className="text-2xl font-bold text-text">{stats.read}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-tint flex items-center justify-center">
                <div className="h-5 w-5 rounded-full bg-primary"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-surface border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-secondary mb-1">عالية الأولوية</p>
              <p className="text-2xl font-bold text-text">{stats.high}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-accent-soft flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-on-tint" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-lg bg-surface border border-border p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-text-secondary" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن إشعار..."
              className="block w-full rounded-lg border-2 border-border-strong bg-primary-muted px-4 py-2.5 pr-10 text-sm text-text placeholder-text-secondary/60 focus:border-ring focus:bg-surface focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all duration-200"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border-2 border-border-strong bg-primary-muted px-4 py-2.5 text-sm font-semibold text-text hover:bg-tint-hover hover:border-border-hover transition-colors focus:outline-none focus:ring-2 focus:ring-ring/20"
          >
            <FunnelIcon className="h-5 w-5" />
            فلترة
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-5 pt-5 grid grid-cols-1 gap-4 border-t border-border sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-semibold text-text mb-2.5">الحالة</label>
              <select
                value={localFilters.is_read}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, is_read: e.target.value })
                }
                className="w-full rounded-lg border-2 border-border-strong bg-primary-muted px-4 py-2.5 text-sm text-text focus:border-ring focus:bg-surface focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all duration-200"
              >
                <option value="">الكل</option>
                <option value="read">مقروءة</option>
                <option value="unread">غير مقروءة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text mb-2.5">الأولوية</label>
              <select
                value={localFilters.priority}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, priority: e.target.value })
                }
                className="w-full rounded-lg border-2 border-border-strong bg-primary-muted px-4 py-2.5 text-sm text-text focus:border-ring focus:bg-surface focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all duration-200"
              >
                <option value="">الكل</option>
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text mb-2.5">حالة الإشعار</label>
              <select
                value={localFilters.status}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, status: e.target.value })
                }
                className="w-full rounded-lg border-2 border-border-strong bg-primary-muted px-4 py-2.5 text-sm text-text focus:border-ring focus:bg-surface focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all duration-200"
              >
                <option value="">الكل</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text mb-2.5">النوع</label>
              <select
                value={localFilters.notification_type}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, notification_type: e.target.value })
                }
                className="w-full rounded-lg border-2 border-border-strong bg-primary-muted px-4 py-2.5 text-sm text-text focus:border-ring focus:bg-surface focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all duration-200"
              >
                <option value="">الكل</option>
                <option value="report_submitted">تقرير جديد</option>
                <option value="session_needs_review">جلسة تحتاج مراجعة</option>
                <option value="community_content_pending">محتوى معلق</option>
                <option value="case_created">حالة جديدة</option>
                <option value="system_alert">تنبيه النظام</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="rounded-lg bg-surface border border-border overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-base font-semibold text-text-secondary leading-relaxed">جاري تحميل الإشعارات...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <BellIcon className="mx-auto h-12 w-12 text-text-secondary" />
            <p className="mt-4 text-base font-semibold text-text leading-relaxed">لا توجد إشعارات</p>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              {searchTerm || Object.values(localFilters).some((f) => f)
                ? 'لا توجد إشعارات تطابق معايير البحث'
                : 'لا توجد إشعارات حتى الآن'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredNotifications.map((notification) => {
              const NotificationIcon = getNotificationIcon(notification.notification_type);

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-5 sm:p-6 hover:bg-primary-muted transition-colors cursor-pointer ${
                    !notification.is_read ? 'bg-primary-muted' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          !notification.is_read
                            ? 'bg-tint text-link'
                            : 'bg-primary-muted text-text-secondary'
                        }`}
                      >
                        <NotificationIcon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-base font-semibold text-text leading-relaxed">
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0"></span>
                            )}
                          </div>
                          <p className="text-sm text-text-secondary mb-3 line-clamp-2 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                                priorityColors[notification.priority] || priorityColors.normal
                              }`}
                            >
                              {priorityLabels[notification.priority] || notification.priority}
                            </span>
                            {notification.status && (
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                                  statusColors[notification.status] || statusColors.info
                                }`}
                              >
                                {statusLabels[notification.status] || notification.status}
                              </span>
                            )}
                            <span className="text-xs text-text-secondary">
                              {new Date(notification.created_at).toLocaleDateString('ar-SA', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {!notification.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="rounded-lg border-2 border-border-strong bg-surface px-3 py-1.5 text-xs font-semibold text-text hover:bg-primary-muted hover:border-border-hover transition-colors focus:outline-none focus:ring-2 focus:ring-ring/20"
                            >
                              تمييز كمقروء
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && (pagination.next || pagination.previous) && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-primary-muted">
            <div className="flex items-center gap-2">
              <p className="text-sm text-text-secondary" style={{ fontFamily: 'inherit' }}>
                إجمالي: {pagination.count || notifications.length} إشعار
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (pagination.previous) {
                    try {
                      // استخدام URL الكامل إذا كان متاحاً
                      const url = new URL(pagination.previous);
                      const page = url.searchParams.get('page');
                      const cursor = url.searchParams.get('cursor');
                      
                      if (cursor) {
                        await dispatch(fetchNotifications({ cursor, page_size: 20 }));
                      } else if (page) {
                        await dispatch(fetchNotifications({ page, page_size: 20 }));
                      } else {
                        // استخدام URL الكامل كـ query parameter
                        await dispatch(fetchNotifications({ previous: pagination.previous, page_size: 20 }));
                      }
                    } catch (error) {
                      toast.error('فشل تحميل الصفحة السابقة');
                    }
                  }
                }}
                disabled={!pagination.previous || loading}
                className="flex items-center gap-2 rounded-lg border-2 border-border-strong bg-surface px-3 py-2 text-sm font-semibold text-text hover:bg-primary-muted hover:border-border-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring/20"
              >
                <ChevronRightIcon className="h-4 w-4" />
                السابق
              </button>
              <button
                onClick={async () => {
                  if (pagination.next) {
                    try {
                      // استخدام URL الكامل إذا كان متاحاً
                      const url = new URL(pagination.next);
                      const page = url.searchParams.get('page');
                      const cursor = url.searchParams.get('cursor');
                      
                      if (cursor) {
                        await dispatch(fetchNotifications({ cursor, page_size: 20 }));
                      } else if (page) {
                        await dispatch(fetchNotifications({ page, page_size: 20 }));
                      } else {
                        // استخدام URL الكامل كـ query parameter
                        await dispatch(fetchNotifications({ next: pagination.next, page_size: 20 }));
                      }
                    } catch (error) {
                      toast.error('فشل تحميل الصفحة التالية');
                    }
                  }
                }}
                disabled={!pagination.next || loading}
                className="flex items-center gap-2 rounded-lg border-2 border-border-strong bg-surface px-3 py-2 text-sm font-semibold text-text hover:bg-primary-muted hover:border-border-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring/20"
              >
                التالي
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notification Details Modal */}
      {showDetailsModal && currentNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-surface border border-border p-6 max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-xl font-semibold text-text mb-5" style={{ fontFamily: 'inherit' }}>تفاصيل الإشعار</h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-text mb-2">العنوان</label>
                <p className="text-base font-semibold text-text leading-relaxed">{currentNotification.title}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text mb-2">الرسالة</label>
                <p className="text-sm text-text whitespace-pre-wrap leading-relaxed">
                  {currentNotification.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    الأولوية
                  </label>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      priorityColors[currentNotification.priority] || priorityColors.normal
                    }`}
                  >
                    {priorityLabels[currentNotification.priority] || currentNotification.priority}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">الحالة</label>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      statusColors[currentNotification.status] || statusColors.info
                    }`}
                  >
                    {statusLabels[currentNotification.status] || currentNotification.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">النوع</label>
                  <p className="text-sm font-semibold text-text leading-relaxed">{currentNotification.notification_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    تاريخ الإنشاء
                  </label>
                  <p className="text-sm font-semibold text-text leading-relaxed">
                    {new Date(currentNotification.created_at).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {currentNotification.payload && Object.keys(currentNotification.payload).length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    معلومات إضافية
                  </label>
                  <div className="rounded-lg bg-primary-muted border-2 border-border-strong p-4">
                    <pre className="text-xs text-text whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(currentNotification.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {currentNotification.proposed_changes &&
                Object.keys(currentNotification.proposed_changes).length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-text mb-2">
                      التغييرات المقترحة
                    </label>
                    <div className="rounded-lg bg-primary-muted border-2 border-border-strong p-4">
                      <pre className="text-xs text-text whitespace-pre-wrap leading-relaxed">
                        {JSON.stringify(currentNotification.proposed_changes, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
            </div>

            <div className="flex gap-3 mt-6">
              {currentNotification.target_type && currentNotification.target_object_id && (
                <button
                  onClick={() => handleNavigateToTarget(currentNotification)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-light hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  الانتقال للكائن المرتبط
                </button>
              )}
              {currentNotification.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(currentNotification.id, 'accepted')}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-light hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    قبول
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(currentNotification.id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-dark-lighter px-4 py-2.5 text-sm font-semibold text-light hover:bg-dark transition-colors focus:outline-none focus:ring-2 focus:ring-dark-lighter/30"
                  >
                    <XCircleIcon className="h-5 w-5" />
                    رفض
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedNotificationId(null);
                  dispatch(clearCurrentNotification());
                }}
                className="flex-1 rounded-lg border-2 border-border-strong bg-surface px-4 py-2.5 text-sm font-semibold text-text hover:bg-primary-muted hover:border-border-hover transition-colors focus:outline-none focus:ring-2 focus:ring-ring/20"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




