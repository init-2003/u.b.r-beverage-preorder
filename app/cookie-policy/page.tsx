'use client';

import Link from 'next/link';

export default function CookiePolicyPage() {
  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="max-w-4xl mx-auto">

        {/* Main Document Container */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {/* Top Brand Accent Stripe */}
          <div className="h-1 bg-[#c81415] w-full" />

          {/* Header Section */}
          <div className="p-6 sm:p-8 md:p-10 border-b border-slate-100 bg-gradient-to-b from-slate-50/60 to-white">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-[Prompt] tracking-tight">
                  นโยบายการใช้งานคุกกี้
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Cookie Policy &bull; ข้อกำหนดและรายละเอียดการจัดเก็บคุกกี้บนระบบสั่งจองสินค้า
                </p>
              </div>
              <div className="text-xs text-slate-400 sm:text-right shrink-0 space-y-0.5 pt-1">
                <div>มีผลบังคับใช้: <span className="text-slate-600 font-medium">23 กันยายน 2569</span></div>
                <div>ปรับปรุงล่าสุด: <span className="text-slate-600 font-medium">23 กันยายน 2569</span></div>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="p-6 sm:p-8 md:p-10 space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
            {/* Intro */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-lg p-4 sm:p-5 text-sm text-slate-700">
              <strong className="text-slate-900 font-medium">หจก. อุบลรุ่งเรืองเบฟเวอเรจ</strong> (&quot;เรา&quot;) ใช้คุกกี้และเทคโนโลยีที่คล้ายกันบนเว็บไซต์นี้
              เพื่อสนับสนุนการทำงานของระบบสั่งจองสินค้าออนไลน์ รักษาความปลอดภัยของเซสชันการเข้าสู่ระบบ
              และส่งมอบประสบการณ์การใช้งานที่ราบรื่น เอกสารนี้จัดทำขึ้นเพื่อให้ท่านเข้าใจถึงลักษณะการใช้งาน
              ประเภทของคุกกี้ และสิทธิในการจัดการคุกกี้ของท่านตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
            </div>

            {/* Section 1 */}
            <section className="space-y-3">
              <div className="border-l-4 border-[#c81415] pl-3 py-0.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-[Prompt]">
                  1. คุกกี้ (Cookies) คืออะไร?
                </h2>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-[15px] pl-1">
                คุกกี้ คือไฟล์ข้อความขนาดเล็กที่จัดเก็บบนอุปกรณ์คอมพิวเตอร์ แท็บเล็ต หรือสมาร์ทโฟนของท่านผ่านเว็บเบราว์เซอร์
                เมื่อท่านเข้าสู่เว็บไซต์ คุกกี้จะบันทึกข้อมูลการตั้งค่า สถานะการยืนยันตัวตน และพฤติกรรมการใช้งาน
                ซึ่งช่วยให้เว็บไซต์จดจำผู้ใช้และอำนวยความสะดวกในการใช้งานอย่างต่อเนื่อง
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <div className="border-l-4 border-[#c81415] pl-3 py-0.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-[Prompt]">
                  2. ประเภทของคุกกี้ที่เราใช้งาน
                </h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-[15px] pl-1">
                เราจัดหมวดหมู่คุกกี้ตามวัตถุประสงค์การใช้งานและมาตรฐานความปลอดภัย ดังนี้:
              </p>

              <div className="space-y-3.5">
                {/* 2.1 Strictly Necessary */}
                <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-[15px] font-[Prompt]">
                      2.1 คุกกี้ที่จำเป็นอย่างยิ่ง (Strictly Necessary Cookies)
                    </h3>
                    <span className="text-xs font-semibold text-[#c81415]">
                      จำเป็นต่อระบบ
                    </span>
                  </div>
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      คุกกี้ประเภทนี้มีความจำเป็นต่อการทำงานพื้นฐานของระบบ เช่น การรักษาความปลอดภัยของระบบสั่งจองสินค้า,
                      การจัดการเซสชันผู้ใช้งานเพื่อยืนยันตัวตนในการเข้าสู่ระบบ (Session Authentication),
                      การตรวจสอบสิทธิ์การเข้าถึงข้อมูลคำสั่งซื้อ และการป้องกันการโจมตีทางไซเบอร์
                    </p>
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-500">
                        ลักษณะ: จัดการเซสชันการยืนยันตัวตนและความปลอดภัยของระบบ
                      </span>
                      <span className="text-[#c81415] font-semibold">
                        ไม่สามารถปิดการใช้งานได้
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2.2 Functionality */}
                <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-[15px] font-[Prompt]">
                      2.2 คุกกี้เพื่อการทำงานของระบบ (Functionality Cookies)
                    </h3>
                    <span className="text-xs text-slate-500">
                      ทางเลือก
                    </span>
                  </div>
                  <div className="p-4 sm:p-5">
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      ช่วยจดจำการตั้งค่าและตัวเลือกของท่าน เช่น บันทึกสถานะการยอมรับข้อตกลง การแสดงผลหน้าจอ
                      หรือการตั้งค่าตัวกรองสินค้า เพื่อให้ท่านสามารถใช้งานเว็บไซต์ได้อย่างสะดวกในครั้งถัดไป
                    </p>
                  </div>
                </div>

                {/* 2.3 Analytics */}
                <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-[15px] font-[Prompt]">
                      2.3 คุกกี้เพื่อการวิเคราะห์และวัดผล (Analytics Cookies)
                    </h3>
                    <span className="text-xs text-slate-500">
                      ทางเลือก
                    </span>
                  </div>
                  <div className="p-4 sm:p-5">
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      ช่วยให้เราทราบถึงสถิติการเข้าชมหน้าเว็บ ปริมาณการใช้งาน และการตอบสนองของระบบ
                      เพื่อนำข้อมูลเชิงสถิติไปปรับปรุงประสิทธิภาพ ความเร็ว และความเสถียรของเว็บไซต์
                    </p>
                  </div>
                </div>

                {/* 2.4 Marketing */}
                <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-[15px] font-[Prompt]">
                      2.4 คุกกี้เพื่อการตลาด (Marketing Cookies)
                    </h3>
                    <span className="text-xs text-slate-500">
                      ทางเลือก
                    </span>
                  </div>
                  <div className="p-4 sm:p-5">
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      ใช้สำหรับนำเสนอข่าวสาร โปรโมชันสินค้าเครื่องดื่ม หรือสิทธิประโยชน์ที่เกี่ยวข้องกับพฤติกรรมและความต้องการของท่าน
                      โดยไม่มีการเปิดเผยข้อมูลส่วนบุคคลระบุตัวตนแก่บุคคลภายนอกที่ไม่เกี่ยวข้อง
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <div className="border-l-4 border-[#c81415] pl-3 py-0.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-[Prompt]">
                  3. การจัดการและการปิดการใช้งานคุกกี้
                </h2>
              </div>
              <div className="space-y-3 pl-1 text-slate-600 text-sm sm:text-[15px] leading-relaxed">
                <p>
                  ท่านสามารถเลือกยอมรับหรือปฏิเสธคุกกี้ที่มิใช่คุกกี้จำเป็นได้ตามความต้องการ
                  นอกจากนี้ ท่านสามารถตั้งค่าหรือลบประวัติคุกกี้ได้โดยตรงผ่านโปรแกรมเว็บเบราว์เซอร์ของท่าน:
                </p>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-xs sm:text-sm space-y-2 text-slate-700">
                  <div>
                    <strong className="text-slate-900">Google Chrome:</strong> การตั้งค่า &gt; ความเป็นส่วนตัวและความปลอดภัย &gt; คุกกี้และข้อมูลอื่นของไซต์
                  </div>
                  <div>
                    <strong className="text-slate-900">Microsoft Edge:</strong> การตั้งค่า &gt; คุกกี้และสิทธิ์ของไซต์ &gt; จัดการและลบคุกกี้
                  </div>
                  <div>
                    <strong className="text-slate-900">Apple Safari:</strong> การตั้งค่า (Preferences) &gt; ความเป็นส่วนตัว (Privacy) &gt; บล็อกคุกกี้ทั้งหมด
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  หมายเหตุ: หากท่านปิดการใช้งานคุกกี้ที่จำเป็นอย่างยิ่ง ระบบอาจไม่สามารถจดจำสถานะการเข้าสู่ระบบ
                  หรือฟังก์ชันการสั่งจองสินค้าอาจทำงานได้อย่างไม่สมบูรณ์
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <div className="border-l-4 border-[#c81415] pl-3 py-0.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-[Prompt]">
                  4. การเชื่อมโยงกับนโยบายความเป็นส่วนตัว
                </h2>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-[15px] pl-1">
                การเก็บรวบรวม การประมวลผล และการคุ้มครองข้อมูลส่วนบุคคลของท่านที่เกิดขึ้นผ่านการใช้งานเว็บไซต์
                อยู่ภายใต้ข้อกำหนดของ{' '}
                <Link
                  href="/privacy-policy"
                  className="text-[#c81415] hover:text-[#960d0e] font-semibold underline underline-offset-2 transition-colors"
                >
                  นโยบายความเป็นส่วนตัว (Privacy Policy)
                </Link>
                {' '}ของ หจก. อุบลรุ่งเรืองเบฟเวอเรจ โปรดศึกษาเพื่อรับทราบสิทธิของท่านภายใต้กฎหมาย PDPA
              </p>
            </section>

            {/* Contact / Footer Note */}
            <div className="pt-4">
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-5 sm:p-6 text-xs sm:text-sm text-slate-600 space-y-2">
                <div className="font-bold text-slate-900 font-[Prompt] text-sm sm:text-base">
                  ช่องทางการติดต่อสอบถาม
                </div>
                <p className="text-slate-600">
                  หากท่านมีข้อสงสัย ข้อเสนอแนะ หรือต้องการสอบถามข้อมูลเพิ่มเติมเกี่ยวกับการใช้งานคุกกี้ กรุณาติดต่อ:
                </p>
                <div className="text-slate-700 pt-1 space-y-0.5">
                  <div className="font-semibold text-slate-900">หจก. อุบลรุ่งเรืองเบฟเวอเรจ (สำนักงานใหญ่)</div>
                  <div>โทรศัพท์: 045-263-380</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
