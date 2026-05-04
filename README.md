<div dir="rtl" align="center">

# MediSmile · لوحة تحكم المشرفين

**واجهة ويب حديثة لمشرفي نظام MediSmile — متابعة الحالات السريرية، الجلسات، المواعيد، والتقارير من مكان واحد.**

<sub>لوحة إشراف طبية وأكاديمية · Supervisor Dashboard</sub>

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-764ABC?style=flat-square&logo=redux&logoColor=white)](https://redux-toolkit.js.org/)

</div>

---

## نبذة عن المشروع 💡

هذا المستودع يضم **لوحة تحكم المشرفين** الخاصة بمنصة **MediSmile**: تطبيق ويب مبني على **Next.js** يتيح للمشرفين الإشراف على سير العمل الطبي والأكاديمي — من مراجعة الحالات والجلسات إلى إدارة المواعيد والمحتوى المجتمعي، مع لوحات للتقييمات والتقارير والإحصائيات لدعم القرار اليومي.

---

## المميزات الرئيسية ✨

| · | المجال | الوصف |
|:---:|:--------|:--------|
| 🏥 | **الحالات السريرية** | إدارة ومتابعة الحالات ضمن النظام |
| 📝 | **الجلسات العلاجية** | مراجعة وتتبع الجلسات |
| 📅 | **المواعيد** | تنظيم وجدولة المواعيد |
| 🎓 | **التقييمات الأكاديمية** | متابعة الأداء والتقييمات |
| 🌐 | **المحتوى المجتمعي** | إدارة المحتوى الموجّه للمجتمع |
| 📊 | **التقارير والإحصائيات** | نظرة شاملة على البيانات والمؤشرات |

---

## التقنيات المستخدمة 🛠️

| الفئة | الأدوات |
|--------|---------|
| **إطار العمل** | Next.js 15 · React 19 |
| **الحالة** | Redux Toolkit · React Redux |
| **التنسيق** | Tailwind CSS |
| **الحركة والأيقونات** | Framer Motion · Heroicons · Lucide React |
| **الشبكة** | Axios |
| **رسوم بيانية** | Recharts |
| **تصدير** | jsPDF · xlsx |
| **اللغات** | i18next · next-intl |

---

## البدء السريع 🚀

```bash
# تثبيت الحزم
npm install

# تشغيل المشروع في وضع التطوير
npm run dev

# بناء المشروع للإنتاج
npm run build

# تشغيل المشروع بعد البناء
npm start
```

بعد التشغيل، افتح المتصفح على العنوان الذي يعرضه الطرفية (عادة `http://localhost:3000`).

---

## متغيرات البيئة 🔐

### الإنتاج (Railway / Render)

عيّن المتغير التالي في منصة الاستضافة:

```env
NEXT_PUBLIC_API_URL=https://medismile1-production.up.railway.app/api
```

### التطوير المحلي (اختياري)

أنشئ ملف `.env.local` في جذر المشروع:

```env
NEXT_PUBLIC_API_URL=https://medismile1-production.up.railway.app/api
```

---

## هيكل المشروع 📁

```
src/
├── app/              # Next.js App Router
│   ├── dashboard/    # صفحات لوحة التحكم
│   ├── cases/        # الحالات السريرية
│   ├── sessions/     # الجلسات العلاجية
│   ├── appointments/ # المواعيد
│   ├── evaluations/  # التقييمات
│   ├── content/      # المحتوى المجتمعي
│   ├── reports/      # التقارير
│   └── profile/      # الملف الشخصي
├── components/       # المكونات المشتركة
├── store/            # Redux Store
├── services/         # خدمات API
├── hooks/            # React Hooks مخصصة
└── lib/              # أدوات مساعدة
```

---

## الترخيص 📄

جميع الحقوق محفوظة © 2026 MediSmile
