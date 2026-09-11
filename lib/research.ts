import type { Paper } from '@/context/AppContext';

type SemanticPaper = {
  paperId?: string;
  title?: string;
  authors?: Array<{ name?: string }>;
  year?: number | null;
  abstract?: string | null;
  citationCount?: number;
  url?: string;
  openAccessPdf?: { url?: string } | null;
};

function cleanText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

export const MOCK_PAPERS: Paper[] = [
  {
    id: 'fallback:attention',
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar'],
    year: 2017,
    abstract: 'تقدم هذه الورقة بنية Transformer التي تعتمد على آليات الانتباه لمعالجة التسلسلات، وتوضح كيف يمكن تحقيق نتائج قوية في فهم اللغة دون الاعتماد على الشبكات المتكررة.',
    citationCount: 0,
    source: 'Semantic Scholar',
    url: 'https://arxiv.org/abs/1706.03762',
    isFallback: true,
  },
  {
    id: 'fallback:resnet',
    title: 'Deep Residual Learning for Image Recognition',
    authors: ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren'],
    year: 2015,
    abstract: 'تقدم الورقة الشبكات المتبقية كطريقة لتدريب نماذج أعمق في الرؤية الحاسوبية، مع معالجة مشكلة تدهور الدقة التي تظهر عند زيادة عمق الشبكة.',
    citationCount: 0,
    source: 'Semantic Scholar',
    url: 'https://arxiv.org/abs/1512.03385',
    isFallback: true,
  },
  {
    id: 'fallback:bert',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee'],
    year: 2018,
    abstract: 'تشرح هذه الورقة أسلوباً لتدريب تمثيلات لغوية ثنائية الاتجاه مسبقاً، ثم تكييفها مع مهام متعددة في معالجة اللغة الطبيعية.',
    citationCount: 0,
    source: 'Semantic Scholar',
    url: 'https://arxiv.org/abs/1810.04805',
    isFallback: true,
  },
];

async function fetchWithCorsFallback(url: string) {
  try {
    const direct = await fetch(url);
    if (direct.ok) return direct;
  } catch {
    // Browsers may reject the direct request before a Response is returned.
  }

  const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  const proxied = await fetch(proxiedUrl);
  if (!proxied.ok) throw new Error(`Request failed with ${proxied.status}`);
  return proxied;
}

function semanticToPaper(item: SemanticPaper): Paper | null {
  if (!item.paperId || !item.title) return null;
  return {
    id: `s2:${item.paperId}`,
    title: cleanText(item.title),
    authors: (item.authors ?? []).map((author) => cleanText(author.name)).filter(Boolean).slice(0, 4),
    year: item.year ?? null,
    abstract: cleanText(item.abstract) || 'لا توجد ملخصات متاحة لهذه الورقة.',
    citationCount: item.citationCount ?? 0,
    source: 'Semantic Scholar',
    url: item.openAccessPdf?.url || item.url || `https://www.semanticscholar.org/paper/${item.paperId}`,
  };
}

function tag(xml: string, name: string) {
  const match = xml.match(new RegExp(`<${name}(?: [^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return cleanText(match?.[1]?.replace(/<!\\[CDATA\\[|\\]\\]>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
}

function arxivToPapers(xml: string): Paper[] {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].flatMap((match) => {
    const entry = match[1];
    const id = tag(entry, 'id');
    const title = tag(entry, 'title');
    const abstract = tag(entry, 'summary');
    if (!id || !title) return [];
    const published = tag(entry, 'published');
    return [{
      id: `arxiv:${id.split('/').pop()}`,
      title,
      authors: [...entry.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/gi)]
        .map((author) => cleanText(author[1])).slice(0, 4),
      year: published ? Number(published.slice(0, 4)) : null,
      abstract,
      citationCount: 0,
      source: 'arXiv' as const,
      url: id,
    }];
  });
}

export async function searchPapers(query: string, category: string) {
  const scopedQuery = category === 'الكل' ? query : `${query} ${category}`;
  const encoded = encodeURIComponent(scopedQuery);
  const semanticUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encoded}&limit=12&fields=title,authors,year,abstract,citationCount,url,openAccessPdf`;
  const arxivUrl = `https://export.arxiv.org/api/query?search_query=all:${encoded}&start=0&max_results=8&sortBy=relevance`;
  const [semanticResponse, arxivResponse] = await Promise.all([
    fetchWithCorsFallback(semanticUrl).catch(() => null),
    fetchWithCorsFallback(arxivUrl).catch(() => null),
  ]);
  if (!semanticResponse && !arxivResponse) {
    return MOCK_PAPERS.map((paper) => ({ ...paper }));
  }
  const semanticJson = semanticResponse ? await semanticResponse.json() as { data?: SemanticPaper[] } : { data: [] };
  const arxivXml = arxivResponse ? await arxivResponse.text() : '';
  const semanticPapers = (semanticJson.data ?? []).map(semanticToPaper).filter((paper): paper is Paper => Boolean(paper));
  const realPapers = [...semanticPapers, ...arxivToPapers(arxivXml)].filter((paper, index, array) =>
    array.findIndex((candidate) => candidate.title.toLowerCase() === paper.title.toLowerCase()) === index
  );
  return realPapers.length > 0 ? realPapers : MOCK_PAPERS.map((paper) => ({ ...paper }));
}

export async function summarizeAbstract(paper: Paper) {
  const token = process.env.EXPO_PUBLIC_HF_TOKEN;
  if (!token) {
    throw new Error('أضف EXPO_PUBLIC_HF_TOKEN لتفعيل التلخيص بالذكاء الاصطناعي.');
  }
  const response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: paper.abstract.slice(0, 6000), parameters: { max_length: 180, min_length: 40 } }),
  });
  if (!response.ok) throw new Error('تعذّر إنشاء الملخص حالياً');
  const result = await response.json() as Array<{ summary_text?: string }>;
  return result[0]?.summary_text || 'لم يصل ملخص من الخدمة.';
}