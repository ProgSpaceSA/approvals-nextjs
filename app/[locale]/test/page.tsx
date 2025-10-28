interface TestPageProps {
  params: Promise<{ locale: string }>
}

export default async function TestPage({ params }: TestPageProps) {
  const { locale } = await params
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Test Page</h1>
      <p>Current locale: {locale}</p>
      <p>This is a test page to verify locale routing works.</p>
      <div style={{ direction: locale === 'ar' ? 'rtl' : 'ltr' }}>
        <p>{locale === 'ar' ? 'مرحبا بك في صفحة الاختبار' : 'Welcome to the test page'}</p>
      </div>
    </div>
  )
}
