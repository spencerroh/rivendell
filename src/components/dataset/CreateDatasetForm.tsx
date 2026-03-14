'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AdvancedSettings } from '@/components/dataset/AdvancedSettings';
import type {
  DimAlias,
  MetricAlias,
} from '@/components/dataset/AdvancedSettings';

export function CreateDatasetForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dims, setDims] = useState<DimAlias[]>([]);
  const [metrics, setMetrics] = useState<MetricAlias[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          dims: dims.length > 0 ? dims : undefined,
          metrics: metrics.length > 0 ? metrics : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? '데이터셋 생성에 실패했습니다');
        return;
      }

      // 키는 sessionStorage에 저장 후 success 페이지로
      sessionStorage.setItem(
        'rivendell_new_dataset',
        JSON.stringify(json.data),
      );
      router.push('/datasets/new/success');
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='space-y-2'>
        <Label htmlFor='name'>데이터셋 이름 *</Label>
        <Input
          id='name'
          placeholder='예: 내 앱 이벤트'
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='description'>설명</Label>
        <Textarea
          id='description'
          placeholder='목적 / 담당자 / 부서'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
        />
      </div>

      <AdvancedSettings
        dims={dims}
        metrics={metrics}
        onDimsChange={setDims}
        onMetricsChange={setMetrics}
      />

      {error && <p className='text-sm text-destructive'>{error}</p>}

      <Button
        type='submit'
        className='w-full'
        disabled={loading || !name.trim()}
      >
        {loading ? '생성 중...' : '데이터셋 만들기'}
      </Button>
    </form>
  );
}
