import Link from 'next/link';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

const categories = [
  {
    title: 'General & Core Experience',
    questions: [
      {
        question: 'What makes Kivo different from traditional document editors?',
        answer:
          'Kivo is designed from the ground up for speed, deep focus, and seamless intelligence. It combines a clean block-based editor, nested sub-pages, and an autonomous AI pair-writer without bloated menus or laggy interfaces.',
      },
      {
        question: 'Can I use Kivo on both web and desktop?',
        answer:
          'Yes. Kivo is fully available as a web app and as a native desktop application with instantaneous synchronization across your devices.',
      },
    ],
  },
  {
    title: 'AI & Pair-Writing',
    questions: [
      {
        question: 'How does Kivo AI work within my workspace?',
        answer:
          'Kivo AI connects directly to your documents. You can ask it to draft content, summarize complex notes, edit specific sentences, or find pages by topic. It presents clean interactive page buttons without overwriting your work unexpectedly.',
      },
      {
        question: 'Can I ask Kivo AI to find specific notes?',
        answer:
          'Yes! Simply ask Kivo AI to search for any topic or note in chat. It searches across your workspace titles and contents and provides direct one-click buttons to open the matching pages.',
      },
    ],
  },
  {
    title: 'Privacy & Security',
    questions: [
      {
        question: 'Is my document data secure and private?',
        answer:
          'Absolutely. Your documents and workspace contents are strictly isolated to your authenticated account and are never used to train public machine learning models.',
      },
      {
        question: 'Can I restore deleted pages or conversations?',
        answer:
          'Yes. Every deletion requires explicit confirmation to prevent accidental loss, and your thinking is always protected.',
      },
    ],
  },
];

export const FAQ = ({
  headerTag = 'h2',
  className,
  className2,
}: {
  headerTag?: 'h1' | 'h2';
  className?: string;
  className2?: string;
}) => {
  return (
    <section id="faq" className={cn('py-28 lg:py-32', className)}>
      <div className="container max-w-5xl">
        <div className={cn('mx-auto grid gap-16 lg:grid-cols-2', className2)}>
          <div className="space-y-4">
            {headerTag === 'h1' ? (
              <h1 className="text-2xl tracking-tight md:text-4xl lg:text-5xl">Got Questions?</h1>
            ) : (
              <h2 className="text-2xl tracking-tight md:text-4xl lg:text-5xl">Got Questions?</h2>
            )}
            <p className="text-muted-foreground max-w-md leading-snug lg:mx-auto">
              If you can't find what you're looking for,{' '}
              <Link href="/contact" className="underline underline-offset-4">
                get in touch
              </Link>
              .
            </p>
          </div>

          <div className="grid gap-6 text-start">
            {categories.map((category, categoryIndex) => (
              <div key={category.title} className="">
                <h3 className="text-muted-foreground border-b py-4">{category.title}</h3>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, i) => (
                    <AccordionItem key={i} value={`${categoryIndex}-${i}`}>
                      <AccordionTrigger>{item.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
