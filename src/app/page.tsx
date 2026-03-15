import Link from 'next/link';
import Image from 'next/image';
import { HeaderWithSession as Header } from '@/components/layout/HeaderWithSession';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
  return (
    <div className='h-screen bg-white flex flex-col overflow-hidden'>
      <Header />

      {/* Hero */}
      <main className='flex-1 overflow-y-auto'>
        <div className='flex flex-col items-center justify-center px-6 text-center'>
          {/* Dashboard preview */}
          <div className='mt-16 w-full max-w-5xl rounded-xl overflow-hidden border shadow-2xl'>
            <Image
              src='/dashboard.png'
              alt='대시보드 미리보기'
              width={1280}
              height={720}
              className='w-full h-auto'
              priority
            />
          </div>
          <h1 className='text-5xl py-12 font-bold tracking-tight text-foreground max-w-3xl'>
            사용 이벤트를 수집하고{' '}
            <span className='text-primary'>분석하세요</span>
          </h1>
          <p className='mt-6 text-lg text-muted-foreground max-w-xl'>
            계정 없이 시작하세요. 데이터셋을 만들고, REST API로 이벤트를
            전송하고, 데이터를 분석하세요 — API 키 한 쌍만으로 가능합니다.
          </p>
          {/* Dashboard preview */}
          <div className='mt-16 w-full max-w-5xl rounded-xl overflow-hidden border shadow-2xl'>
            <Image
              src='/dashboard.png'
              alt='대시보드 미리보기'
              width={1280}
              height={720}
              className='w-full h-auto'
              priority
            />
          </div>

          <div className='mt-10 flex items-center gap-4'>
            <Button asChild size='lg'>
              <Link href='/datasets/new'>새 데이터셋 만들기</Link>
            </Button>
            <Button asChild variant='outline' size='lg'>
              <Link href='/access'>기존 데이터셋 열기</Link>
            </Button>
          </div>

          {/* 3-step flow */}
          <div className='mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl w-full text-left'>
            {[
              {
                step: '01',
                title: '데이터셋 만들기',
                desc: 'dataset_id, ingest_key, admin_key가 즉시 발급됩니다.',
              },
              {
                step: '02',
                title: '이벤트 전송',
                desc: 'ingest_key로 REST API를 통해 이벤트를 전송하세요 — 단건 또는 일괄 전송 지원.',
              },
              {
                step: '03',
                title: '분석 & 내보내기',
                desc: '데이터를 필터링, 정렬하고 JSON 또는 Excel로 내보내세요.',
              },
            ].map((item) => (
              <div key={item.step} className='flex flex-col gap-2'>
                <span className='text-5xl font-bold text-primary/20'>
                  {item.step}
                </span>
                <h3 className='font-semibold text-foreground'>{item.title}</h3>
                <p className='text-sm text-muted-foreground'>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
